import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { TrailerPreview } from "./TrailerPreview"

const PREVIEW_DELAY_MS = 500

export const MovieCard = ({ movie }) => {
    const [imageFailed, setImageFailed] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const timer = useRef(null)

    const assets = movie.assets?.[0]
    const image = assets?.images?.[0]
    const trailer = assets?.trailers?.[0] || assets?.videos?.[0]
    const showImage = image && !imageFailed
    const details = [movie.releaseYear, movie.genre].filter(Boolean).join("  •  ")

    const startPreview = () => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS)
    }
    const stopPreview = () => {
        clearTimeout(timer.current)
        setPreviewing(false)
    }

    useEffect(() => () => clearTimeout(timer.current), [])

    return (
        <Link
            to={`/movie/${movie._id}`}
            aria-label={`${movie.title} - view details`}
            onMouseEnter={startPreview}
            onMouseLeave={stopPreview}
            onFocus={startPreview}
            onBlur={stopPreview}
            className="group relative block aspect-[2/3] overflow-hidden rounded-md bg-slate-800 shadow-lg ring-white/80 transition-all duration-300 ease-out hover:z-10 hover:scale-110 hover:shadow-2xl hover:shadow-black/70 focus-visible:z-10 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2"
        >
            {showImage ? (
                <img
                    src={image}
                    alt={`${movie.title} poster`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-center">
                    <span className="text-lg font-bold leading-tight text-slate-300">{movie.title}</span>
                </div>
            )}

            {previewing && trailer && <TrailerPreview url={trailer} fit="portrait" />}

            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                <h3 className="text-sm font-bold leading-snug text-white">{movie.title}</h3>
                {details && <p className="mt-1 text-xs font-medium text-emerald-400">{details}</p>}
                {movie.director && <p className="mt-0.5 line-clamp-1 text-xs text-slate-300">Dir. {movie.director}</p>}
            </div>
        </Link>
    )
}

export const MovieCardSkeleton = () => (
    <div className="aspect-[2/3] animate-pulse rounded-md bg-slate-800" />
)
