import { useCallback, useEffect, useRef, useState } from "react"
import { useApi } from "../../hooks/useApi"
import { useToast } from "../Toast"
import { uploadToCloudinary } from "../../lib/cloudinaryUpload"
import { ghostButton, inputClass, panelClass, primaryButton } from "./ui"

const shortUrl = (url) => {
    try {
        const { hostname, pathname } = new URL(url)
        const file = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "")
        return `${hostname.replace(/^www\./, "")}${file ? " / " + file : ""}`
    } catch {
        return url
    }
}

const isHttpUrl = (value) => {
    try {
        const { protocol } = new URL(value)
        return protocol === "http:" || protocol === "https:"
    } catch {
        return false
    }
}

function AssetSection({ title, hint, type, kind, linkPlaceholder, urls, movieId, onChanged }) {
    const toast = useToast()
    const { post } = useApi()
    const [progress, setProgress] = useState(null) // null = idle, 0-100 = uploading
    const [fileName, setFileName] = useState("")
    const [link, setLink] = useState("")
    const [dragging, setDragging] = useState(false)
    const [editingUrl, setEditingUrl] = useState(null)
    const [editValue, setEditValue] = useState("")
    const abortRef = useRef(null)
    const fileInputRef = useRef(null)
    const uploading = progress !== null

    const saveUrl = async (url) => {
        const { error } = await post("/assets/addAsset", { movieId, type, url })
        if (error) return false
        toast.success("Added to this movie.", { title: `${title} saved` })
        await onChanged()
        return true
    }

    const handleFile = async (file) => {
        if (!file) return
        if (!file.type.startsWith(`${kind}/`)) {
            toast.error(`Please choose ${kind === "image" ? "an image" : "a video"} file.`, { title: "Wrong file type" })
            return
        }

        abortRef.current = new AbortController()
        setFileName(file.name)
        setProgress(0)
        try {
            const { url } = await uploadToCloudinary(file, { onProgress: setProgress, signal: abortRef.current.signal })
            setProgress(100)
            await saveUrl(url)
        } catch (error) {
            if (error.name !== "AbortError") toast.error(error.message, { title: "Upload failed" })
        } finally {
            setProgress(null)
            setFileName("")
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const addLink = async (event) => {
        event.preventDefault()
        const value = link.trim()
        if (!isHttpUrl(value)) {
            toast.error("Paste a full link that starts with http:// or https://", { title: "Invalid link" })
            return
        }
        if (await saveUrl(value)) setLink("")
    }

    const startEdit = (url) => {
        setEditingUrl(url)
        setEditValue(url)
    }

    const saveEdit = async (event) => {
        event.preventDefault()
        const value = editValue.trim()
        if (!isHttpUrl(value)) {
            toast.error("Paste a full link that starts with http:// or https://", { title: "Invalid link" })
            return
        }
        if (value === editingUrl) return setEditingUrl(null)

        const { error } = await post("/assets/updateMovieAsset", { movieId, type, oldUrl: editingUrl, newUrl: value })
        if (!error) {
            toast.success("Link updated.", { title: `${title} saved` })
            setEditingUrl(null)
            await onChanged()
        }
    }

    const makePrimary = async (url) => {
        const { error } = await post("/assets/setPrimaryAsset", { movieId, type, url })
        if (!error) {
            toast.success("This one will now be shown on the site.", { title: "Primary updated" })
            await onChanged()
        }
    }

    const remove = async (url) => {
        if (!window.confirm(`Remove this from the movie?\n\n${url}`)) return
        const { error } = await post("/assets/removeMovieAsset", { movieId, type, url })
        if (!error) {
            toast.info("Removed from this movie.")
            await onChanged()
        }
    }

    return (
        <section className="rounded-lg border border-white/10 bg-slate-950/50 p-4" aria-label={title}>
            <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{title}</h3>
                <span className="text-xs text-slate-500">{urls.length} added</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{hint}</p>

            {urls.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {urls.map((url, index) => (
                        <li key={url} className="rounded-md bg-white/5 p-2">
                            {editingUrl === url ? (
                                <form onSubmit={saveEdit} className="flex gap-2">
                                    <label htmlFor={`edit-${type}`} className="sr-only">Edit link</label>
                                    <input id={`edit-${type}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} className={inputClass} autoFocus />
                                    <button type="submit" className={primaryButton}>Save</button>
                                    <button type="button" onClick={() => setEditingUrl(null)} className={ghostButton}>Cancel</button>
                                </form>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {kind === "image" ? (
                                        <img src={url} alt="" referrerPolicy="no-referrer" className="h-14 w-10 shrink-0 rounded object-cover" />
                                    ) : (
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-800 text-sm">▶</span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <a href={url} target="_blank" rel="noreferrer" className="block truncate text-xs text-slate-300 hover:text-white hover:underline" title={url}>
                                            {shortUrl(url)}
                                        </a>
                                        {index === 0 ? (
                                            <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Shown on the site</span>
                                        ) : (
                                            <button type="button" onClick={() => makePrimary(url)} className="mt-1 text-[11px] font-medium text-rose-300 hover:underline">
                                                Make primary
                                            </button>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => startEdit(url)} className="rounded px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10">
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => remove(url)} aria-label="Remove" className="rounded px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                                        Remove
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    if (!uploading) setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    if (!uploading) handleFile(e.dataTransfer.files?.[0])
                }}
                className={`mt-3 rounded-lg border-2 border-dashed p-4 text-center transition ${
                    dragging ? "border-rose-400 bg-rose-500/10" : "border-white/15"
                }`}
            >
                {uploading ? (
                    <div>
                        <p className="truncate text-sm text-slate-300">Uploading {fileName}…</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                            <span>{progress}%</span>
                            <button type="button" onClick={() => abortRef.current?.abort()} className="text-red-300 hover:underline">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-300">Drag a {kind} file here, or</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={`${kind}/*`}
                            onChange={(e) => handleFile(e.target.files?.[0])}
                            className="sr-only"
                            id={`file-${type}`}
                        />
                        <label htmlFor={`file-${type}`} className={`${ghostButton} mt-2 inline-block cursor-pointer`}>
                            Choose {kind} file
                        </label>
                        <p className="mt-2 text-[11px] text-slate-500">Uploaded to Cloudinary and linked automatically.</p>
                    </>
                )}
            </div>

            <form onSubmit={addLink} className="mt-3 flex gap-2">
                <label htmlFor={`link-${type}`} className="sr-only">Paste a link</label>
                <input id={`link-${type}`} value={link} onChange={(e) => setLink(e.target.value)} placeholder={linkPlaceholder} disabled={uploading} className={inputClass} />
                <button type="submit" disabled={!link.trim() || uploading} className={primaryButton}>
                    Add
                </button>
            </form>
        </section>
    )
}

export function AssetEditor({ movie, onChanged }) {
    const { get } = useApi()
    const [assets, setAssets] = useState(null)
    const movieId = movie?._id

    const refresh = useCallback(async () => {
        if (!movieId) return
        const { data } = await get(`/movies/detail/${movieId}`)
        if (data) setAssets(data.assets?.[0] ?? { images: [], videos: [], trailers: [] })
    }, [get, movieId])

    useEffect(() => {
        setAssets(null)
        refresh()
    }, [refresh])

    const changed = async () => {
        await refresh()
        await onChanged()
    }

    if (!movie) {
        return (
            <section className={panelClass}>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs">3</span>
                    Posters, trailers & movie
                </h2>
                <p className="mt-6 rounded-md bg-white/5 p-4 text-sm text-slate-400">Select a movie in the middle to add its poster, trailer and the movie file.</p>
            </section>
        )
    }

    return (
        <section className={panelClass} aria-labelledby="assets-title">
            <h2 id="assets-title" className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs">3</span>
                <span className="truncate">{movie.title.trim()}</span>
            </h2>

            {!assets ? (
                <div className="mt-4 space-y-3" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 animate-pulse rounded-lg bg-white/5" />
                    ))}
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    <AssetSection
                        title="Poster image"
                        hint="Shown on cards, banners and the info panel. A portrait image works best."
                        type="images"
                        kind="image"
                        linkPlaceholder="Paste an image link (https://…)"
                        urls={assets.images ?? []}
                        movieId={movieId}
                        onChanged={changed}
                    />
                    <AssetSection
                        title="Trailer"
                        hint="Plays when hovering a card. Paste a YouTube link, or upload a video."
                        type="trailers"
                        kind="video"
                        linkPlaceholder="Paste a YouTube or video link"
                        urls={assets.trailers ?? []}
                        movieId={movieId}
                        onChanged={changed}
                    />
                    <AssetSection
                        title="Movie file"
                        hint="The full movie that plays on the watch page. Upload it or paste a direct video link."
                        type="videos"
                        kind="video"
                        linkPlaceholder="Paste a direct video link (.mp4)"
                        urls={assets.videos ?? []}
                        movieId={movieId}
                        onChanged={changed}
                    />
                </div>
            )}
        </section>
    )
}
