import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useApi } from "../hooks/useApi"
import { Spinner } from "../components/Spinner"
import { TrailerPreview } from "./TrailerPreview"

const FALLBACK_IMAGE = "/main.jpg"
const AUTOPLAY_MS = 6000
const PREVIEW_DELAY_MS = 700

const ChevronIcon = ({ direction }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-6 w-6">
        <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
)

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
    </svg>
)

const VolumeIcon =({ muted }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
        {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </svg>
)

const handleImageError =(e) => {
    e.currentTarget.onerror = null // prevents an infinite loop if the fallback fails too
    e.currentTarget.src = FALLBACK_IMAGE
}

const DEFAULT_HEIGHT = "h-[70vh] min-h-[420px] max-h-[680px]"

// movies: pass a list to show it as-is, or omit to load the home-page banner movies.
// posterLayout: for portrait posters (blurred backdrop + sharp poster instead of a stretched image).
function Banner({ movies: moviesProp, posterLayout = false, label = "Featured", heightClass = DEFAULT_HEIGHT }) {
    const { get, loading } = useApi()
    const [fetchedMovies, setMovies] = useState([])
    const movies = moviesProp ?? fetchedMovies
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const [muted, setMuted] = useState(true)

    useEffect(() => {
        if (!paused) {
            setPreviewing(false)
            return
        }
        const timer = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS)
        return () => clearTimeout(timer)
    }, [paused])

    useEffect(() => {
        if (moviesProp) return
        const getData = async () => {
            const { data } = await get("/movies/getBannerMovies")
            setMovies(data ?? [])
        }
        getData()
    }, [get, moviesProp])

    const count = movies.length

    const goTo = useCallback((i) => setIndex((i + count) % count), [count])

    useEffect(() => {
        if (count < 2 || paused) return
        const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
        return () => clearTimeout(timer)
    }, [index, count, paused])

    if (loading) {
        return (
            <div className={`flex w-full items-center justify-center bg-slate-950 ${heightClass}`}>
                <Spinner size="md" label="Loading featured movies" />
            </div>
        )
    }

    if (!count) return null

    const activeAssets = movies[index]?.assets?.[0]
    const hasTrailer = Boolean(activeAssets?.trailers?.[0] || activeAssets?.videos?.[0])

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Featured movies"
            className={`group relative w-full overflow-hidden bg-slate-950 ${heightClass}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {movies.map((movie, i) => {
                const active = i === index
                const image = movie.assets?.[0]?.images?.[0] || FALLBACK_IMAGE
                const trailer = movie.assets?.[0]?.trailers?.[0] || movie.assets?.[0]?.videos?.[0]
                const meta = [movie.releaseYear, movie.genre, movie.director && `Dir. ${movie.director}`].filter(Boolean)

                return (
                    <div
                        key={movie._id}
                        aria-hidden={!active}
                        className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ease-in-out ${
                            active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
                        }`}
                    >
                        {posterLayout ? (
                            <img
                                src={image}
                                alt=""
                                aria-hidden="true"
                                referrerPolicy="no-referrer"
                                onError={handleImageError}
                                className="h-full w-full scale-125 object-cover blur-2xl brightness-90 saturate-150"
                            />
                        ) : (
                            <img
                                src={image}
                                alt={movie.title}
                                onError={handleImageError}
                                className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${
                                    active ? "scale-105" : "scale-100"
                                }`}
                            />
                        )}

                        {active && previewing && trailer && <TrailerPreview url={trailer} muted={muted} />}

                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

                        {posterLayout && (
                            <div className="absolute inset-0 mx-auto flex max-w-6xl items-center justify-end px-6 pb-8 md:px-20">
                                <img
                                    src={image}
                                    alt={`${movie.title} poster`}
                                    referrerPolicy="no-referrer"
                                    onError={handleImageError}
                                    className="hidden aspect-[2/3] h-[78%] rounded-md object-cover shadow-2xl shadow-black/70 ring-1 ring-white/10 md:block"
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-6 pb-10 md:px-20">
                            <span className="mb-3 w-fit rounded bg-rose-500 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
                                {label}
                            </span>
                            <h2 className="max-w-2xl text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-6xl">
                                {movie.title}
                            </h2>

                            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-300">
                                {meta.map((item, n) => (
                                    <span key={n} className="flex items-center gap-3">
                                        {n > 0 && <span className="h-1 w-1 rounded-full bg-slate-500" />}
                                        {item}
                                    </span>
                                ))}
                            </div>

                            <Link
                                to={`/movie/${movie._id}`}
                                tabIndex={active ? 0 : -1}
                                className="mt-6 flex w-fit items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                            >
                                <InfoIcon /> More info
                            </Link>
                        </div>
                    </div>
                )
            })}

            {previewing && hasTrailer && (
                <button
                    type="button"
                    aria-label={muted ? "Unmute trailer" : "Mute trailer"}
                    onClick={() => setMuted((m) => !m)}
                    className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70"
                >
                    <VolumeIcon muted={muted} />
                </button>
            )}

            {count > 1 && (
                <>
                    <button
                        type="button"
                        aria-label="Previous movie"
                        onClick={() => goTo(index - 1)}
                        className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
                    >
                        <ChevronIcon direction="left" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next movie"
                        onClick={() => goTo(index + 1)}
                        className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white opacity-0 backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
                    >
                        <ChevronIcon direction="right" />
                    </button>

                    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                        {movies.map((movie, i) => (
                            <button
                                key={movie._id}
                                type="button"
                                aria-label={`Show ${movie.title}`}
                                aria-current={i === index}
                                onClick={() => goTo(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === index ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}

export default Banner
