import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useApi } from "../hooks/useApi"

const CategoriesContext = createContext(null)

// One shared copy of the categories (with their movies) so the header menu and the admin page always agree.
export function CategoriesProvider({ children }) {
    const { get } = useApi({ toast: false })
    const [categories, setCategories] = useState([])
    const [loaded, setLoaded] = useState(false)

    const refresh = useCallback(async () => {
        const { data } = await get("/movies/categories")
        if (data) setCategories(data)
        setLoaded(true)
        return data ?? []
    }, [get])

    useEffect(() => {
        refresh()
    }, [refresh])

    const value = useMemo(() => ({ categories, loaded, refresh }), [categories, loaded, refresh])

    return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}

export function useCategories() {
    const ctx = useContext(CategoriesContext)
    if (!ctx) throw new Error("useCategories must be used inside <CategoriesProvider>")
    return ctx
}
