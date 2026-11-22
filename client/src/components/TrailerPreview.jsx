import { useEffect, useRef, useState } from "react"

const REVEAL_DELAY_MS = 1300

export const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    return match ? match[1] : null
}

// The 16:9 player is cropped to fill its container, and scaled up a little so
// YouTube's own title bar and control strip fall outside the visible area:
//   "width"    - wide banners (width fills, extra height is cropped)
//   "portrait" - 2:3 poster cards (height fills; 16:9 at that height is ~267% of the card width)
const YOUTUBE_FIT = {
    width: "h-[56.25vw] min-h-full w-full scale-[1.3]",
    portrait: "h-full w-[267%] scale-[1.5]",
}

// Plays a trailer on top of the poster and fades in only once it is actually playing.
// Renders nothing if the video cannot be played (for example embedding is disabled).
export function TrailerPreview({ url, muted = true, fit = "width" }) {
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)
    const iframeRef = useRef(null)
    const youtubeId = getYouTubeId(url)

    useEffect(() => {
        if (!youtubeId) return
        let revealTimer = null
        // YouTube briefly draws its own play/pause glyph when playback starts;
        // stay invisible until that flash is over.
        const reveal = () => {
            if (!revealTimer) revealTimer = setTimeout(() => setReady(true), REVEAL_DELAY_MS)
        }
        const onMessage = (event) => {
            if (event.source !== iframeRef.current?.contentWindow) return
            let data = event.data
            if (typeof data === "string") {
                try {
                    data = JSON.parse(data)
                } catch {
                    return
                }
            }
            if (data?.event === "onStateChange" && data.info === 1) reveal()
            if (data?.event === "infoDelivery" && data.info?.playerState === 1) reveal()
            if (data?.event === "onError") setFailed(true)
        }
        window.addEventListener("message", onMessage)
        return () => {
            window.removeEventListener("message", onMessage)
            clearTimeout(revealTimer)
        }
    }, [youtubeId])

    useEffect(() => {
        if (!youtubeId || !ready) return
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: [] }),
            "*"
        )
    }, [muted, ready, youtubeId])

    if (failed) return null

    const fade = `pointer-events-none absolute transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`

    if (youtubeId) {
        return (
            <iframe
                ref={iframeRef}
                title="Trailer preview"
                allow="autoplay; encrypted-media"
                onLoad={() =>
                    iframeRef.current?.contentWindow?.postMessage(
                        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
                        "*"
                    )
                }
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1`}
                className={`${fade} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 ${YOUTUBE_FIT[fit]}`}
            />
        )
    }

    return (
        <video
            src={url}
            autoPlay
            loop
            playsInline
            muted={muted}
            onPlaying={() => setReady(true)}
            onError={() => setFailed(true)}
            className={`${fade} inset-0 h-full w-full object-cover`}
        />
    )
}
