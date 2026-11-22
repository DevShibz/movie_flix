import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useToast } from "../components/Toast"

export const NotFound = () => {
    const { pathname } = useLocation()
    const toast = useToast()

    useEffect(() => {
        toast.error(`The page "${pathname}" does not exist.`, { title: "404 - Page not found" })
    }, [pathname, toast])

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 p-12 text-center">
            <h1 className="text-6xl font-extrabold text-rose-500">404</h1>
            <p className="text-slate-600">We couldn't find <span className="font-mono">{pathname}</span></p>
            <Link to="/" className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-rose-600">
                Back to home
            </Link>
        </div>
    )
}
