import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useApi } from "../hooks/useApi"
import { useToast } from "../components/Toast"
import { Spinner } from "../components/Spinner"
import { getYouTubeId } from "../components/TrailerPreview"

const IDLE_MS = 3000
const SEEK_STEP = 10

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const pad = (n) => String(n).padStart(2, "0")
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const Svg = ({ children, className = "h-6 w-6", fill = "none" }) => (
    <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        {children}
    </svg>
)
const PlayIcon = ({ className }) => (
    <Svg fill="currentColor" className={className}>
        <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14z" stroke="none" />
    </Svg>
)
const PauseIcon = () => (
    <Svg fill="currentColor">
        <rect x="6" y="5" width="4" height="14" rx="1" stroke="none" />
        <rect x="14" y="5" width="4" height="14" rx="1" stroke="none" />
    </Svg>
)
const BackIcon = () => (
    <Svg strokeWidth="2.5">
        <path d="M15 5l-7 7 7 7" />
    </Svg>
)
const InfoIcon = () => (
    <Svg className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
    </Svg>
)
const VolumeIcon = ({ muted }) => (
    <Svg>
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
        {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </Svg>
)
const FullscreenIcon = ({ exit }) => (
    <Svg>
        {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </Svg>
)

function FullScreenMessage({ children }) {
    return <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-slate-400">{children}</div>
}

function WatchScreen({ movie }) {
    const navigate = useNavigate()
    const toast = useToast()
    const containerRef = useRef(null)
    const videoRef = useRef(null)
    const idleTimer = useRef(null)

    const assets = movie.assets?.[0]
    const videos = assets?.videos ?? []
    const trailer = assets?.trailers?.[0]
    const poster = assets?.images?.[0]
    const genres = (movie.genre ?? "").split(",").map((g) => g.trim()).filter(Boolean)
    const title = movie.title.trim()
    const trailerYoutubeId = trailer ? getYouTubeId(trailer) : null

    const [videoIndex, setVideoIndex] = useState(0)
    const [playbackFailed, setPlaybackFailed] = useState(false)
    const [paused, setPaused] = useState(true)
    const [started, setStarted] = useState(false)
    const [buffering, setBuffering] = useState(true)
    const [time, setTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [muted, setMuted] = useState(false)
    const [volume, setVolume] = useState(1)
    const [controlsVisible, setControlsVisible] = useState(true)
    const [infoOpen, setInfoOpen] = useState(false)
    const [trailerOpen, setTrailerOpen] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)

    const hasVideo = videos.length > 0 && !playbackFailed
    // Netflix-style: the info screen only exists while paused (or when there is nothing to play)
    const showInfoScreen = !hasVideo || (paused && started)
    const controlsShown = hasVideo && (controlsVisible || paused)
    const panelOpen = infoOpen && showInfoScreen

    const wake = useCallback(() => {
        setControlsVisible(true)
        clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(() => setControlsVisible(false), IDLE_MS)
    }, [])

    useEffect(() => {
        wake()
        return () => clearTimeout(idleTimer.current)
    }, [wake])

    useEffect(() => {
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        window.scrollTo(0, 0)
        return () => {
            document.body.style.overflow = previous
        }
    }, [])

    useEffect(() => {
        const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener("fullscreenchange", onChange)
        return () => document.removeEventListener("fullscreenchange", onChange)
    }, [])

    const togglePlay = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        if (video.paused) video.play().catch(() => {})
        else video.pause()
    }, [])

    const seekTo = (seconds) => {
        const video = videoRef.current
        if (video) video.currentTime = Math.min(Math.max(seconds, 0), video.duration || 0)
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (video) video.muted = !video.muted
    }

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen()
        else containerRef.current?.requestFullscreen?.()
    }

    const openTrailer = () => {
        videoRef.current?.pause()
        setTrailerOpen(true)
    }

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                if (trailerOpen) setTrailerOpen(false)
                else if (infoOpen) setInfoOpen(false)
                return
            }
            if (trailerOpen || !hasVideo) return
            const video = videoRef.current
            if (event.key === " " || event.key.toLowerCase() === "k") {
                event.preventDefault()
                togglePlay()
            } else if (event.key === "ArrowRight") {
                seekTo((video?.currentTime ?? 0) + SEEK_STEP)
            } else if (event.key === "ArrowLeft") {
                seekTo((video?.currentTime ?? 0) - SEEK_STEP)
            } else if (event.key.toLowerCase() === "m") {
                toggleMute()
            } else if (event.key.toLowerCase() === "f") {
                toggleFullscreen()
            } else {
                return
            }
            wake()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [trailerOpen, infoOpen, hasVideo, togglePlay, wake])

    // Start automatically. If the browser blocks autoplay with sound, fall back to muted playback.
    const startPlayback = (event) => {
        const video = event.currentTarget
        video.play().catch(() => {
            video.muted = true
            video.play().catch(() => {})
        })
    }

    const handlePlaybackError = () => {
        setPlaybackFailed(true)
        toast.error("This video could not be played. Please try again later.", { title: "Playback error" })
    }

    const selectPart = (index) => {
        setVideoIndex(index)
        setStarted(false)
        setBuffering(true)
        setTime(0)
        setInfoOpen(false)
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={wake}
            onTouchStart={wake}
            className={`fixed inset-0 z-[60] overflow-hidden bg-black text-white ${hasVideo && !controlsShown ? "cursor-none" : ""}`}
        >
            {hasVideo ? (
                <video
                    ref={videoRef}
                    key={videos[videoIndex]}
                    src={videos[videoIndex]}
                    poster={poster}
                    playsInline
                    preload="auto"
                    onLoadedData={startPlayback}
                    onPlay={() => {
                        setPaused(false)
                        setStarted(true)
                    }}
                    onPause={() => setPaused(true)}
                    onPlaying={() => setBuffering(false)}
                    onWaiting={() => setBuffering(true)}
                    onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                    onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                    onVolumeChange={(e) => {
                        setMuted(e.currentTarget.muted)
                        setVolume(e.currentTarget.volume)
                    }}
                    onError={handlePlaybackError}
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                />
            ) : (
                poster && <img src={poster} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-50" />
            )}

            {hasVideo && (
                <button type="button" tabIndex={-1} aria-label={paused ? "Play" : "Pause"} onClick={togglePlay} className="absolute inset-0 z-10 cursor-default" />
            )}

            {hasVideo && buffering && !showInfoScreen && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            )}

            <div
                className={`pointer-events-none absolute inset-0 z-20 flex items-center bg-gradient-to-r from-black/90 via-black/60 to-black/20 px-8 transition-opacity duration-300 md:px-20 ${
                    showInfoScreen ? "opacity-100" : "opacity-0"
                }`}
            >
                <div className={`max-w-2xl ${showInfoScreen ? "pointer-events-auto" : "pointer-events-none"}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">{hasVideo ? "You're watching" : "Not available yet"}</p>
                    <h1 className="mt-2 text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-6xl">{title}</h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-300">
                        {movie.releaseYear && <span>{movie.releaseYear}</span>}
                        {genres.map((genre) => (
                            <span key={genre} className="flex items-center gap-3">
                                <span className="h-1 w-1 rounded-full bg-slate-500" />
                                {genre}
                            </span>
                        ))}
                    </div>
                    {movie.director && <p className="mt-2 text-sm text-slate-400">Directed by {movie.director}</p>}
                    {!hasVideo && <p className="mt-4 text-slate-300">This movie isn't available to stream yet.</p>}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        {hasVideo && (
                            <button
                                type="button"
                                onClick={togglePlay}
                                className="flex items-center gap-2 rounded-md bg-white px-7 py-3 text-base font-bold text-slate-900 transition hover:bg-slate-200"
                            >
                                <PlayIcon className="h-5 w-5" /> Resume
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setInfoOpen((open) => !open)}
                            aria-expanded={panelOpen}
                            className="flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold backdrop-blur-sm transition hover:bg-white/25"
                        >
                            <InfoIcon /> Info
                        </button>
                    </div>
                </div>
            </div>

            <div className={`absolute inset-x-0 top-0 z-30 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4 transition-opacity duration-300 md:px-8 ${
                controlsVisible || showInfoScreen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition hover:bg-black/70"
                >
                    <BackIcon />
                </button>
                <span className="truncate text-lg font-semibold">{title}</span>
            </div>

            {hasVideo && (
                <div className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300 md:px-8 ${
                    controlsShown ? "opacity-100" : "pointer-events-none opacity-0"
                }`}>
                    <input
                        type="range"
                        aria-label="Seek"
                        min={0}
                        max={duration || 0}
                        step="0.1"
                        value={Math.min(time, duration || 0)}
                        onChange={(e) => seekTo(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer accent-rose-500"
                    />
                    <div className="mt-2 flex items-center gap-4">
                        <button type="button" onClick={togglePlay} aria-label={paused ? "Play" : "Pause"} className="rounded-full p-2 transition hover:bg-white/15">
                            {paused ? <PlayIcon /> : <PauseIcon />}
                        </button>

                        <div className="flex items-center gap-2">
                            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="rounded-full p-2 transition hover:bg-white/15">
                                <VolumeIcon muted={muted || volume === 0} />
                            </button>
                            <input
                                type="range"
                                aria-label="Volume"
                                min={0}
                                max={1}
                                step="0.05"
                                value={muted ? 0 : volume}
                                onChange={(e) => {
                                    const video = videoRef.current
                                    if (!video) return
                                    video.volume = Number(e.target.value)
                                    video.muted = Number(e.target.value) === 0
                                }}
                                className="hidden h-1 w-20 cursor-pointer accent-white sm:block"
                            />
                        </div>

                        <span className="text-sm tabular-nums text-slate-300">
                            {formatTime(time)} / {formatTime(duration)}
                        </span>

                        <div className="ml-auto flex items-center gap-2">
                            {videos.length > 1 &&
                                videos.map((url, i) => (
                                    <button
                                        key={url}
                                        type="button"
                                        onClick={() => selectPart(i)}
                                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                            i === videoIndex ? "bg-rose-500" : "bg-white/10 text-slate-300 hover:bg-white/20"
                                        }`}
                                    >
                                        Part {i + 1}
                                    </button>
                                ))}
                            <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="rounded-full p-2 transition hover:bg-white/15">
                                <FullscreenIcon exit={fullscreen} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <aside
                aria-hidden={!panelOpen}
                className={`absolute bottom-0 right-0 top-0 z-40 w-full max-w-md overflow-y-auto bg-slate-950/95 p-6 shadow-2xl backdrop-blur transition-transform duration-300 ${
                    panelOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
                }`}
            >
                <button
                    type="button"
                    aria-label="Close info"
                    onClick={() => setInfoOpen(false)}
                    tabIndex={panelOpen ? 0 : -1}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl leading-none transition hover:bg-white/20"
                >
                    ×
                </button>
                {poster && <img src={poster} alt={`${title} poster`} referrerPolicy="no-referrer" className="mx-auto mt-6 aspect-[2/3] w-44 rounded-md object-cover shadow-xl shadow-black/60" />}
                <h2 className="mt-6 text-2xl font-bold">{title}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                    {movie.releaseYear && (
                        <div>
                            <dt className="text-slate-500">Release year</dt>
                            <dd>{movie.releaseYear}</dd>
                        </div>
                    )}
                    {genres.length > 0 && (
                        <div>
                            <dt className="text-slate-500">Genres</dt>
                            <dd className="mt-1 flex flex-wrap gap-2">
                                {genres.map((genre) => (
                                    <span key={genre} className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs">
                                        {genre}
                                    </span>
                                ))}
                            </dd>
                        </div>
                    )}
                    {movie.director && (
                        <div>
                            <dt className="text-slate-500">Director</dt>
                            <dd>{movie.director}</dd>
                        </div>
                    )}
                </dl>
                {trailer && (
                    <button
                        type="button"
                        onClick={openTrailer}
                        tabIndex={panelOpen ? 0 : -1}
                        className="mt-6 flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20"
                    >
                        <PlayIcon className="h-4 w-4" /> Watch trailer
                    </button>
                )}
            </aside>

            {trailerOpen && trailer && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12">
                    <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
                        {trailerYoutubeId ? (
                            <iframe
                                title="Trailer"
                                src={`https://www.youtube.com/embed/${trailerYoutubeId}?autoplay=1&rel=0`}
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                                className="h-full w-full border-0"
                            />
                        ) : (
                            <video src={trailer} controls autoPlay playsInline className="h-full w-full" />
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="Close trailer"
                        onClick={() => setTrailerOpen(false)}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl leading-none transition hover:bg-white/25"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    )
}

export const MovieDetail = () => {
    const { movieId } = useParams()
    const { get, cancel } = useApi()
    const [movie, setMovie] = useState(null)
    const [status, setStatus] = useState("loading") // "loading" | "ready" | "error"

    useEffect(() => {
        let active = true
        setMovie(null)
        setStatus("loading")

        get(`/movies/detail/${movieId}`).then(({ data }) => {
            if (!active) return
            setMovie(data)
            setStatus(data ? "ready" : "error")
        })

        return () => {
            active = false
            cancel()
        }
    }, [movieId, get, cancel])

    if (status === "loading") {
        return (
            <FullScreenMessage>
                <Spinner size="lg" />
            </FullScreenMessage>
        )
    }

    if (status === "error" || !movie) {
        return (
            <FullScreenMessage>
                <p className="text-lg">We couldn't load this movie.</p>
                <Link to="/" className="text-rose-400 hover:underline">
                    Back to home
                </Link>
            </FullScreenMessage>
        )
    }

    return <WatchScreen key={movie._id} movie={movie} />
}
