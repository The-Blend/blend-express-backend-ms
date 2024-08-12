import { ObjectId } from "mongodb";
import { BlendItem } from "../types";
import { bucket, db } from "../middlewares/mongo";
import { BlendProcessor } from "../processors/blendProcessor";
import { Request, Response } from "express-serve-static-core";
import { PassThrough } from 'stream';
import { LinksDb } from "../modals/LinksDb";

export class Stream {


    private _blendProcessor: BlendProcessor;

    constructor() {
        this._blendProcessor = new BlendProcessor()
    }

    async process(
        req: Request, 
        res: Response
    ): Promise<any> {
        const { blendId } = req.params
        const { prompt } = req.query

        if(!blendId || !prompt) {
            return res.status(400).json({
                status: 'bad request. Either blendId or prompt is not specified.'
            })
        }

        try {

            console.log(`\n\n\User started listening to blend ${blendId}`);

            await this._blendProcessor.createBlend(blendId, prompt as string)

            res.set('content-type', 'audio/mp3');
            res.set('accept-ranges', 'bytes'); 
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Connection', 'keep-alive');

            const passthrough = new PassThrough()
            passthrough.pipe(res)

            while(this._blendProcessor.hasItemToPlay(blendId)) {
                const blendItem: BlendItem = await this._blendProcessor.getItemToPlay(blendId);
                if(!blendItem || !ObjectId.isValid(blendItem.bucket_id)) {
                    console.log(`Invalid blend: ${blendItem}\n`);
                    continue;
                }
                console.log(`Now playing blend ${blendItem.item_name}\n`)
                await this.play(blendItem, passthrough)
            }

            passthrough.end();

        } catch (err) {
            res.status(err.status?? 500).json(err.message?? 'Something went wrong')
        }
    }

    private async play(
        blendItem: BlendItem, 
        destination: any
    ) {
        return new Promise<void>(async (resolve, reject) => {

            if(!blendItem) {
                return;
            }

            if(blendItem.item_type == 'link' && blendItem.bucket_id === '') {
                blendItem = await new LinksDb().getLink(blendItem._id)
            }

            var blendId = new ObjectId(blendItem.bucket_id)
            let downloadStream = bucket.openDownloadStream(blendId);

            downloadStream.on('error', (error) => {
                console.error(`Error streaming ${blendItem.item_name}:`, error);
                reject(error);
            });
            downloadStream.on('end', () => {
                console.log(`Finished streaming ${blendItem.item_name}`);
                resolve();
            });
            downloadStream.pipe(destination, { end: false });
        })
    }

}