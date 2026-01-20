import type { Render } from "../const"
import { createBase } from "./MediaBase"
import type { MediaFile } from "./MediaFile"

export class MediaImage extends createBase<MediaImage>() {
    mfile:MediaFile
    
    private constructor(mfile:MediaFile) {
        super()
        this.mfile = mfile
    }
    static override fromMediaFile(file:MediaFile) {
        return new MediaImage(file)
    }

    public async createBitmap(resizeWidth?:number) {
        const blob = await this.mfile.blob()
        return createImageBitmap(blob,{resizeWidth})
    }

    private bitmapCached?: ImageBitmap
    public createRender():Render {
        return async (currentFrame, context) => {
            if(this.bitmapCached == null) {
                this.bitmapCached = await this.createBitmap(context.canvas.width)
            }
            context.canvas.getContext("2d")?.drawImage(
                this.bitmapCached,
                0,0,
            )
        }
    }
}

