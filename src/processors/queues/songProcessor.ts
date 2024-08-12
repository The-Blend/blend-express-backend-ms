import { Db } from "mongodb";
import { db } from "../../middlewares/mongo";
import { BlendItem } from "../../types";
import { QueueProcessor } from "./queueProcessor";
import { qType } from "../../modals/q";
import { SongsDb } from "../../modals/songsDb";
const { v4: uuidv4 } = require('uuid');

export class SongProcessor extends QueueProcessor {

    private songsDb : SongsDb;

    constructor() {
        super({
            queueType: 'song',
            minimumQueueSize: 2
        });

        this.processor = this.getNewItemForQueue
        this.songsDb = new SongsDb()
    }

    public async getNewItemForQueue(queue: qType) : Promise<BlendItem> {

        const song : BlendItem = await this.songsDb.getAnysong(this._tag)
        song.item_type = 'song'
        return song;
        // const library : BlendItem[] = await this.getLibrary()
        // const index = Math.floor(Math.random() * library.length)

        // if(!queue.items.includes(library[index])) {
        //     return library[index];
        // }
        // return;  
    }

}