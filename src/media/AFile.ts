
export class AFile {
    public file: File | string


    private constructor(file:File | string) {
        this.file = file
    }

    static fromFile(file:File) {
        return new AFile(file)
    }

    static fromBlob(blob:Blob,name="none.b") {
        return new AFile(
            new File([blob],name)
        )
    }

    static fromBuffer(buffer: BufferSource,name="none.b") {
        return new AFile(
            new File([buffer],name)
        )
    }
    static async fromURL(url:string) {
        return new AFile(url)
    }

    static findExt(name:string) {
        const index = name.lastIndexOf(".")
        if(index == -1) return "b"
        return name.slice(index+1)
    }
    static findName(name:string) {
        const index = name.lastIndexOf("/")
        if(index == -1) return name
        return name.slice(index+1)
    }

    
}
