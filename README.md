# media-stitcher

一款聚焦于**纯浏览器端**视频生成库，提供高层次抽象封装，无需掌握音视频底层技术，即可通过编程方式快速生成视频。
~~顺便兼容`nodejs` `bun` 运行时~~。
> **此项目还未完成**

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

## 使用
### 视频拼接
```ts
async function test2() {
    let p = simpleLog("")
    const video1origin = await MediaVideo.fromUrl("https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4")
    const {width,height} = video1origin.getWidthAndHeight()
    // 从3秒开始 持续5秒的片段
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
```
### 定制帧
```ts
// 以下代码生成5s的视频
async function generate5s() {
    let p = simpleLog("")

    // 初始化，按照约定调用init 后面必有deinit
    let mediaStitcher = MediaStitcher.init({
        duration: Unit.fromSeconds(5)
    })

    // 从0 - 5s 这个时间区间的帧渲染调用我
    mediaStitcher.addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(5)
    }, async (currentFrame, context) => {
        // 在视频中间位置画出视频已播放了的时间
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

    // deinit 释放资源，顺便拿到最终的视频
    const blob = await mediaStitcher.deinitAndFinalize((current,total)=>{
        p.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}
```
