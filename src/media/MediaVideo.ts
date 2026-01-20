import { ALL_FORMATS, AudioBufferSink, CanvasSink, Input, InputAudioTrack, InputVideoTrack } from "mediabunny"
import { MediaError, type AsyncAudioBuffer, type Context, type Render, type RenderContext, type Timerange } from "../const"
import type { MediaFile } from "./MediaFile"
import { Unit } from "../Unit"
import { createBase } from "./MediaBase"
import { createAudioBuff } from "./createAudioBuff"

type VideoContext = {
    videoTrack?: InputVideoTrack,
    audioTrack?: InputAudioTrack
    range: {
        startInSeconds: number,
        durationInSeconds: number
    },
    /**
     * 未实现 TODO
     */
    speed: number,
}
export class MediaVideo extends createBase<Promise<MediaVideo>>() {
    ctx: VideoContext
    videoSinkCached?: CanvasSink
    transformFn?: (canvas:OffscreenCanvas | HTMLCanvasElement,ctx:RenderContext,currentFrame:number) => Promise<typeof canvas>

    private constructor(ctx:VideoContext) {
        super()
        this.ctx = ctx
    }

    createAudio(): AsyncAudioBuffer {
        return (duration:number) => {
            if (this.ctx.audioTrack == null) throw MediaError.fromStatus("no_audio_track", "该视频没有音频轨道")
            const range = this.ctx.range
            return createAudioBuff(duration,range,this.ctx.audioTrack)
        }
    }
    static override async fromMediaFile(file:MediaFile) {
        const source = await file.createSource()
        let input = new Input({
            source: source,
            formats: ALL_FORMATS
        })
        const videoT = await input.getPrimaryVideoTrack()
        const audioT = await input.getPrimaryAudioTrack()
        const duration = await videoT?.computeDuration()
        return new MediaVideo({
            videoTrack: videoT ?? undefined,
            audioTrack: audioT ?? undefined,
            speed: 1,
            range: {
                startInSeconds: 0,
                durationInSeconds: duration ?? 0
            }
        })
    }

    public transform(fn: typeof this.transformFn) {
        this.transformFn = fn
        return this
    }
    public getDurationInSeconds() {
        return this.ctx.range.durationInSeconds
    }

    /**
     * 获取视频原始宽高
     * @returns 视频的分辨率 没有视频轨道返回0x0
     */
    public getWidthAndHeight() {
        if(this.ctx.videoTrack == null) {
            throw MediaError.fromStatus("no_video_track","没有视频轨道")
        }
        return {
            width: this.ctx.videoTrack.displayWidth ?? 1,
            height: this.ctx.videoTrack.displayHeight ?? 1
        }
    }
    /**
     * 以时间为切片创建新的对象
     */
    sliceRange(range:VideoContext["range"]) {
        return new MediaVideo({
            ...this.ctx,
            range: {
                startInSeconds: this.ctx.range.startInSeconds + range.startInSeconds,
                durationInSeconds: Math.min(this.ctx.range.durationInSeconds,range.durationInSeconds)
            }
        })
    }

    createRender() : Render {
        return async (currentFrame,context) => {
            const ctx = this.ctx
            if(ctx.videoTrack == null) throw MediaError.fromStatus("no_video_track","该文件没有视频轨道")
            if(this.videoSinkCached == null) {
                this.videoSinkCached = new CanvasSink(ctx.videoTrack,{
                    fit: "cover",
                    width: context.canvas.width,
                    height: context.canvas.height
                })
            }
            const sink = this.videoSinkCached
            const startTime = ctx.range.startInSeconds
            const currentSeconds = startTime + Unit.fromFrames(currentFrame).toSeconds(context.fps)
            const targetCurrent = Math.min(currentSeconds, startTime + ctx.range.durationInSeconds)

            const canvasWrapped = await sink.getCanvas(targetCurrent)
            if(canvasWrapped == null) {
                return
            }
            const canvas = await this.transformFn?.(canvasWrapped.canvas,context,currentFrame) ?? canvasWrapped.canvas
            context.canvas.getContext("2d")?.drawImage(canvas,0,0)
        }
    }

}