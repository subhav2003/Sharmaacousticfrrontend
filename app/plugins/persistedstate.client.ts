import { defineNuxtPlugin } from '#app'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
    // nuxtApp.$pinia is automatically injected by @pinia/nuxt
    ;(nuxtApp.$pinia as never).use(piniaPluginPersistedstate)
})
