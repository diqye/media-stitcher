export class Unit {
    raw: {
        cos: "frames",
        v: number
    } | {
        cos: "seconds",
        v: number
    }

    private constructor(raw: typeof this.raw) {
        this.raw = raw
    }

    static fromFrames(frames:number) {
        return new Unit({cos:"frames",v: frames})
    }
    static fromSeconds(seconds:number) {
        return new Unit({cos:"seconds",v: seconds})
    }

    public toSeconds(fps:number) {
        if(this.raw.cos == "frames") {
            return this.raw.v * (1/fps)
        } 

        if(this.raw.cos == "seconds") {
            return this.raw.v
        } 
        return this.raw satisfies never
    }

    public toFrames(fps:number) {
        if(this.raw.cos == "frames") {
            return Math.trunc(this.raw.v)
        } 

        if(this.raw.cos == "seconds") {
            return Math.trunc(this.raw.v * fps)
        } 
        return this.raw satisfies never
    }
}