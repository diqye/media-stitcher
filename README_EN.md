# media-stitcher

[中文](./README.md)

A video generation library focused on **pure browser-side** usage, providing high-level abstract encapsulation. You can quickly generate videos programmatically without mastering underlying audio and video technologies.
~~Also compatible with `nodejs` and `bun` runtimes~~.

> Core Classes
>
> - [x] MediaStitcher: Stitching Class — Combines video, audio, images, and canvas into a single final video
>   - [x] Supports frame and second as time units
>   - [x] addRenderRange: Renders video, images, and custom canvas to a specified time interval
>   - [x] addAudio: Merges audio into a specified time interval
>   - [x] Automatic resolution adaptation
>   - [x] Automatic FPS adaptation
>   - [x] Supports setting volume and audio speed
>   - [x] init: Creates an instance
>   - [x] deinitAndFinalize: Releases resources and merges into the final video
> - [x] MediaVideo: Video Media File Class
>   - [x] fromXXX: Provides convenient instance creation via URL/Blob/File/`MediaFile` and other methods
>   - [x] Offers functions to get basic information such as video duration and video width/height
>   - [x] createRender: Creates a rendering function for `MediaStitcher`
>   - [x] createAudio: Creates audio data function for `MediaStitcher`
>   - [x] transform: Custom canvas transitions for each frame of the video
>   - [x] sliceRange: Creates a new instance from a time slice
> - [x] MediaFile: Media File Class
>   - [x] fromXXX: Provides convenient instance creation via URL/Blob/File and other methods
> - [x] MediaAudio: Audio Media File Class
>   - [x] fromXXX: Provides convenient instance creation via URL/Blob/File/`MediaFile` and other methods
>   - [x] sliceRange: Creates a new instance from a time slice
>   - [x] createAudio: Creates audio data function for `MediaStitcher`
>   - [x] getDurationInSeconds: Gets audio duration
> - [x] TextListRender: Renders multiple lines of text into video
>   - [x] fromTextList: Creates an instance from multiple lines of text
>   - [x] handleTransform: Custom canvas
>   - [x] createReader: Creates a rendering function for `MediaStitcher`
> - [x] MediaImage: Media Image Class
>   - [x] fromXXX: Provides convenient instance creation via URL/Blob/File/`MediaFile` and other methods
>   - [x] createReader: Creates a rendering function for `MediaStitcher`
>
> Extended Capabilities
> - [x] WebVTT subtitle support
>
> Engineering/Implementation Capabilities
> - [x] Error Handling: Unified exception class `MediaError`, e.g., webcodecs not supported, video file without video track, etc.
> - [x] Progress Callback: Frame rendering progress
> - [x] Result Export: Blob
> - [x] Packaging for NPM


## Core Positioning
This library focuses on **lowering the threshold for video generation** and enabling rapid implementation of core video generation scenarios. For more refined audio and video processing needs, we recommend using the `mediabunny` library with richer underlying capabilities.


# media-stitcher vs Remotion 
| Comparison Dimension       | media-stitcher                | Remotion                      |
|----------------------------|-------------------------------|-------------------------------|
| Runtime Environment        | Focus on browser-side generation, ~~also supports server-side generation~~ | Server-side generation only, browser-side preview only |
| Technical Foundation       | OffscreenCanvas+WebCodecs native frame processing, lightweight and efficient | Headless browser web page rendering for frames, high resource consumption |
| Development Cost           | Provides APIs for high-frequency needs, low learning cost | Requires mastery of React+HTML/CSS, development in web page style |
| Solution Positioning       | Lightweight and focused, only covers core video generation needs | Heavyweight full-scenario, supports complex animations/effects/layouts |
| Performance                | Relies on browser-native webcodec, low memory/CPU usage | Launches browser instances, high performance overhead |


## Getting Started

bun
```zsh
bun add @diqye/media-stitcher mediabunny
```
or 
npm
```zsh
npm i -s @diqye/media-stitcher mediabunny
```

## Usage

### Generate 5-second video with pure code
```ts
async function generate5s() {
    let div = await simpleStart()
    // Initialization (industry convention: init is always followed by deinit)
    const blob = await MediaStitcher.init({
        duration: Unit.fromSeconds(5) // Total video duration: 5 seconds
    })
    // Add video rendering for 0-5 seconds
    .addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(5)
    }, async (currentFrame, context) => {
        // currentFrame is the frame number within the 0-5 second interval
        let canvas = context.canvas
        let twoD = canvas.getContext("2d")
        if (twoD == null) throw new Error("null 2d")
        twoD.save()
        twoD.textAlign = "center"
        twoD.font = "48px Arial"
        twoD.fillStyle = "#fff"

        // Draw the time on each frame
        twoD.fillText(
            Unit.fromFrames(currentFrame).toSeconds(context.fps).toFixed(2),
            canvas.width / 2,
            canvas.height / 2
        )
        twoD.restore()
    })
    // Release resources + get the final video
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })
    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}
```

### Generate video from audio + images
```ts
// Image + audio test
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
    },audio.createAudio())
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}
```

### Videos and audio can be freely sliced and assigned to time ranges
```ts
async function test2() {
    let div = await simpleStart()
    const video1origin = await MediaVideo.fromUrl("https://vod.pipi.cn/fec9203cvodtransbj1251246104/2cb008ef5285890807135914942/v.f42906.mp4")
    const {width,height} = video1origin.getWidthAndHeight()
    // Segment starting at 10 seconds, lasting 10 seconds
    const video1 = video1origin.sliceRange({
        startInSeconds: 10,
        durationInSeconds: 10
    })
    const video2orogin = await MediaVideo.fromUrl("https://vod.pipi.cn/fec9203cvodtransbj1251246104/aa5308fc5285890804986750388/v.f42906.mp4")

    // 10-second segment
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
    // Add frames from the first video
    .addRenderRange({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video1.createRender())
    // Add frames from the second video
    .addRenderRange({
        start: Unit.fromSeconds(video1.getDurationInSeconds()),
        duration: Unit.fromSeconds(video2.getDurationInSeconds())
    },video2.createRender())
    // Add audio from the first video during its frame interval
    .addAudio({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video1.createAudio())
    // Mix audio from the second video
    .addAudio({
        start: Unit.fromSeconds(0),
        duration: Unit.fromSeconds(video1.getDurationInSeconds())
    },video2.createAudio())
    // Add audio from the second video during its frame interval
    .addAudio({
        start: Unit.fromSeconds(video1.getDurationInSeconds()),
        duration: Unit.fromSeconds(video2.getDurationInSeconds())
    },video2.createAudio())
    .deinitAndFinalize((current,total)=>{
        div.innerText = current + "/" + total + " frames"
    })

    const url = URL.createObjectURL(blob)
    div.innerHTML = `
        <video controls src="${url}" />
    `
}
```

## Run/Test this project
``` ts
bun run dev
```

## Sponsorship
This project is a **completely open-source and free** tool library, with all development and maintenance completed in the developer's spare time.
