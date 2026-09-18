# snap

:boohooa:

![](snap.gif)

takes an image and thanos snaps it

works best with images that have a lot of transparent pixels, like emoji

for simpler images, resultant gifs should be small enough to fit into a discord animated emote (< 256 kB)

## Features
- **Render Resolution Controls**:
  - Specify custom output width and height
  - "Use original resolution" mode to match input image's native dimensions
  - Aspect ratio locking option
- **Automatic GIF Duration**:
  - Automatically records until all particles exit the screen
  - Configurable end pause duration
- **Customizable Physics & Animation Controls**:
  - Framerate (FPS)
  - Playback speed multiplier
  - Snap wave propagation speed (PPS)
  - Horizontal spread force (`vx_base`)
  - Upward drift force / gravity
  - Proportional physics scaling with resolution
- **GIF Encoder Controls**:
  - Adjustable encoder quality
  - Live progress feedback during simulation and GIF rendering
  - One-click GIF download button

## Current Issues:
- transparency isn't exact, so there might be random transparent pixels in the first frame; this doesn't happen if there are transparent pixels in the original image, or if there is only a small amount of colors in the image
- doesn't work on some browsers? (brave)