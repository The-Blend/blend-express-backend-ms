import { qType } from "../../modals/q";
import { BlendItem } from "../../types";
import { QueueProcessor } from "./queueProcessor";


export class PriorityQProcessor extends QueueProcessor {


    constructor() {
        super({
            queueType: 'priority',
            minimumQueueSize: 2
        })
        this.processor = this.getNewItemForQueue
    }

    getNewItemForQueue(queue: qType) : Promise<BlendItem> {

        return;
    }
}