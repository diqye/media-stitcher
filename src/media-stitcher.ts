import { AudioBufferSource, BufferTarget, CanvasSource, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec, Mp4OutputFormat, Output, QUALITY_HIGH, QUALITY_MEDIUM, TextSubtitleSource, WebMOutputFormat } from "mediabunny"
import { MediaError, type AsyncAudioBuffer, type Context, type Render, type Timerange, type VideoRange } from "./const"
import {Unit} from "./Unit"


type AudioRange = Timerange & {
    volume?: number,
    playbackRate?: number
}
export class MediaStitcher {
    context: Context 

    deinited: boolean = false
    renderList: [VideoRange,Render][] = []
    audioList: [AudioRange, AsyncAudioBuffer][] = []
    webvtt?: string

    constructor(ctx:Context) {
        this.context = ctx
    }

    /**
     * 创建实例
     * @param params 默认 30 fps 500x500 mp4
     * @returns 
     */
    public static init(params: {
        duration: Unit,
        fps?: number
        width?: number,
        height?: number,
        format?: Context["format"],
        numberOfChannels?: 1 | 2,
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

    /**
     * 将视频、图片和自定义canvas渲染到指定的时间区间
     * @param timerange 从输出视频的什么时间开始持续多长时间,以及视频倍速
     * @param render 渲染函数
     * @returns 
     */
    public addRenderRange(timerange:VideoRange,render: Render) {
        this.renderList.push([timerange,render])
        return this
    }

    /**
     * 将音频合并到指定的时间区间
     * @param timerange 从输出视频的什么时间开始持续多长时间, 音频和播放速度控制
     * @param audioBufferFn 
     * @returns 
     */
    public addAudio(range: AudioRange,audioBufferFn: AsyncAudioBuffer) {
        this.audioList.push([range,audioBufferFn])
        return this
    }

    /**
     * 设置webvtt字幕
     * @param webvtt 字幕
     * @returns 
     */
    public setWebvtt(webvtt:string) {
        this.webvtt = webvtt
        return this
    }

    /**
     * 释放资源并且合并成最终的视频
     * @param progress 进度回调
     * @returns 
     */
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
        output.addVideoTrack(videoSource,{
            name: "vallino-video"
        })

        const audioSource = new AudioBufferSource({
            codec: audioCodec,
            bitrate: QUALITY_MEDIUM
        })
        output.addAudioTrack(audioSource,{name:"vallino-audio"})
        
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
                await render(currentFrame - startInFrames,{
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

        const audioContext = new OfflineAudioContext(
            ctx.numberOfChannels,
            ctx.duration.toSeconds(ctx.fps) * ctx.sampleRate,
            ctx.sampleRate
        )

        for(const [range,createAudioBuff] of this.audioList) {
            const rate = range.playbackRate ?? 1

            const start  = range.start.toSeconds(ctx.fps)
            const duration = range.duration.toSeconds(ctx.fps) * rate
            const audiobuff = await createAudioBuff(duration)

            const durationInSeconds = audiobuff.durationInSeconds / rate

            const sourceStart = start + audiobuff.timestamp
            const volume = range.volume ?? 1
            let gain = audioContext.createGain()
            gain.gain.setValueAtTime(0,sourceStart)
            gain.gain.linearRampToValueAtTime(volume,sourceStart + 0.002)

            // 容易混校1 倍速后的时长
            gain.gain.setValueAtTime(volume,sourceStart + durationInSeconds - 0.002)
            gain.gain.linearRampToValueAtTime(0,sourceStart + durationInSeconds)
            let source = audioContext.createBufferSource()
            source.buffer = audiobuff.buff
            source.connect(gain)
            source.playbackRate.value = rate
            gain.connect(audioContext.destination)

            // 容易混校2 原始倍速的时长
            source.start(sourceStart,0,audiobuff.durationInSeconds)
        }

        await audioSource.add(await audioContext.startRendering())
        audioSource.close()
        
        await output.finalize()
        return new Blob([output.target.buffer!],{type: output.format.mimeType})
    }
}