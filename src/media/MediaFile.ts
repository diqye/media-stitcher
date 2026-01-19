import { BufferSource as BufferSourceClass, Source, UrlSource } from "mediabunny"

export class MediaFile {
    public file: File | string

    private constructor(file:File | string) {
        this.file = file
    }

    static fromFile(file:File) {
        return new MediaFile(file)
    }

    static fromBlob(blob:Blob,name="none.b") {
        return new MediaFile(
            new File([blob],name)
        )
    }

    static fromBuffer(buffer: BufferSource,name="none.b") {
        return new MediaFile(
            new File([buffer],name)
        )
    }
    static fromUrl(url:string) {
        return new MediaFile(url)
    }

    /**
     * 返回最后`.`后面的字符串, 若找不到返回 .b
     * @param path 路径、文件、url
     * @returns 
     */
    static findExt(path:string) {
        const index = path.lastIndexOf(".")
        if(index == -1) return "b"
        return path.slice(index+1)
    }

    /**
     * 根据路径找出文件名字
     * @param path 路径、文件、url
     * @returns 
     */
    static findName(path:string) {
        const index = path.lastIndexOf("/")
        if(index == -1) return path
        return path.slice(index+1)
    }

    async createSource() : Promise<Source> {
        if(typeof this.file == "string") {
            return new UrlSource(this.file)
        }
        return new BufferSourceClass(await this.file.arrayBuffer())
    }

    private blobCached?: Blob 
    async blob() {
        if(this.blobCached != null) return this.blobCached
        if(typeof this.file == "string") {
            const resp = await fetch(this.file)
            this.blobCached =  await resp.blob()
            return this.blobCached
        }
        this.blobCached = new Blob([await this.file.bytes()])
        return this.blobCached
    }
}
