// stores/cart.js
import { defineStore } from "pinia"
import { useAuthStore } from "~/stores/auth"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"

export const useCartStore = defineStore("cart", {
    state: () => ({
        items: [],
        isOpen: false,
        loading: false,
    }),

    getters: {
        count: (s) =>
            Array.isArray(s.items)
                ? s.items.reduce((n, i) => n + i.quantity, 0)
                : 0,
        total: (s) =>
            Array.isArray(s.items)
                ? s.items.reduce((n, i) => n + (i.price || 0) * i.quantity, 0)
                : 0,
    },

    actions: {
        toggleCart() {
            this.isOpen = !this.isOpen
        },

        /** Normalize cart item */
        normalizeItem(raw) {
            const product = raw.product || raw
            return {
                id: raw.id || null, // API cart item id or null for local
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: product.stock ?? null,
                image:
                    product.primary_image_url ||
                    product.image ||
                    "https://via.placeholder.com/150x150?text=No+Image",
                quantity: raw.quantity,
                subtotal: Number(product.price) * raw.quantity,
            }
        },

        /** --- Local Cart Helpers --- */
        loadLocal() {
            if (process.client) {
                const saved = localStorage.getItem("cart")
                this.items = saved ? JSON.parse(saved) : []
            }
        },
        saveLocal() {
            if (process.client) {
                localStorage.setItem("cart", JSON.stringify(this.items))
            }
        },
        clearLocal() {
            this.items = []
            if (process.client) {
                localStorage.removeItem("cart")
            }
        },

        /** --- API Cart Helpers --- */
        async loadApi() {
            const api = useApi()
            this.loading = true
            try {
                const res = await api.get("/cart")
                this.items = (res.data?.data || []).map(this.normalizeItem)
                this.saveLocal() // ✅ keep local copy in sync
            } catch (e) {
                console.error("Failed to fetch API cart", e)
            } finally {
                this.loading = false
            }
        },

        /** Merge local cart into API after login/register */
        async mergeLocalWithApi() {
            const auth = useAuthStore()
            const api = useApi()
            const { showToast } = useToast()

            if (!auth.isLoggedIn || !this.items.length) return

            try {
                const res = await api.post("/cart/merge", {
                    items: this.items.map((i) => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                    })),
                })
                this.items = (res.data?.data || []).map(this.normalizeItem)

                // ✅ Instead of clearing, sync API cart into local
                this.saveLocal()

                showToast("Cart merged successfully", "success")
            } catch (e) {
                console.error("Cart merge failed", e)
                showToast("Failed to merge cart", "error")
            }
        },

        /** Load cart (decides local or API) */
        async load() {
            const auth = useAuthStore()
            if (auth.isLoggedIn) await this.loadApi()
            else this.loadLocal()
        },

        /** Add item */
        async addToCart(product, qty = 1) {
            const auth = useAuthStore()
            const api = useApi()
            const { showToast } = useToast()
            if (qty <= 0) return

            if (product.stock !== undefined && qty > product.stock) {
                showToast(`Only ${product.stock} available in stock`, "error")
                return
            }

            if (auth.isLoggedIn) {
                try {
                    const res = await api.post("/cart", {
                        product_id: product.id,
                        quantity: qty,
                    })
                    this.items = (res.data?.data || []).map(this.normalizeItem)
                    this.saveLocal() // ✅ sync
                    showToast("Item added to cart", "success")
                } catch (e) {
                    const bag = e?.response?.data?.errors
                    if (bag) Object.values(bag).flat().forEach((m) => showToast(m, "error"))
                    else showToast(e?.response?.data?.message || "Failed to add item", "error")
                }
            } else {
                const existing = this.items.find((i) => i.product_id === product.id)
                if (existing) {
                    const newQty = existing.quantity + qty
                    if (product.stock && newQty > product.stock) {
                        showToast(`Cannot exceed available stock (${product.stock})`, "error")
                        return
                    }
                    existing.quantity = newQty
                    existing.subtotal = existing.price * existing.quantity
                } else {
                    this.items.push(this.normalizeItem({ ...product, quantity: qty }))
                }
                this.saveLocal()
                showToast("Item added to cart", "success")
            }
        },

        /** Update quantity */
        async updateQuantity(id, qty) {
            const auth = useAuthStore()
            const api = useApi()
            const { showToast } = useToast()
            if (qty <= 0) return

            if (auth.isLoggedIn) {
                try {
                    const res = await api.put(`/cart/${id}`, { quantity: qty })
                    this.items = (res.data?.data || []).map(this.normalizeItem)
                    this.saveLocal() // ✅ sync
                    showToast("Cart updated", "success")
                } catch (e) {
                    const bag = e?.response?.data?.errors
                    if (bag) Object.values(bag).flat().forEach((m) => showToast(m, "error"))
                    else showToast(e?.response?.data?.message || "Failed to update cart", "error")
                }
            } else {
                const item = this.items.find((i) => i.product_id === id || i.id === id)
                if (item) {
                    if (item.stock && qty > item.stock) {
                        showToast(`Cannot exceed available stock (${item.stock})`, "error")
                        return
                    }
                    item.quantity = qty
                    item.subtotal = item.price * qty
                    this.saveLocal()
                    showToast("Cart updated", "success")
                }
            }
        },

        /** Remove item */
        async removeFromCart(id) {
            const auth = useAuthStore()
            const api = useApi()
            const { showToast } = useToast()

            if (auth.isLoggedIn) {
                try {
                    const res = await api.delete(`/cart/${id}`)
                    this.items = (res.data?.data || []).map(this.normalizeItem)
                    this.saveLocal() // ✅ sync
                    showToast("Item removed", "success")
                } catch (e) {
                    showToast(e?.response?.data?.message || "Failed to remove item", "error")
                }
            } else {
                this.items = this.items.filter(
                    (i) => i.product_id !== id && i.id !== id
                )
                this.saveLocal()
                showToast("Item removed", "success")
            }
        },

        /** Clear cart */
        async clearCart() {
            const auth = useAuthStore()
            const api = useApi()
            const { showToast } = useToast()

            if (auth.isLoggedIn) {
                try {
                    const res = await api.delete("/cart")
                    this.items = (res.data?.data || []).map(this.normalizeItem)
                    this.saveLocal() // ✅ sync
                    showToast("Cart cleared", "success")
                } catch (e) {
                    showToast(e?.response?.data?.message || "Failed to clear cart", "error")
                }
            } else {
                this.clearLocal()
                showToast("Cart cleared", "success")
            }
        },
    },
})
