import { useEffect, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { useCategories } from "./CategoriesContext"

const linkClass = ({ isActive }) =>
    `block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        isActive ? "bg-rose-500 text-white shadow-md" : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`

export const Header = () => {
    const { categories, loaded } = useCategories()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)

    const menus = categories.filter((category) => category.name?.trim())

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (event) => event.key === "Escape" && setOpen(false)
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [open])

    const renderLinks = () =>
        menus.map((category) => (
            <NavLink key={category._id} to={`/movies/${encodeURIComponent(category.name.trim().toLowerCase())}`} className={linkClass}>
                {category.name}
            </NavLink>
        ))

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 text-lg shadow-md">
                        🎬
                    </span>
                    Movie<span className="text-rose-400">Manager</span>
                </Link>

                <nav aria-label="Categories" className="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
                    {!loaded && <span className="h-8 w-40 animate-pulse rounded-full bg-white/10" />}
                    {renderLinks()}
                </nav>

                {menus.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label={open ? "Close menu" : "Open menu"}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 md:hidden"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-6 w-6">
                            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                )}
            </div>

            {open && (
                <nav id="mobile-menu" aria-label="Categories" className="border-t border-white/10 bg-slate-900/95 px-4 pb-4 pt-3 shadow-xl backdrop-blur md:hidden">
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Browse</p>
                    <div className="flex flex-col gap-1">{renderLinks()}</div>
                </nav>
            )}
        </header>
    )
}
