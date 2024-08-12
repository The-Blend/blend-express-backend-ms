import { Db, GridFSBucket, ObjectId } from "mongodb";
import { PassThrough, Readable } from 'stream';
import multer from 'multer';
import { Request, Response } from "express";
import { BlendItem } from "../types";
import * as fs from 'fs';
import * as path from 'path';
import { bucket, db } from "../middlewares/mongo";
import { SongsDb } from "../modals/songsDb";
import { LinksDb } from "../modals/LinksDb";

export class TracksController {

    private songsDb : SongsDb;
    private linksDb : LinksDb;

    constructor() {
        this.songsDb = new SongsDb()
        this.linksDb = new LinksDb()
    }


    async uploadSongsFromFolder(req : any, res : any) {
        try {
            const folderPath = "./tracks/songs"
            const files = fs.readdirSync(folderPath);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const uploadStream = bucket.openUploadStream(file, {contentType: 'audio/mp3'});
                const fileStream = fs.createReadStream(filePath);

                const bucket_id = await new Promise<ObjectId>((resolve, reject) => {
                    fileStream.pipe(uploadStream)
                        .on('error', (error) => {
                            console.error(`Error uploading file ${file}:`, error);
                            reject(error);
                        })
                        .on('finish', () => {
                            console.log(`Successfully uploaded file ${file}`);
                            resolve(uploadStream.id);
                        });
                });

                await this.songsDb.addSongToDb({
                    item_name: file,
                    tags: ['song'],
                    bucket_id: bucket_id
                  });
            }

            res.status(200).json({
                status: 'success',
            })
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    }

    async uploadLinksFromFolder(req : any, res : any) {
        try {
            const folderPath = "./tracks/links"
            const files = fs.readdirSync(folderPath);

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const uploadStream = bucket.openUploadStream(file, {contentType: 'audio/mp3'});
                const fileStream = fs.createReadStream(filePath);

                const bucket_id = await new Promise<ObjectId>((resolve, reject) => {
                    fileStream.pipe(uploadStream)
                        .on('error', (error) => {
                            console.error(`Error uploading file ${file}:`, error);
                            reject(error);
                        })
                        .on('finish', () => {
                            console.log(`Successfully uploaded file ${file}`);
                            resolve(uploadStream.id);
                        });
                });

                await this.linksDb.addLinkToDb({
                    item_name: file,
                    tags: ['link'],
                    bucket_id: bucket_id
                  });
            }

            res.status(200).json({
                status: 'success',
            })
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    }

    private async play(id: string, destination: any) {
        return new Promise<void>((resolve, reject) => {
            var trackId = new ObjectId(id)
            let downloadStream = bucket.openDownloadStream(trackId);

            downloadStream.on('error', (error) => {
                console.error(`Error streaming file with ID ${id}:`, error);
                reject(error);
            });
            downloadStream.on('end', () => {
                console.log(`Finished streaming file with ID ${id}`);
                resolve();
            });
            downloadStream.pipe(destination, { end: false });

        })
    }

    // get track
    async getTrack(req, res) {
        res.set('content-type', 'audio/mp3');
        res.set('accept-ranges', 'bytes');

        await this.play(req.params.trackId, res)

        res.end()
    }

    // list all tracks
    async listAllTracks(req, res) {
        try {
            const filesCollection = db.collection('tracks.files'); // Adjust if your bucket name is different
            const files = await filesCollection.find({}).toArray();
            
            if (!files || files.length === 0) {
                return res.status(404).json({ message: 'No files found' });
            }
        
            res.json(files);
        } catch (error) {
            console.error('Error retrieving files:', error);
            res.status(500).json({ message: 'Error retrieving files' });
        }
    }

}