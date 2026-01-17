import {MediaStitcher, Unit, type Context} from "../index"


function simpleLog(text:string) {
    const p = document.createElement("p")
    p.innerText = text
    document.body.appendChild(p)
    return p
}

async function generate5s() {
    simpleLog("测试1: 生成5秒视频")
    let p = simpleLog("")
    let mediaStitcher = MediaStitcher.init({
        duration: Unit.fromSeconds(5)
    })

    mediaStitcher.addRenderRange({
        start: Unit.fromFrames(0),
        duration: Unit.fromSeconds(5)
    },{
       async render (currentFrame: number, context: Context) {
            let canvas = context.canvas
            let twoD = canvas.getContext("2d")
            if(twoD == null) throw new Error("null 2d")
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
        }
    })

    const blob = await mediaStitcher.deinitAndFinalize((current,total)=>{
        p.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}

async function runTest() {
    await generate5s()
}

await runTest()
