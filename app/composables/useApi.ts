// composables/useApi.js
import axios from "axios"
import { useAuthStore } from "~/stores/auth"

export function useApi() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    const api = axios.create({
        baseURL: config.public.apiBaseUrl,
        withCredentials: true,
    })

    // Attach token if available
    api.interceptors.request.use((req) => {
        if (auth.token) {
            req.headers.Authorization = `Bearer ${auth.token}`
        }
        return req
    })

    return api
}
