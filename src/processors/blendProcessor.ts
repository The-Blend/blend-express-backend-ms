
import { ParsedQs } from "qs";
import { Blend, BlendType, Tag } from "../modals/Blend";
import { BlendItem } from "../types";
import { GridFSBucket, ObjectId } from "mongodb";
import { PassThrough } from 'stream';
import { bucket } from "../middlewares/mongo";
import { SongProcessor } from "./queues/songProcessor";
import { LinkProcessor } from "./queues/linkProcessor";
import { PriorityQProcessor } from "./queues/priorityQProcessor";
const { v4: uuidv4 } = require('uuid');

export class BlendProcessor {

    private _blend : Blend;
    private _songProcessor : SongProcessor;
    private _linkProcessor : LinkProcessor;
    private _priorityQProcessor : PriorityQProcessor;

    private _minimumAcceptableLength : number = 2;

    private jingle : BlendItem = {
        _id: new ObjectId('66b3033f5b0d7ffa65c7715d'),
        item_name: 'RJ intro with jingle.mp3',
        tags: ['jingle'],
        bucket_id: new ObjectId('66b3033f5b0d7ffa65c7715a'),
        item_type: 'link'
    }

    constructor() {
        this._blend = new Blend()
        this._songProcessor = new SongProcessor();
        this._linkProcessor = new LinkProcessor();
        this._priorityQProcessor = new PriorityQProcessor();
    }

    private async getBlendTagsFromPrompt(prompt: string): Promise<Tag>{
        // ToDo: Update this to prod url
        const response = await fetch('http://localhost:3001/prompt', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                prompt : prompt
            })
        })

        if(!response.ok) {
            const err = await response.text()
            throw new Error(err)
        }

        return await response.json()
    }

    public async createBlend(
        blendId: string,
        prompt: string
    ) {
        // check if blend is already there for this id, if not create a new one
        if(!this._blend.getBlendById(blendId)) {
            const tags : Tag = await this.getBlendTagsFromPrompt(prompt)
            console.log(tags)
            const newBlendObj : BlendType = {
                blendId: blendId,
                finalQ: [
                    this.jingle
                ],
                userId: uuidv4(),
                songQid: await this._songProcessor.createNewQ(tags.genre),
                linkQid: await this._linkProcessor.createNewQ(tags.link),
                priorityQid: await this._priorityQProcessor.createNewQ(tags.emotion),
                ratioL: 1,
                ratioS: 1,
                tags: tags,
                prompt: prompt,
                current: 0,
                total: 1
            }
            this._blend.createNewBlend(newBlendObj)

            console.log(`Creating blend ${newBlendObj.blendId}`)
            await this._songProcessor.populateQIfNeeded(newBlendObj.songQid)
            await this._linkProcessor.populateQIfNeeded(newBlendObj.linkQid)
            await this.populateBlendQIfNeeded(blendId)
        }
    }

    async populateBlendQIfNeeded(blendId: string) {
        const blendObj = await this._blend.getBlendById(blendId)

        if(blendObj.total - blendObj.current > this._minimumAcceptableLength) {
            console.log(`\nNeed not populate blend ${blendId}. Exiting.\n`)
            return;
        }

        console.log(`\nPopulating blend ${blendId}`)
        while(
            blendObj.total - blendObj.current <= this._minimumAcceptableLength
        ) {
            console.log(blendObj.total , " ", blendObj.current ," " ,this._minimumAcceptableLength)
            // if(this._priorityQProcessor.hasItemToPlay(blendObj.priorityQid)) {
            if(false) {
                const priorityItem : BlendItem = await this._priorityQProcessor.getItemToPlay(blendObj.priorityQid)
                blendObj.finalQ.push(priorityItem)
                blendObj.total += 1
            } else {
                if(Math.random() > 0.6) {
                    const link : BlendItem = await this._linkProcessor.getItemToPlay(blendObj.linkQid)
                    console.log('link')
                    console.log(link)
                    blendObj.finalQ.push(link)
                    blendObj.total += 1
                } else {
                    const song : BlendItem = await this._songProcessor.getItemToPlay(blendObj.songQid)
                    console.log('song')
                    console.log(song)
                    if(blendObj.total > 1 && Math.random() > 0.7) {
                        blendObj.finalQ.push(this.jingle)
                        blendObj.total += 1
                    }
                    blendObj.finalQ.push(song)
                    blendObj.total += 1
                }   
            }
        }

        console.log("populated blend")
        this._blend.updateBlend(blendObj)
    }

    public hasItemToPlay(
        blendId: string
    ) : boolean {
        const blendObj = this._blend.getBlendById(blendId);
        console.log(`hasItemToPlay ${blendObj.total > blendObj.current}`)
        return blendObj.total > blendObj.current
    }

    public async getItemToPlay(
        blendId: string
    ): Promise<BlendItem> {
        const blendObj = this._blend.getBlendById(blendId)
        const current = blendObj.finalQ[blendObj.current]
        console.log(`current: ${current}`)
        console.log("Final Q:  " + blendObj.finalQ.map(o => o?.item_name))
        console.log('')
        this._blend.incrementCurrent(blendId)
        await this.populateBlendQIfNeeded(blendId)
        return current;
    }

    

}