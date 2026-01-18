import {MediaStitcher, MediaVideo, Unit, type Context, type RenderableContext} from "../src/index"


function simpleLog(text:string) {
    const p = document.createElement("p")
    p.innerText = text
    document.body.appendChild(p)
    return p
}

async function generate5s() {
    let p = simpleLog("")
    let mediaStitcher = MediaStitcher.init({
        duration: Unit.fromSeconds(5)
    })

    mediaStitcher.addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(5)
    }, async (currentFrame, context) => {
        let canvas = context.canvas
        let twoD = canvas.getContext("2d")
        if (twoD == null) throw new Error("null 2d")
        twoD.save()
        twoD.textAlign = "center"
        twoD.font = "48px Arial"
        twoD.fillStyle = "#fff"
        twoD.fillText(
            Unit.fromFrames(currentFrame).toSeconds(context.fps).toFixed(2),
            canvas.width / 2,
            canvas.height / 2
        )
        twoD.restore()
    })

    const blob = await mediaStitcher.deinitAndFinalize((current,total)=>{
        p.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}

async function test2() {
    let p = simpleLog("")
    const video1origin = await MediaVideo.fromUrl("https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4")
    const {width,height} = video1origin.getWidthAndHeight()
    const video1 = video1origin.sliceRange({
        startInSeconds: 3,
        durationInSeconds: 5
    })
    const video2orogin = await MediaVideo.fromUrl("https://vjs.zencdn.net/v/oceans.mp4")
    // 只要两秒的片段
    const video2 = video2orogin.sliceRange({
        startInSeconds: 0,
        durationInSeconds: 2
    })
    let mediaStitcher = MediaStitcher.init({
        duration: Unit.fromSeconds(
            video1.getDurationInSeconds() +
            video2.getDurationInSeconds()
        ),
        width: width,
        height: height
    })
    mediaStitcher.addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video1)

    mediaStitcher.addRenderRange({
        start: Unit.fromSeconds(video1.getDurationInSeconds()),
        duration: Unit.fromSeconds(video2.getDurationInSeconds())
    },video2)

    const blob = await mediaStitcher.deinitAndFinalize((current,total)=>{
        p.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}
async function runTest() {
    // simpleLog("测试1，生成5秒的视频")
    // await generate5s()

    simpleLog("测试2,视频拼接")
    await test2()
}

await runTest()
