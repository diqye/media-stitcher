import type { Render, Timerange } from "../const"

/**
 * 文本绘制到视频类
 */
export class TextListRender {
    textList: ({
        text: string,
        postion?: "center" | "bottom" | "top",
        font?: string,
        fillStyle?: string
    } & Timerange) []

    transform?: (context:OffscreenCanvasRenderingContext2D) => typeof context

    /**
     * 自定义2d 画柄 context
     * @param fn 配置2d context
     * @returns 
     */
    public handleTrnasform(fn:typeof this.transform) {
        this.transform = fn
        return this
    }
    private constructor(textList: typeof this.textList) {
        this.textList = textList
    }
    /**
     * 创建实例
     * @param textList 
     * @returns 
     */
    static fromTextList(textList: TextListRender["textList"]) {
        return new this(textList)
    }

    filterTextList(fps:number,frame:number) {
        return this.textList.filter(a=>{
            const startFrame = a.start.toFrames(fps)
            const durationInFrames = a.duration.toFrames(fps)
            if(frame < startFrame) return false
            if(frame > startFrame + durationInFrames) return false
            return true
        })
    }

    /**
     * 创建渲染函数以供`MediaStitcher`使用
     * @returns 
     */
    public createReader() :Render {
        return async(frame,ctx) =>{
            let context = ctx.canvas.getContext("2d")
            if(context == null) return
            context.save()
            context.textAlign = "center" 
            context.font = "32px Arial"
            context.fillStyle ="white"
            context.shadowColor = 'rgba(0,0,0,0.5)'
            context.shadowBlur = 8
            context.shadowOffsetX = 2
            context.shadowOffsetY = 2
            const [w,h] = [ctx.canvas.width,ctx.canvas.height]
            for(const text of this.filterTextList(ctx.fps,frame)) {
                if(text.font) {
                    context.font = text.font
                }
                if(text.fillStyle) {
                    context.fillStyle = text.fillStyle
                }
                const postion = text.postion ?? "bottom"

                const [x,y] = postion == "bottom" ?  [Math.trunc(w/2),Math.trunc(h/10 * 9)]
                : postion == "top" ? [Math.trunc(w/2),Math.trunc(h/10)]
                : postion == "center" ? [Math.trunc(w/2),Math.trunc(h/2)]
                : postion  satisfies never
                if(this.transform) {
                    context = this.transform(context)
                }
                context.fillText(text.text,x,y)
            }
            context.restore()
        }
    }

}