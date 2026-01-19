# media-stitcher

一款聚焦于**纯浏览器端**视频生成库，提供高层次抽象封装，无需掌握音视频底层技术，即可通过编程方式快速生成视频。
~~顺便兼容`nodejs` `bun` 运行时~~。

> **核心基础能力**
> - [x] MediaFile：提供 URL/Blob/File 等多方式的便捷创建
> - [x] MediaVideo：支持从 URL/Blob/File 等方式创建实例
> - [x] MediaVideo：时间维度的切片
> - [x] MediaVideo：音频切片（补充：与视频切片时间轴对齐，支持单独导出音频切片）
> - [x] MediaVideo：Render（补充：支持分辨率适配）
> - [x] 支持跨视频分辨率：若不统一自动cover的方式自适应宽高
> - [x] 支持跨视频 FPS：按照输出视频的 FPS 从输入视频中抽取
> - [x] MediaVideo：生成 AudioBuffer 异步迭代器（补充：支持音频格式兼容）
> - [x] MediaVideo：支持每一帧transform，用户可在原视频画面之上自由绘制
> - [x] MediaStitcher：抽象基于时间区间的 Render 管理（补充：支持多视频叠加，后者在前者画面之上）
> - [x] MediaStitcher：抽象基于时间区间的 AudioBuffer 异步迭代器管理（补充：支持音频混合）
> - [x] MediaStitcher: 支持秒和帧两种单位
> - [x] MediaStitcher: 支持基于帧的canvas绘制
> - [x] MediaAudio：支持从 URL/Blob/File 等方式创建实例
> - [x] MediaAudio：生成 AudioBuffer 异步迭代器（与 MediaVideo 音频迭代器接口统一）
> - [ ] MediaText：单条文本绘制（支持字体、颜色、位置、字号、背景透明度定制）
> - [x] MediaImage：支持从 URL/Blob/File 等方式创建实例
> - [x] MediaImage：Render功能
> 
> **扩展能力** 
> - [x] WebVTT 字幕解析支持（补充：解析为结构化字幕数据）
>
> **工程化/落地能力**
> - [x] 异常处理： 阻塞生成视频的都抛异常，如不支持webcodecs、视频文件没有视频轨道等
> - [x] 进度回调：帧渲染进度
> - [x] 结果导出：Blob
> - [ ] 打包到NPM

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

## 测试
``` ts
bun run dev
```

## 使用

## 纯代码生成5s视频
```ts
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

## 赞助
本项目为**纯开源免费**的工具库，所有开发与维护均利用个人业余时间完成。

~~如果这个工具库帮到了你，或是你认可我的开发理念，欢迎进行小额捐助 —— 你的支持会成为我持续迭代、修复问题、完善功能的重要动力。~~