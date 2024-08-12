import mongoose, { Model, Schema } from 'mongoose';
import Joi from 'joi';
import { db, bucket } from '../middlewares/mongo'
import { ObjectId } from 'mongodb';
import { BlendItem } from '../types';

const songSchema : Schema = new mongoose.Schema({
    item_name: { type: String, required: true },
    tags: { type: Array, required: true },
    bucket_id: { type: String, required: true },
});

export class SongsDb {

    private songs : Model<any>;
    private _bucket : string = 'tracks.files'

    constructor() {
        this.songs = mongoose.model("songs", songSchema);
    }

    // private async getsongFromBucket(bucket_id: string) : Promise<any> {
    //     try {
    //         const filesCollection = db.collection(this._bucket); // Adjust if your bucket name is different
    //         const files = await filesCollection.find({
    //             $where() {
    //                 return this._id === new ObjectId(bucket_id)
    //             },
    //         })
        
    //         return files
    //     } catch (error) {
    //         console.error('Error retrieving files:', error);
    //         return;
    //     }
    // }

    public async getsong(songId: string): Promise<BlendItem> {
        const collection = db.collection('songs');
        const song = await collection.findOne({
            _id: new ObjectId(songId)
        })

        return song as unknown as BlendItem;
    }

    public async getAnysong(tag: string) : Promise<BlendItem> {
        const collection = db.collection('songs');
        const randomSong = await collection
            .aggregate([
                { '$match': { tags: tag } },
                {'$sample': {size: 1}}
            ])
            .toArray();
        return randomSong[0] as BlendItem;
    }

    public async addSongToDb({
        item_name,
        tags,
        bucket_id
    }) {
        const song = {
            item_name: item_name,
            tags: tags,
            bucket_id: bucket_id
        }
        try {
            const collection = db.collection('songs')
            const addedsong = await collection.insertOne(song)
            console.log('song created:', addedsong);
            return addedsong
        } catch (err) {
            console.error('Error creating song:', err);
        }
    }
 
}


