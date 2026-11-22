import { useState } from "react"
import { ghostButton, inputClass, panelClass, primaryButton } from "./ui"

function EditRow({ category, categories, onSave, onCancel }) {
    const [name, setName] = useState(category.name ?? "")
    const [description, setDescription] = useState(category.description ?? "")
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return setError("The name cannot be empty.")
        if (categories.some((c) => c._id !== category._id && c.name?.toLowerCase() === trimmed.toLowerCase())) {
            return setError("Another category already uses that name.")
        }
        setBusy(true)
        const ok = await onSave(category._id, { name: trimmed, description: description.trim() })
        setBusy(false)
        if (ok) onCancel()
    }

    return (
        <form onSubmit={submit} className="space-y-2 rounded-md border border-rose-400/50 bg-slate-950/70 p-3">
            <label htmlFor={`edit-name-${category._id}`} className="sr-only">Category name</label>
            <input id={`edit-name-${category._id}`} value={name} onChange={(e) => { setName(e.target.value); setError("") }} className={inputClass} autoFocus />
            <label htmlFor={`edit-desc-${category._id}`} className="sr-only">Description</label>
            <input id={`edit-desc-${category._id}`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className={inputClass} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={busy} className={primaryButton}>{busy ? "Saving…" : "Save"}</button>
                <button type="button" onClick={onCancel} className={ghostButton}>Cancel</button>
            </div>
        </form>
    )
}

export function CategoryPanel({ categories, selectedId, onSelect, onCreate, onUpdate }) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const submit = async (event) => {
        event.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return setError("Give the category a name.")
        if (categories.some((c) => c.name?.toLowerCase() === trimmed.toLowerCase())) {
            return setError("That category already exists.")
        }

        setBusy(true)
        const ok = await onCreate({ name: trimmed, description: description.trim() })
        setBusy(false)
        if (ok) {
            setName("")
            setDescription("")
            setError("")
        }
    }

    return (
        <section className={panelClass} aria-labelledby="categories-title">
            <h2 id="categories-title" className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs">1</span>
                Categories
            </h2>

            <ul className="mt-4 space-y-1.5">
                {categories.length === 0 && <li className="rounded-md bg-white/5 p-3 text-sm text-slate-400">No categories yet. Create your first one below.</li>}
                {categories.map((category) => {
                    const active = category._id === selectedId

                    if (editingId === category._id) {
                        return (
                            <li key={category._id}>
                                <EditRow category={category} categories={categories} onSave={onUpdate} onCancel={() => setEditingId(null)} />
                            </li>
                        )
                    }

                    return (
                        <li key={category._id} className="flex items-stretch gap-1">
                            <button
                                type="button"
                                onClick={() => onSelect(category._id)}
                                aria-pressed={active}
                                className={`flex min-w-0 flex-1 items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                    active ? "bg-rose-500 font-semibold text-white" : "bg-white/5 text-slate-200 hover:bg-white/10"
                                }`}
                            >
                                <span className="truncate">{category.name || "(unnamed)"}</span>
                                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/25" : "bg-white/10 text-slate-300"}`}>
                                    {category.movies?.length ?? 0}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingId(category._id)}
                                aria-label={`Edit ${category.name}`}
                                className="rounded-md bg-white/5 px-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/15"
                            >
                                Edit
                            </button>
                        </li>
                    )
                })}
            </ul>

            <form onSubmit={submit} className="mt-5 space-y-3 border-t border-white/10 pt-5">
                <p className="text-sm font-semibold text-slate-300">New category</p>
                <div>
                    <label htmlFor="category-name" className="sr-only">Category name</label>
                    <input
                        id="category-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value)
                            setError("")
                        }}
                        placeholder="e.g. Thriller"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="category-description" className="sr-only">Description</label>
                    <input
                        id="category-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description (optional)"
                        className={inputClass}
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
                    {busy ? "Adding…" : "Add category"}
                </button>
            </form>
        </section>
    )
}
