import { BlendItem } from "../types";

export type BlendType = {
    blendId: string;
    finalQ: BlendItem[];
    userId: string;
    songQid: string;
    linkQid: string;
    priorityQid: string;
    ratioL: number;
    ratioS: number;
    prompt: string;
    current: number;
    total: number;
    tags: Tag;
}

export type Tag = {
    prompt: string;
    genre: string;
    link: string;
    emotion: string;
}

export class Blend {

    private _blends : BlendType[] = [];
    

    constructor() {
        
    }

    public getBlendById(id: string): BlendType {
        return this._blends.find(blend => blend.blendId === id)
    }

    public createNewBlend(
        blend: BlendType,
    ) {
        this._blends.push(blend)
    }

    public updateBlend(blend: BlendType) {
        const idx = this._blends.findIndex(b => b.blendId === blend.blendId)
        this._blends.splice(idx, 1)
        this._blends.push(blend)
    }

    public incrementCurrent(blendId: string) {
        const oldBlendObj = this._blends.find(blend => blend.blendId === blendId)
        oldBlendObj.current += 1
        this.updateBlend(oldBlendObj)
    }

    async addToBlendQueue(
        blendId: string,
        arg0: BlendItem[]
    ) {
        const blend = await this.getBlendById(blendId)
        blend.finalQ.concat(arg0)
        blend.total += arg0.length
        this.updateBlend(blend)
    }

}