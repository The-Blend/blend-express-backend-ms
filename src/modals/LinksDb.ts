import mongoose, { Model, Schema } from 'mongoose';
import Joi from 'joi';
import { db } from '../middlewares/mongo'
import { ObjectId } from 'mongodb';
import { BlendItem } from '../types';

const LinkSchema : Schema = new mongoose.Schema({
    item_name: { type: String, required: true },
    tags: { type: Array, required: true },
    bucket_id: { type: String, required: false },
});

export class LinksDb {

    private Links : Model<any>;
    private _bucket : string = 'tracks.files'

    constructor() {
        this.Links = mongoose.model("links", LinkSchema);
    }

    private async getLinkFromBucket(bucket_id: string) : Promise<any> {
        try {
            const filesCollection = db.collection(this._bucket); // Adjust if your bucket name is different
            const files = await filesCollection.find({
                $where() {
                    return this._id === new ObjectId(bucket_id)
                },
            })
        
            return files
        } catch (error) {
            console.error('Error retrieving files:', error);
            return;
        }
    }

    public async getLink(linkId: ObjectId): Promise<BlendItem> {
        const collection = db.collection('links')
        const link = await collection.findOne({
            _id: new ObjectId(linkId)
        })

        return link as unknown as BlendItem;
    }

    public async getAnyLink(tag: string) : Promise<BlendItem> {
        const collection = db.collection('links');
        const randomLink = await collection
            .aggregate([
                { '$match': { tags: tag } },
                {'$sample': {size: 1}}
            ])
            .toArray();
        return randomLink[0] as BlendItem;
    }

    public async newLink({
        item_name,
        tags
    }) : Promise<ObjectId> {
        const collection = db.collection('links')
        const link = {
            item_name: item_name,
            tags: tags,
            bucket_id: ''
        }
        try {
            const addedLink = await collection.insertOne(link)
            console.log('Link created:', addedLink);
            return addedLink.insertedId
        } catch (err) {
            console.error('Error creating link:', err);
        }
    }

    public async addLinkToDb({
        item_name,
        tags,
        bucket_id
    }) {
        const link = {
            item_name: item_name,
            tags: tags,
            bucket_id: bucket_id
        }
        try {
            const collection = db.collection('links')
            const addedLink = await collection.insertOne(link)
            console.log('Link added:', addedLink);
            return addedLink
        } catch (err) {
            console.error('Error creating song:', err);
        }
    }
 
}


