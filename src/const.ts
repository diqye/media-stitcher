import type {Unit} from "./Unit";


export type Timerange = {
    duration: Unit,
    start: Unit
}

export type RenderContext = {
    timerange: Timerange,
    currentFrameInOutput: number
} & Context


export type Render = (
    currentFrame: number,
    context: RenderContext
) => Promise<void>

export type AsyncAudioBuffer = (duration: number) => AsyncGenerator<{
    timestamp: number;
    durationInSeconds: number;
    buff: AudioBuffer;
}>

export type Context = {
    duration: Unit,
    readonly fps: number,
    canvas: OffscreenCanvas,
    format: "mp4" | "webm",
    numberOfChannels: number,
    sampleRate: number
}

export type MediaErrorStatus = "deinited"
| "not_support_video_codec"
| "not_support_audio_codec"
| "no_video_track"
| "no_audio_track"

export class MediaError extends Error {
    status?: MediaErrorStatus
    private constructor(msg?:string) {
        super(msg)
    }
    public static fromStatus(status: MediaErrorStatus, message?:string) {
        let a = new MediaError(message)
        a.status = status
        
        return a
    }
}