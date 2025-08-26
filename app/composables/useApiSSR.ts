// composables/useApiSSR.ts
import { useAuthStore } from "~/stores/auth"

export function useApiSSR() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    return async (url, options = {}) => {
        const headers = {
            ...(options.headers || {}),
        }

        if (auth.token) {
            headers.Authorization = `Bearer ${auth.token}`
        }

        return await $fetch(url, {
            baseURL: config.public.apiBaseUrl,
            headers,
            ...options,
        })
    }
}
