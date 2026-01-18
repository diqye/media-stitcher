import { BufferTarget, CanvasSource, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec, Mp4OutputFormat, Output, QUALITY_HIGH, TextSubtitleSource, WebMOutputFormat } from "mediabunny"
import { MediaError, type AudioFile, type Context, type Renderable, type Timerange } from "./const"
import {Unit} from "./Unit"


export class MediaStitcher {
    context: Context 

    deinited: boolean = false
    renderList: [Timerange,Renderable][] = []
    audioList: [Timerange,AudioFile][] = []
    webvtt?: string

    constructor(ctx:Context) {
        this.context = ctx
    }

    /**
     * 初始化一个缝合器
     * @param params 默认 30 fps 500x500 mp4
     * @returns 
     */
    public static init(params: {
        duration: Unit,
        fps?: number
        width?: number,
        height?: number,
        format?: Context["format"],
        numberOfChannels?: number,
        sampleRate?: number
    }) {
        return new MediaStitcher({
            duration: params.duration,
            fps: params.fps ?? 30,
            canvas: new OffscreenCanvas(
                params.width ?? 500,
                params.height ?? 500,
            ),
            format: params.format ?? "mp4",
            numberOfChannels: params.numberOfChannels ?? 2,
            sampleRate: params.sampleRate ?? 44100
        })
    }

    public addRenderRange(timerange:Timerange,render: Renderable["render"] | Renderable) {
        let renderItem: Renderable
        if(typeof render == "function") {
            renderItem = {render: render}
        } else {
            renderItem = render
        }
        this.renderList.push([timerange,renderItem])
        return this
    }

    public addAudio(timerange:Timerange,audioFile: AudioFile) {
        this.audioList.push([timerange,audioFile])
        return this
    }
    public setWebvtt(webvtt:string) {
        this.webvtt = webvtt
        return this
    }
    public async deinitAndFinalize(progress?:(currentFrame:number,totalInFrames:number)=>void) {
        if(this.deinited) {
            throw MediaError.fromStatus("deinited","资源已被释放")
        }
        const ctx = this.context

        const format = ctx.format == "mp4" ? new Mp4OutputFormat()
        : ctx.format == "webm" ? new WebMOutputFormat()
        : ctx.format as never

        let output = new Output({
            format,
            target: new BufferTarget()
        })
        // webvtt 字幕
        if(this.webvtt) {
            let subtitleSource = new TextSubtitleSource("webvtt")
            await subtitleSource.add(this.webvtt)
            output.addSubtitleTrack(subtitleSource,{
                name: "vallino-subtitle",
            })

            subtitleSource.close()
        }
        const videoCodec = await getFirstEncodableVideoCodec(
            output.format.getSupportedVideoCodecs(),{
                width: ctx.canvas.width,
                height: ctx.canvas.height
            }
        )
        if(videoCodec == null) {
            throw MediaError.fromStatus("not_support_video_codec","未找到支持的视频编码，尝试改变视频宽高看看")
        }
        const audioCodec = await getFirstEncodableAudioCodec(
            output.format.getSupportedAudioCodecs(),{
                numberOfChannels: ctx.numberOfChannels,
                sampleRate: ctx.sampleRate
            }
        )
        if(audioCodec == null) {
            throw MediaError.fromStatus("not_support_video_codec","未找到支持的视频编码，尝试改变number of channels和 sample rate试试")
        }
        let videoSource = new CanvasSource(ctx.canvas,{
            codec: videoCodec,
            bitrate: QUALITY_HIGH
        })
        output.addVideoTrack(videoSource)
        await output.start()

        // 处理视频
        const totalInFrames = ctx.duration.toFrames(ctx.fps)
        let currentFrame = 0
        while(true) {
            if(currentFrame > totalInFrames) break
            const list = this.renderList.filter(([range]) => {
                const startInFrames = range.start.toFrames(ctx.fps)
                const durationInFrames = range.duration.toFrames(ctx.fps)
                if(startInFrames <= currentFrame && startInFrames + durationInFrames >= currentFrame) {
                    return true
                }
                return false
            })
            let canvas = ctx.canvas.getContext("2d")
            canvas?.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
            for(const [range,render] of list) {
                const startInFrames = range.start.toFrames(ctx.fps)
                await render.render(currentFrame - startInFrames,{
                    ...ctx,
                    timerange: range,
                    currentFrameInOutput: currentFrame
                })
            }
            await videoSource.add(
                Unit.fromFrames(currentFrame).toSeconds(ctx.fps),
                Unit.fromFrames(1).toSeconds(ctx.fps)
            )

            progress?.(currentFrame,totalInFrames)
            currentFrame++
        }

        videoSource.close()
        await output.finalize()
        return new Blob([output.target.buffer!],{type: output.format.mimeType})
    }
}