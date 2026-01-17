import type {Unit} from "./Unit";


export type Timerange = {
    duration: Unit,
    start: Unit
}

/**
 *  操作canvas画出视频的每一帧
 */
export interface Renderable {
    /**
     * 每一帧渲染调用render一次
     * @param currentFrame 当前正在渲染的帧
     * @param context 视频相关上下文
     */
    render(
        currentFrame: number,
        context:Context
    ):Promise<void>
}

export type AudioRange = {
    file: File | string,
    range: Timerange
}
export interface AudioFile {
    getAudio() : AudioRange;
}
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