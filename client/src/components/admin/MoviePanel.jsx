import { useState } from "react"
import { ghostButton, inputClass, panelClass, primaryButton } from "./ui"

const EMPTY_FORM = { title: "", director: "", releaseYear: "", genre: "", isBanner: false }

function Status({ ok, label }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ok ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"}`}>
            {ok ? "✓" : "–"} {label}
        </span>
    )
}

function MovieRow({ movie, selected, onSelect, onEdit }) {
    const assets = movie.assets?.[0]
    const poster = assets?.images?.[0]

    return (
        <li className="flex items-stretch gap-1">
            <button
                type="button"
                onClick={() => onSelect(movie._id)}
                aria-pressed={selected}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition ${
                    selected ? "bg-rose-500/20 ring-1 ring-rose-400" : "bg-white/5 hover:bg-white/10"
                }`}
            >
                {poster ? (
                    <img src={poster} alt="" referrerPolicy="no-referrer" className="h-16 w-11 shrink-0 rounded object-cover" />
                ) : (
                    <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] text-slate-500">No poster</div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{movie.title.trim()}</p>
                    <p className="truncate text-xs text-slate-400">{[movie.releaseYear, movie.director].filter(Boolean).join(" • ")}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        <Status ok={Boolean(poster)} label="Poster" />
                        <Status ok={Boolean(assets?.trailers?.length)} label="Trailer" />
                        <Status ok={Boolean(assets?.videos?.length)} label="Movie" />
                    </div>
                </div>
                <span className="hidden text-xs text-slate-400 sm:block">{selected ? "Editing assets" : "Assets ›"}</span>
            </button>
            <button
                type="button"
                onClick={() => onEdit(movie)}
                aria-label={`Edit details of ${movie.title.trim()}`}
                className="rounded-lg bg-white/5 px-3 text-xs font-medium text-slate-300 transition hover:bg-white/15"
            >
                Edit
            </button>
        </li>
    )
}

function MovieForm({ categoryName, initial, isEdit, onSubmit, onCancel, onRemoveFromCategory }) {
    const [form, setForm] = useState(initial)
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)

    const setField = (field) => (event) => {
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value
        setForm((current) => ({ ...current, [field]: value }))
        setError("")
    }

    const submit = async (event) => {
        event.preventDefault()
        const year = Number(form.releaseYear)
        if (!form.title.trim() || !form.director.trim() || !form.genre.trim()) return setError("Title, director and genre are required.")
        if (!Number.isInteger(year) || year < 1888 || year > new Date().getFullYear() + 5) return setError("Enter a valid release year.")

        setBusy(true)
        const ok = await onSubmit({
            title: form.title.trim(),
            director: form.director.trim(),
            releaseYear: year,
            genre: form.genre.trim(),
            isBanner: form.isBanner,
        })
        setBusy(false)
        if (ok) onCancel()
    }

    return (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-rose-400/40 bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-slate-300">{isEdit ? "Edit movie" : `New movie (it will be added to “${categoryName}”)`}</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="movie-title" className="mb-1 block text-xs font-medium text-slate-400">Title *</label>
                    <input id="movie-title" value={form.title} onChange={setField("title")} placeholder="e.g. Inception" className={inputClass} autoFocus />
                </div>
                <div>
                    <label htmlFor="movie-director" className="mb-1 block text-xs font-medium text-slate-400">Director *</label>
                    <input id="movie-director" value={form.director} onChange={setField("director")} placeholder="e.g. Christopher Nolan" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="movie-year" className="mb-1 block text-xs font-medium text-slate-400">Release year *</label>
                    <input id="movie-year" type="number" value={form.releaseYear} onChange={setField("releaseYear")} placeholder="e.g. 2010" className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="movie-genre" className="mb-1 block text-xs font-medium text-slate-400">Genre *</label>
                    <input id="movie-genre" value={form.genre} onChange={setField("genre")} placeholder="e.g. Action, Sci-Fi" className={inputClass} />
                </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isBanner} onChange={setField("isBanner")} className="h-4 w-4 accent-rose-500" />
                Feature this movie in the home page banner
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={busy} className={primaryButton}>{busy ? "Saving…" : isEdit ? "Save changes" : "Save movie"}</button>
                <button type="button" onClick={onCancel} className={ghostButton}>Cancel</button>
                {isEdit && (
                    <button
                        type="button"
                        onClick={onRemoveFromCategory}
                        className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                    >
                        Remove from “{categoryName}”
                    </button>
                )}
            </div>
        </form>
    )
}

export function MoviePanel({ category, allMovies, selectedMovieId, onSelectMovie, onCreateMovie, onUpdateMovie, onAddExisting, onRemoveFromCategory }) {
    const [formMode, setFormMode] = useState(null) // null | { movie } where movie is null for "new"
    const [busy, setBusy] = useState(false)
    const [existingId, setExistingId] = useState("")

    if (!category) {
        return (
            <section className={panelClass}>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs">2</span>
                    Movies
                </h2>
                <p className="mt-6 rounded-md bg-white/5 p-4 text-sm text-slate-400">Create or select a category on the left to manage its movies.</p>
            </section>
        )
    }

    const memberIds = new Set((category.movies ?? []).map((m) => m._id))
    const movies = allMovies.filter((m) => memberIds.has(m._id))
    const available = allMovies.filter((m) => !memberIds.has(m._id))

    const editing = formMode?.movie ?? null
    const initialForm = editing
        ? { title: editing.title.trim(), director: editing.director ?? "", releaseYear: String(editing.releaseYear ?? ""), genre: editing.genre ?? "", isBanner: Boolean(editing.isBanner) }
        : { ...EMPTY_FORM, genre: category.name ?? "" }

    const addExisting = async () => {
        if (!existingId) return
        setBusy(true)
        const ok = await onAddExisting(existingId)
        setBusy(false)
        if (ok) setExistingId("")
    }

    return (
        <section className={panelClass} aria-labelledby="movies-title">
            <div className="flex items-center justify-between gap-3">
                <h2 id="movies-title" className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs">2</span>
                    <span>Movies in “{category.name}”</span>
                </h2>
                {!formMode && (
                    <button type="button" onClick={() => setFormMode({ movie: null })} className={`${primaryButton} shrink-0`}>
                        + Add movie
                    </button>
                )}
            </div>

            {formMode && (
                <MovieForm
                    key={editing?._id ?? "new"}
                    categoryName={category.name}
                    initial={initialForm}
                    isEdit={Boolean(editing)}
                    onSubmit={(values) => (editing ? onUpdateMovie(editing._id, values) : onCreateMovie(values))}
                    onCancel={() => setFormMode(null)}
                    onRemoveFromCategory={async () => {
                        if (!window.confirm(`Remove “${editing.title.trim()}” from “${category.name}”?\n\nThe movie itself is kept; it just won't be listed in this category.`)) return
                        if (await onRemoveFromCategory(editing._id)) setFormMode(null)
                    }}
                />
            )}

            <ul className="mt-4 space-y-2">
                {movies.length === 0 && !formMode && (
                    <li className="rounded-md bg-white/5 p-4 text-sm text-slate-400">No movies in this category yet. Click “Add movie” to create one.</li>
                )}
                {movies.map((movie) => (
                    <MovieRow key={movie._id} movie={movie} selected={movie._id === selectedMovieId} onSelect={onSelectMovie} onEdit={(m) => setFormMode({ movie: m })} />
                ))}
            </ul>

            {available.length > 0 && (
                <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
                    <label htmlFor="existing-movie" className="text-sm font-semibold text-slate-300 sm:shrink-0">Add an existing movie</label>
                    <select id="existing-movie" value={existingId} onChange={(e) => setExistingId(e.target.value)} className={`${inputClass} sm:flex-1`}>
                        <option value="">Choose a movie…</option>
                        {available.map((movie) => (
                            <option key={movie._id} value={movie._id}>
                                {movie.title.trim()} ({movie.releaseYear})
                            </option>
                        ))}
                    </select>
                    <button type="button" disabled={!existingId || busy} onClick={addExisting} className={ghostButton}>
                        Add
                    </button>
                </div>
            )}
        </section>
    )
}
