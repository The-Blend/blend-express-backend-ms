import { db } from "../../middlewares/mongo";
import { qType, Queue } from "../../modals/q";
import { v4 as uuidv4 } from 'uuid';
import { BlendItem } from "../../types";


type QueueProcessorArgs = {
    queueType: string,
    minimumQueueSize: number
}

export class QueueProcessor {

    private _queue : Queue;
    private _queueType : string;

    private _minimumAcceptableLength : number;
    private _bucket: string;
    protected _tag : string;

    protected processor: (queue: qType) => Promise<BlendItem | null> ;

    constructor(
        {queueType, minimumQueueSize} : QueueProcessorArgs
    ) {
        this._queue = new Queue()
        this._bucket = 'tracks.files'
        this._minimumAcceptableLength = minimumQueueSize;
        this._queueType = queueType
    }

    public async createNewQ(tag: string) : Promise<string> {
        this._tag = tag;
        const newQItem : qType = {
            items: [],
            current: 0,
            total: 0
        }
        const id = await this._queue.createNewQ(newQItem)
        return id
    }

    async populateQIfNeeded(qid) {
        let queue : qType = await this._queue.getQbyId(qid) 
        
        if(queue.total - queue.current > this._minimumAcceptableLength) {
            console.log(`\nNeed not populate ${this._queueType} Q ${queue._id}. Exiting.`)
            return;
        }

        while(
            queue.total - queue.current <= this._minimumAcceptableLength
        ) {

            const newItem = await this.processor(queue)
            if(newItem) {
                queue.items.push(newItem);
                queue.total += 1 
            }
        } 

        console.log(`${this._queueType} Q ${queue._id}: ${queue.items.map(s => s.item_name)}\n`)
        await this._queue.updateQ(queue)
    }

    public async hasItemToPlay(
        id: string
    ) : Promise<boolean> {
        const blendObj = await this._queue.getQbyId(id);
        return blendObj.total > blendObj.current
    }

    public async getItemToPlay(
        qId: string
    ): Promise<BlendItem> {
        const linkQObj = await this._queue.getQbyId(qId)
        const current = linkQObj.items[linkQObj.current]
        await this._queue.incrementCurrent(qId)
        this.populateQIfNeeded(qId)
        return current;
    }


    protected async getLibrary() : Promise<any[]> {
        try {
            const filesCollection = db.collection(this._bucket); // Adjust if your bucket name is different
            const files = await filesCollection.find({}).toArray();
            
            if (!files || files.length === 0) {
                return [];
            }
        
            return files
        } catch (error) {
            console.error('Error retrieving files:', error);
            return [];
        }
    }
    
}