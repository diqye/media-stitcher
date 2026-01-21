# media-stitcher

[English](./README_EN.md)

一款聚焦于**纯浏览器端**视频生成库，提供高层次抽象封装，无需掌握音视频底层技术，即可通过编程方式快速生成视频。
~~顺便兼容`nodejs` `bun` 运行时~~。

> **核心类**
> - [x] `MediaStitcher`: 合成类——视频、音频、图片、canvas 合成最终一个视频
>   - [x] 时间单位支持帧和秒
>   - [x] `addRenderRange`将视频、图片和自定义canvas渲染到指定的时间区间
>   - [x] `addAudio`将音频合并到指定的时间区间
>   - [x] 自动分辨率适配
>   - [x] 自动FPS适配
>   - [ ] 支持设置音量和音频速度
>   - [x] `init` 创建实例
>   - [x] `deinitAndFinalize` 释放资源并且合并成最终的视频
> - [x] MediaVideo：视频媒体文件类
>   - [x] `fromXXX` 提供 URL/Blob/File/`MediaFile` 等多方式的便捷创建实例
>   - [x] 提供获取视频时长、视频宽高等基础信息函数
>   - [x] `createRender` 创建渲染函数以供`MediaStitcher`使用
>   - [x] `createAudio` 创建音频数据函数以供`MediaStitcher`使用
>   - [x] `transform`对视频的每一帧自定义canvas过渡
>   - [x] `sliceRange` 从时间切片上创建新的实例
> - [x] `MediaFile`：媒体文件类
>   - [x] `fromXXX` 提供 URL/Blob/File 等多方式的便捷创建实例
> - [x] `MediaAudio`：音频媒体文件类
>   - [x] `fromXXX` 提供 URL/Blob/File/`MediaFile` 等多方式的便捷创建实例
>   - [x] `sliceRange` 从时间切片上创建新的实例
>   - [x] `createAudio` 创建音频数据函数以供`MediaStitcher`使用
>   - [x] `getDurationInSeconds` 获取音频时长
> - [x] `TextListRender`：多条文本绘制到视频中
>   - [x] `fromTextList` 从多条文本创建实例
>   - [x] `handleTrnasform` 自定义canvas
>   - [x] `createReader` 创建渲染函数以供`MediaStitcher`使用
> - [x] MediaImage：媒体图片类
>   - [x] `fromXXX` 提供 URL/Blob/File/`MediaFile` 等多方式的便捷创建实例
>   - [x] `createReader` 创建渲染函数以供`MediaStitcher`使用
> 
> **扩展能力** 
> - [x] WebVTT 字幕支持
>
> **工程化/落地能力**
> - [x] 异常处理：统一异常类`MediaError`，如不支持webcodecs、视频文件没有视频轨道等
> - [x] 进度回调：帧渲染进度
> - [x] 结果导出：Blob
> - [x] 打包到NPM

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
bun add @diqye/media-stitcher mediabunny
```
or 
npm
```zsh
npm i -s @diqye/media-stitcher mediabunny
```

## 使用

## 纯代码生成5s视频
```ts
async function generate5s() {
    let div = await simpleStart()
    // 初始化，行业习惯命名有init后面必有deinit
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
```
## 音频 + 图片 生成视频
```ts
// 图片 + 音频测试
async function test3(){
    let p = simpleLog("开始编码")
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
        p.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}
```
### 视频和音频可自由切片和分配时间区域
```ts
async function test2() {
    let p = simpleLog("")
    const video1origin = await MediaVideo.fromUrl("https://vod.pipi.cn/fec9203cvodtransbj1251246104/ccff07ce5285890807898977876/v.f42906.mp4")
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
        p.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    p.innerHTML = `
        <video controls src="${url}" />
    `
}
```
## 运行/测试 本项目
``` ts
bun run dev
```

## 赞助
本项目为**纯开源免费**的工具库，所有开发与维护均利用个人业余时间完成。

如果你觉得这个工具对你有帮助，并且心情还不错，不妨打赏我一点钱，一杯咖啡、一瓶可乐，都是对我继续维护和更新的巨大鼓励。

[sponsor](./test/asserts/sponsor.png)
