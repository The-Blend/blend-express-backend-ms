import { Db, GridFSBucket, MongoClient } from "mongodb";
import { TracksController } from "../controllers/tracksController";
require("dotenv").config();

/**
 * Connect Mongo Driver to MongoDB.
 */
// const url = 'mongodb://localhost:27017/trackDb'; 
const url = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@blend.e8hq1yc.mongodb.net/`
console.log(url);
const dbName = 'tracks'; 

let db: Db;
let bucket: GridFSBucket;

async function connectToMongoDB() : Promise<void> {
    const client : MongoClient = new MongoClient(url);
    try {
        await client.connect();
        console.log("Connected correctly to server");

        db = client.db(dbName);
        bucket = new GridFSBucket(db,  {
            bucketName: dbName
        });
    } catch (err) {
        console.error(err.stack);
    }
}


export {
    connectToMongoDB,
    db,
    bucket
}
