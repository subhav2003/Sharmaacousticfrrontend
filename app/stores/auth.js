import { defineStore } from "pinia"

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null,
        token: null,
    }),
    getters: {
        isLoggedIn: (s) => !!s.token,
    },
    actions: {
        login(user, token) {
            this.user = user
            this.token = token
        },
        logout() {
            this.user = null
            this.token = null
            this.cart = null
        },
    },
    persist: {
        paths: ["user", "token"], // ✅ no direct localStorage here
    },
})
