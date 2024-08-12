
import { BlendItem } from "../../types";
import { QueueProcessor } from "./queueProcessor";
import { qType } from "../../modals/q";
import { LinksDb } from "../../modals/LinksDb";
import { ObjectId } from "mongodb";

export class LinkProcessor extends QueueProcessor {

    private linksDb : LinksDb;
    private LinkCategory = [
        'sports',
        'education',
        'technology',
        'business',
        'entertainment',
        'Science',
        'health',
        'joke'
    ]

    constructor() {
        super({
            queueType: 'link',
            minimumQueueSize: 2
        });

        this.processor = this.getNewItemForQueue
        this.linksDb = new LinksDb()
    }

    public async generateLink(link: BlendItem): Promise<any> {
        try {
            // ToDo: Update this to prob url
            const response = await fetch('http://localhost:3001/links', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    "link_id": link._id,
                    "category": this.LinkCategory[Math.floor(Math.random() * this.LinkCategory.length)]
                })
            })
    
            if(!response.ok) {
                const res = await response.json()
                throw new Error(res.error)
            }

            return response

        } catch (error) {
            console.log(error)
            // Do nothing for now
        }  
    }

    public async getNewItemForQueue(queue: qType) : Promise<BlendItem> {

        // const link_id : ObjectId = await this.linksDb.newLink({
        //     item_name: 'link ' + Math.random(),
        //     tags: ['link']
        // })
        // const link = await this.linksDb.getLink(new ObjectId(link_id))
        
        // this.generateLink(link)

        const link = await this.linksDb.getAnyLink(this._tag)
        link.item_type = 'link'

        return link;

        // const library : BlendItem[] = await this.getLibrary()
        // const index = Math.floor(Math.random() * library.length)

        // if(!queue.items.includes(library[index])) {
        //     return library[index];
        // }
        // return;  
    }

}