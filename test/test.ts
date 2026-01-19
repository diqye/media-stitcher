import {MediaAudio, MediaImage, MediaStitcher, MediaVideo, Unit} from "../src/index"
// @ts-ignore
import mp3 from "./asserts/sample-15s.mp3"

function simpleLog(text:string) {
    const p = document.createElement("p")
    p.innerText = text
    document.body.appendChild(p)
    return p
}
async function simpleStart() {
    const div = document.createElement("div")
    const button = document.createElement("button")
    button.innerText = "点我开始"
    div.appendChild(button)
    document.body.appendChild(div)
    await new Promise<void>(resolve=>{
        button.onclick = () => {
            resolve()
        }
    })
    return div
}
 
// 纯代码生成5s的视频
async function generate5s() {
    let div = await simpleStart()
    // 初始化，行业约定有init 必有配套的deinit
    const blob = await MediaStitcher.init({
        duration: Unit.fromSeconds(5) //视频总是时长 5s
    })
    // 添加0-5s之间的视频渲染
    .addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(5)
    }, async (currentFrame, context) => {
        // currentFrame 是在0-5s区间内的第几帧
        let canvas = context.canvas
        let twoD = canvas.getContext("2d")
        if (twoD == null) throw new Error("null 2d")
        twoD.save()
        twoD.textAlign = "center"
        twoD.font = "48px Arial"
        twoD.fillStyle = "#fff"

        // 每一帧都画上时间
        twoD.fillText(
            Unit.fromFrames(currentFrame).toSeconds(context.fps).toFixed(2),
            canvas.width / 2,
            canvas.height / 2
        )
        twoD.restore()
    })
    // 释放资源 + 获取最终的视频
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}

async function test2() {
    let div = await simpleStart()
    const video1origin = await MediaVideo.fromUrl(mp3)
    const {width,height} = video1origin.getWidthAndHeight()
    // 从3秒开始 持续10秒的片段
    const video1 = video1origin.sliceRange({
        startInSeconds: 3,
        durationInSeconds: 10
    })
    const video2orogin = await MediaVideo.fromUrl("https://vod.pipi.cn/fec9203cvodtransbj1251246104/aa5308fc5285890804986750388/v.f42906.mp4")

    // 10秒的片段
    const video2 = video2orogin.sliceRange({
        startInSeconds: 0,
        durationInSeconds: 10
    })
    const blob = await MediaStitcher.init({
        duration: Unit.fromSeconds(
            video1.getDurationInSeconds() +
            video2.getDurationInSeconds()
        ),
        width: width,
        height: height
    })
    // 添加第一个视频的画面
    .addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video1.createRender())
    // 添加第二个视频的画面
    .addRenderRange({
        start: Unit.fromSeconds(video1.getDurationInSeconds()),
        duration: Unit.fromSeconds(video2.getDurationInSeconds())
    },video2.createRender())
    // 在第一个视频画面区间添加第一个视频的声音
    .addAudio({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video1.iterAudio())
    // 混合第二个视频的声音
    .addAudio({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video2.iterAudio())
    // 在第二个视频画面区间添加第二个视频的声音
    .addAudio({
        start: Unit.fromSeconds(video1.getDurationInSeconds()),
        duration: Unit.fromSeconds(video2.getDurationInSeconds())
    },video2.iterAudio())
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}

// 图片 + 音频测试
async function test3(){
    let div = await simpleStart()
    const audio = await MediaAudio.fromUrl(mp3)
    const image1 =  MediaImage.fromUrl("https://picsum.photos/id/2/1000/800")
    const image2 =  MediaImage.fromUrl("https://picsum.photos/id/1/500/300")
    const blob = await MediaStitcher.init({
        duration: Unit.fromSeconds(10),
        width: 500,
        height: 400
    })
    .addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(5)
    },image1.createRender())
    .addRenderRange({
        start: Unit.fromSeconds(5),
        duration: Unit.fromSeconds(5)
    },image2.createRender())
    .addAudio({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(10)
    },audio.iterAudio())
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}
function runTest() {
    simpleLog("测试1，生成5秒的视频")
    generate5s()

    simpleLog("测试2,视频拼接")
    test2()

    simpleLog("测试3,图片+音频")
    test3()
}

await runTest()
