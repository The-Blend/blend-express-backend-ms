import { ObjectId } from "mongodb";

export interface BlendItem {
    _id : ObjectId;
    item_name : string;
    item_type : string;
    tags : string[];
    bucket_id : ObjectId | string;
}