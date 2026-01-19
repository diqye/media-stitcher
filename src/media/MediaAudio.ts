import { ALL_FORMATS, AudioBufferSink, Input, InputAudioTrack } from "mediabunny"
import { MediaError, type AsyncAudioBuffer } from "../const"
import { MediaFile } from "./MediaFile"
import { createBase } from "./MediaBase"

type AudioContext = {
    audioTrack?: InputAudioTrack
    range: {
        startInSeconds: number,
        durationInSeconds: number
    }
}
export class MediaAudio extends createBase<Promise<MediaAudio>>() {
    ctx: AudioContext

    private constructor(ctx:AudioContext) {
        super()
        this.ctx = ctx
    }
    iterAudio(): AsyncAudioBuffer {
        const that = this
        return async function*(duration:number) {
            if (that.ctx.audioTrack == null) throw MediaError.fromStatus("no_audio_track", "该视频没有音频轨道")
            const sink = new AudioBufferSink(that.ctx.audioTrack)
            const range = that.ctx.range
            const durationInSeconds = Math.min(
                range.durationInSeconds,
                duration
            )
            const start = range.startInSeconds
            const end = start + durationInSeconds
            console.log(start,end)
            for await (const audioBuff of sink.buffers(start, end)) {
                yield {
                    timestamp: Math.abs(audioBuff.timestamp - start),
                    durationInSeconds: audioBuff.duration,
                    buff: audioBuff.buffer
                }
            }
        }
    }
    static override async fromMediaFile(file:MediaFile) {
        const source = await file.createSource()
        let input = new Input({
            source: source,
            formats: ALL_FORMATS
        })
        const audioT = await input.getPrimaryAudioTrack()
        const duration = await audioT?.computeDuration()
        return new MediaAudio({
            audioTrack: audioT ?? undefined,
             range: {
                startInSeconds: 0,
                durationInSeconds: duration ?? 0
            }
        })
    }

    public getDurationInSeconds() {
        return this.ctx.range.durationInSeconds
    }

    /**
     * 以时间为切片创建新的对象
     */
    sliceRange(range:AudioContext["range"]) {
        return new MediaAudio({
            ...this.ctx,
            range: {
                startInSeconds: this.ctx.range.startInSeconds + range.startInSeconds,
                durationInSeconds: Math.min(this.ctx.range.durationInSeconds,range.durationInSeconds)
            }
        })
    }
}