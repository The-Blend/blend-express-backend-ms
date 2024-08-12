import { ObjectId } from "mongodb";
import { db } from "../middlewares/mongo";
import { BlendItem } from "../types";
import mongoose, { Model, Schema } from 'mongoose';

export type qType = {
    _id?: ObjectId;
    items: BlendItem[];
    current: number;
    total: number;
}

const qSchema : Schema = new mongoose.Schema({
    items: { type: Array, required: true },
    current: { type: Number, required: true },
    total: { type: Number, required: true }
});

export class Queue {

    private _queues : qType[] = [];
    private Q : Model<any>;

    constructor() {
        this.Q = mongoose.model('queues', qSchema)
    }

    public async getQbyId(id: string): Promise<qType> {
        const collection = db.collection('queues')
        const queue = await collection.findOne({
            _id: new ObjectId(id),
        })
        return queue as qType;
    }

    public async createNewQ(newQ : qType) : Promise<any> {
        try {
            const collection = await db.collection('queues')
            const savedQ = await collection.insertOne(newQ);
            return savedQ.insertedId
        } catch (err) {
            console.error('Error creating q:', err);
        }
    }

    async addItemToQueue(id: any, nextItem: BlendItem) {
        // const qObj = this.getQbyId(id)
        // qObj.items.push(nextItem);
        // qObj.total += 1
        // this.updateQ(qObj)

        await this.Q.findById(id)
            .then(qObj => {
                if (!qObj) {
                    throw new Error('User not found');
                }
                qObj.items.push(nextItem);
                qObj.total += 1; // Increment age by 1
                return qObj.save();
            })
            .then(updatedqObj => {
                console.log('Q updated:', updatedqObj);
            })
            .catch(err => {
                console.log(err);
            });
    }

    public async updateQ(queue: qType) {
        const collection = db.collection('queues')
        await collection.findOneAndReplace({
            _id: queue._id
        }, queue)
    }

    public async incrementCurrent(id: string) {
        const oldQObj = await this.getQbyId(id)
        oldQObj.current += 1
        await this.updateQ(oldQObj)
    }

    public async incrementTotal(id: string) {
        const oldQObj = await this.getQbyId(id)
        oldQObj.total += 1
        await this.updateQ(oldQObj)
    }

}