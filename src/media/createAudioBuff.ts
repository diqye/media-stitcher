import { AudioBufferSink, type InputAudioTrack, type WrappedAudioBuffer } from "mediabunny"

export async function createAudioBuff(
    duration: number, 
    range: {
        startInSeconds: number,
        durationInSeconds: number
    },
    audioTrack:InputAudioTrack
) {
    const sink = new AudioBufferSink(audioTrack)
    const durationInSeconds = Math.min(
        range.durationInSeconds,
        duration
    )
    const start = range.startInSeconds
    const end = start + durationInSeconds
    let list = [] as WrappedAudioBuffer[]
    let totalLength = 0
    let totalduration = 0
    for await (const audioBuff of sink.buffers(start, end)) {
        totalLength += audioBuff.buffer.length
        list.push(audioBuff)
        totalduration += audioBuff.buffer.duration
    }
    const channels = list[0]?.buffer.numberOfChannels ?? 2
    const sampleRate = list[0]?.buffer.sampleRate ?? 44100
    let allBuffer = new AudioBuffer({
        numberOfChannels: channels,
        length: totalLength,
        sampleRate: sampleRate
    })
    let offset = 0
    for (const audioBuff of list) {
        for (let ch = 0; ch < channels; ch++) {
            allBuffer
                .getChannelData(ch)
                .set(audioBuff.buffer.getChannelData(ch), offset)
        }
        offset += audioBuff.buffer.length
    }
    return {
        timestamp: Math.abs((list[0]?.timestamp ?? 0) - start),
        durationInSeconds: totalduration,
        buff: allBuffer
    }
}