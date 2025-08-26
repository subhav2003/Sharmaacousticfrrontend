// middleware/admin.ts
import { defineNuxtRouteMiddleware, navigateTo } from "#app"
import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware((to, from) => {
    const auth = useAuthStore()

    // Check if user is logged in
    if (!auth.isLoggedIn) {
        return navigateTo("/login") // redirect to login
    }

    // (Optional) Check role
    if (to.path.startsWith("/admin") && auth.user?.role !== "admin") {
        return navigateTo("/") // block non-admins
    }
})
