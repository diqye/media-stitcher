import { MediaFile } from "./MediaFile"

export function createBase<T>() {
    abstract class MediaBase {

        protected constructor() {}

        static fromMediaFile(file: MediaFile): T {
            throw new Error("Only sub class implement")
        }
        
        static fromFile(file: File) {
            
            return this.fromMediaFile(MediaFile.fromFile(file))
        }
        static fromBlob(blob: Blob) {
            return this.fromMediaFile(MediaFile.fromBlob(blob))
        }
        static fromBuffer(buffer: BufferSource) {
            return this.fromMediaFile(MediaFile.fromBuffer(buffer))
        }
        static fromUrl(url: string) {
            return this.fromMediaFile(MediaFile.fromUrl(url))
        }
    }
    return MediaBase
}

