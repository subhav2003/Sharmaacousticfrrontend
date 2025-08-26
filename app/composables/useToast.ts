// composables/useToast.ts
import { reactive } from "vue"

type ToastType = "success" | "error" | "info"

type Toast = {
    id: string
    message: string
    type: ToastType
    timeout?: number
}

const state = reactive<{ toasts: Toast[] }>({
    toasts: [],
})

function uuid() {
    // Prefer stable unique ids
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random()}`
}

function showToast(message: string, type: ToastType = "success", timeout = 4000) {
    const id = uuid()
    state.toasts.push({ id, message, type, timeout })
    if (timeout > 0) {
        setTimeout(() => removeToast(id), timeout)
    }
    return id
}

function removeToast(id: string) {
    const i = state.toasts.findIndex((t) => t.id === id)
    if (i !== -1) state.toasts.splice(i, 1)
}

function clearToasts() {
    state.toasts.splice(0, state.toasts.length)
}

export function useToast() {
    return {
        toasts: state.toasts,
        showToast,
        removeToast,
        clearToasts,
    }
}
