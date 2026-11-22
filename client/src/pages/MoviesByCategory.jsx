import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useApi } from "../hooks/useApi"
import Banner from "../components/banner"
import { MovieCard, MovieCardSkeleton } from "../components/MovieCard"

const TOP_COUNT = 4
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5"

export const MoviesByCategory = () => {
    const { category } = useParams()
    const { get, cancel, loading } = useApi()
    const [data, setData] = useState(null)

    useEffect(() => {
        let active = true
        setData(null)

        get(`/movies/categories/${encodeURIComponent(category)}`).then(({ data }) => {
            if (active) setData(data)
        })

        return () => {
            active = false
            cancel()
        }
    }, [category, get, cancel])

    const movies = data?.movies ?? []
    const topFour = useMemo(
        () => movies.filter((movie) => movie.assets?.[0]?.images?.[0]).slice(0, TOP_COUNT),
        [movies]
    )

    return (
        <main className="flex-1 bg-slate-950 text-white">
            {!loading && topFour.length > 0 && (
                <Banner
                    key={category}
                    movies={topFour}
                    posterLayout
                    label={`Top ${topFour.length} in ${data.name}`}
                    heightClass="h-[55vh] min-h-[380px] max-h-[560px]"
                />
            )}

            <div className="mx-auto w-full max-w-6xl px-6 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold capitalize tracking-tight sm:text-4xl">{data?.name ?? category}</h1>
                    {data?.description && <p className="mt-2 max-w-2xl text-slate-400">{data.description}</p>}
                    {data && <p className="mt-1 text-sm text-slate-500">{movies.length} titles</p>}
                </header>

                {loading && (
                    <div className={GRID}>
                        {Array.from({ length: 10 }, (_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {!loading && !data && (
                    <div className="py-20 text-center text-slate-400">
                        <p className="text-lg">We couldn't load this category.</p>
                        <Link to="/" className="mt-4 inline-block text-rose-400 hover:underline">
                            Back to home
                        </Link>
                    </div>
                )}

                {!loading && data && movies.length === 0 && (
                    <p className="py-20 text-center text-slate-400">No movies in this category yet.</p>
                )}

                {!loading && movies.length > 0 && (
                    <div className={GRID}>
                        {movies.map((movie) => (
                            <MovieCard key={movie._id} movie={movie} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
