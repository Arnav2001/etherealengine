export const VIDEO_CONSTRAINTS = {
  qvga: { width: { ideal: 320 }, height: { ideal: 240 } },
  vga: { width: { ideal: 640 }, height: { ideal: 480 } },
  hd: { width: { ideal: 1280 }, height: { ideal: 720 } },
  fhd: { width: { ideal: 1920 }, height: { ideal: 1080 } }
}

export const localAudioConstraints: MediaStreamConstraints = {
  audio: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true
  }
}

export const localVideoConstraints: MediaStreamConstraints = {
  video: {
    width: VIDEO_CONSTRAINTS.fhd.width,
    height: VIDEO_CONSTRAINTS.fhd.height,
    frameRate: { max: 60 }
  }
}

export const CAM_VIDEO_SIMULCAST_ENCODINGS = [
  { scaleResolutionDownBy: 4, maxBitrate: 500 * 1000 }, // 500kbps
  { scaleResolutionDownBy: 2, maxBitrate: 1000 * 1000 }, // 1mbps
  { scaleResolutionDownBy: 1, maxBitrate: 10 * 1000 * 1000 } // 10mbps
]

export const CAM_VIDEO_SIMULCAST_CODEC_OPTIONS = {
  videoGoogleStartBitrate: 1000, // 1mbps
  videoGoogleMaxBitrate: 1000 * 1000, // 1gbps
  videoGoogleMinBitrate: 1 // 1kbps
}

export const SCREEN_SHARE_SIMULCAST_ENCODINGS = [
  { dtx: true, maxBitrate: 500 * 1000 }, // 500kbps
  { dtx: true, maxBitrate: 2 * 1000 * 1000 }, // 2mbps
  { dtx: true, maxBitrate: 10 * 1000 * 1000 } // 10mbps
]
