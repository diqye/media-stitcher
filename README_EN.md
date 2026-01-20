# media-stitcher

[中文](./README.md)

A video generation library focused on **pure browser-side** usage, providing high-level abstract encapsulation. You can quickly generate videos programmatically without mastering underlying audio and video technologies.
~~Also compatible with `nodejs` and `bun` runtimes~~.

> **Core Basic Capabilities**
> - [x] MediaFile: Convenient creation via URL/Blob/File and other methods
> - [x] MediaVideo: Support for instance creation from URL/Blob/File and other sources
> - [x] MediaVideo: Time-based slicing
> - [x] MediaVideo: Audio slicing (Supplement: Aligned with video slicing timeline, supports separate export of audio slices)
> - [x] MediaVideo: Render (Supplement: Supports resolution adaptation)
> - [x] Cross-video resolution support: Automatically adapts width and height using cover mode if not unified
> - [x] Cross-video FPS support: Extracts frames from input videos according to the FPS of the output video
> - [x] MediaVideo: Generates AudioBuffer async iterator (Supplement: Supports audio format compatibility)
> - [x] MediaVideo: Supports per-frame transform, allowing users to freely draw on top of the original video frame
> - [x] MediaStitcher: Abstract Render management based on time intervals (Supplement: Supports multi-video overlay, with latter videos on top of previous ones)
> - [x] MediaStitcher: Abstract AudioBuffer async iterator management based on time intervals (Supplement: Supports audio mixing)
> - [x] MediaStitcher: Supports both seconds and frames as units
> - [x] MediaStitcher: Supports canvas drawing based on frames
> - [x] MediaAudio: Support for instance creation from URL/Blob/File and other sources
> - [x] MediaAudio: Generates AudioBuffer async iterator (Unified interface with MediaVideo audio iterator)
> - [x] TextListRender: Draws multiple text entries according to relative time (Supports customization of font, color, position, size, and background transparency)
> - [x] MediaImage: Support for instance creation from URL/Blob/File and other sources
> - [x] MediaImage: Render functionality
> 
> **Extended Capabilities** 
> - [x] WebVTT subtitle support 
>
> **Engineering/Deployment Capabilities**
> - [x] Exception handling: Throws exceptions for issues blocking video generation (e.g., unsupported webcodecs, video files without video tracks)
> - [x] Progress callback: Frame rendering progress
> - [x] Result export: Blob
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
bun add @diqye/media-stitcher
```
or 
npm
```zsh
npm i -s @diqye/media-stitcher
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
