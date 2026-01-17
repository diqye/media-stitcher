# media-stitcher

一款聚焦于**纯浏览器端**视频生成库，提供高层次抽象封装，无需掌握音视频底层技术，即可通过编程方式快速生成视频。
~~顺便兼容`nodejs` `bun` 运行时~~。

## 核心定位
本库专注于**降低视频生成门槛**，聚焦视频生成的核心场景快速落地。若你有更精细化的音视频处理需求，推荐使用底层能力更丰富的 `mediabunny` 库。


# media-stitcher vs Remotion 
| 对比维度       | media-stitcher                | Remotion                      |
|----------------|-------------------------------|-------------------------------|
| 运行环境       | 聚焦浏览器端生成，~~顺便支持服务器生成~~   | 仅服务端生成，浏览器端仅预览  |
| 技术底层       | OffscreenCanvas+WebCodecs 原生帧处理，轻量高效 | 无头浏览器网页渲染帧，资源占用高 |
| 开发成本       | 提供高频需求的API，低学习成本 | 需掌握React+HTML/CSS，按网页方式开发 |
| 方案定位       | 轻量聚焦，仅覆盖视频生成核心需求 | 重量级全场景，支持复杂动画/特效/排版 |
| 性能表现       | 依赖浏览器原生webcodec，内存/CPU占用低 | 启动浏览器实例，性能开销大    |


## 开始

bun
```zsh
bun add xxx
```
or 
npm
```zsh
npm i -s xxx
```

## 场景
### 定制化帧
```ts
async function generate5s() {
    simpleLog("测试1: 生成5秒视频")
    let p = simpleLog("")

    // 初始化一个5s的视频，按照行业约定调用init 后面必调用deinit
    let mediaStitcher = MediaStitcher.init({
        duration: Unit.fromSeconds(5)
    })

    // 从0 - 5s 这个时间区间的帧渲染调用我
    mediaStitcher.addRenderRange({
        start: Unit.fromFrames(0),
        duration: Unit.fromSeconds(5)
    },{
        // 直接在视频中间画出当前时间
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

    // 释放资源，顺便拿到最终的视频
    const blob = await mediaStitcher.deinitAndFinalize((current,total)=>{
        p.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}
```
