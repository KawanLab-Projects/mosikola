import axios from "axios"

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.tolol.org', })
export const assetURL = process.env.NEXT_PUBLIC_ASSET_URL || 'https://api.tolol.org'

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('token')
            ?? document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1]
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    } catch {
        // localStorage unavailable (SSR or blocked)
    }
    return config
})