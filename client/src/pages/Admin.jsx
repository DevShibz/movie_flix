import { useCallback, useEffect, useState } from "react"
import { useApi } from "../hooks/useApi"
import { useToast } from "../components/Toast"
import { useCategories } from "../components/CategoriesContext"
import { CategoryPanel } from "../components/admin/CategoryPanel"
import { MoviePanel } from "../components/admin/MoviePanel"
import { AssetEditor } from "../components/admin/AssetEditor"

// Not linked anywhere on purpose: open it by typing /admin in the address bar.
export const Admin = () => {
    const { get, post, patch } = useApi()
    const toast = useToast()
    const { categories, loaded, refresh: refreshCategories } = useCategories()
    const [movies, setMovies] = useState([])
    const [moviesLoaded, setMoviesLoaded] = useState(false)
    const [categoryId, setCategoryId] = useState(null)
    const [movieId, setMovieId] = useState(null)

    const loadMovies = useCallback(async () => {
        const { data } = await get("/movies")
        if (data) setMovies(data)
        setMoviesLoaded(true)
    }, [get])

    useEffect(() => {
        document.title = "Admin - Movie Manager"
        loadMovies()
        refreshCategories()
        return () => {
            document.title = "Movie Manager"
        }
    }, [loadMovies, refreshCategories])

    useEffect(() => {
        if (!categoryId && categories.length) setCategoryId(categories[0]._id)
    }, [categories, categoryId])

    const category = categories.find((c) => c._id === categoryId) ?? null
    const movie = movies.find((m) => m._id === movieId) ?? null

    const selectCategory = (id) => {
        setCategoryId(id)
        setMovieId(null)
    }

    const createCategory = async (body) => {
        const { error } = await post("/movies/addMovieCategory", body)
        if (error) return false
        toast.success(`“${body.name}” is ready. Now add some movies to it.`, { title: "Category created" })
        const latest = await refreshCategories()
        const created = latest.find((c) => c.name === body.name)
        if (created) selectCategory(created._id)
        return true
    }

    const updateCategory = async (id, body) => {
        const { error } = await patch(`/movies/categories/${id}`, body)
        if (error) return false
        toast.success("Category updated. The menu is updated too.", { title: "Saved" })
        await refreshCategories()
        return true
    }

    const linkToCategory = async (id) => {
        const { error } = await post("/movies/updateMoviesInCategory", { categoryId, movieId: id })
        return !error
    }

    const createMovie = async (body) => {
        const { data, error } = await post("/movies", body)
        if (error) return false

        const linked = await linkToCategory(data.movieId)
        await Promise.all([loadMovies(), refreshCategories()])
        if (!linked) return false

        toast.success("Now add its poster, trailer and movie file on the right.", { title: "Movie created" })
        setMovieId(data.movieId)
        return true
    }

    const updateMovie = async (id, body) => {
        const { error } = await patch(`/movies/detail/${id}`, body)
        if (error) return false
        toast.success("Movie details updated.", { title: "Saved" })
        await loadMovies()
        return true
    }

    const addExistingMovie = async (id) => {
        if (!(await linkToCategory(id))) return false
        toast.success("Added to the category.")
        await refreshCategories()
        setMovieId(id)
        return true
    }

    const removeFromCategory = async (id) => {
        const { error } = await post("/movies/removeMovieFromCategory", { categoryId, movieId: id })
        if (error) return false
        toast.info("Removed from the category.")
        if (movieId === id) setMovieId(null)
        await refreshCategories()
        return true
    }

    const ready = loaded && moviesLoaded

    return (
        <main className="flex-1 bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
                    <p className="mt-1 max-w-2xl text-sm text-slate-400">
                        Work left to right: pick or create a <strong className="text-slate-200">category</strong>, add its <strong className="text-slate-200">movies</strong>, then upload each movie's poster, trailer and movie file.
                    </p>
                </header>

                {!ready ? (
                    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]" aria-busy="true">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-72 animate-pulse rounded-xl bg-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_420px]">
                        <CategoryPanel categories={categories} selectedId={categoryId} onSelect={selectCategory} onCreate={createCategory} onUpdate={updateCategory} />
                        <MoviePanel
                            category={category}
                            allMovies={movies}
                            selectedMovieId={movieId}
                            onSelectMovie={setMovieId}
                            onCreateMovie={createMovie}
                            onUpdateMovie={updateMovie}
                            onAddExisting={addExistingMovie}
                            onRemoveFromCategory={removeFromCategory}
                        />
                        <div className="lg:col-span-2 xl:col-span-1">
                            <AssetEditor movie={movie} onChanged={loadMovies} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
