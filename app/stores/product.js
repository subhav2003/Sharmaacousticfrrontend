import { defineStore } from "pinia"
import { useApi } from "~/composables/useApi"

// Default filters (safe shape so UI never crashes)
const defaultFilters = {
    priceMin: 0,
    priceMax: 1000,
    category: null,
}

export const useProductStore = defineStore("product", {
    state: () => ({
        products: [],
        categories: [],
        links: {},
        meta: {},
        filters: { ...defaultFilters }, // ✅ always has keys
        loaded: false,
        categoriesLoaded: false,
        loading: false,
    }),

    getters: {
        hasNextPage: (state) => !!state.links?.next,
        currentPage: (state) => state.meta?.current_page || 1,
        totalPages: (state) => state.meta?.last_page || 1,
        totalProducts: (state) => state.meta?.total || 0,
    },

    actions: {
        // ✅ Load filters from sessionStorage safely
        loadFilters() {
            if (import.meta.client) {
                const saved = sessionStorage.getItem("shopFilters")
                if (saved) {
                    this.filters = { ...defaultFilters, ...JSON.parse(saved) }
                }
            }
        },

        async fetchProducts(params = {}, reset = false) {
            try {
                this.loading = true
                const api = useApi()

                const query = {
                    ...this.filters,
                    ...params,
                }

                const res = await api.get("/products", { params: query })
                const d = res.data

                if (reset) {
                    this.products = d.data
                } else {
                    if (this.products.length && query.page > 1) {
                        this.products.push(...d.data)
                    } else {
                        this.products = d.data
                    }
                }

                this.links = d.links || {}
                this.meta = d.meta || {}
                this.loaded = true

                // ✅ Save filters
                if (import.meta.client) {
                    sessionStorage.setItem("shopFilters", JSON.stringify(this.filters))
                }
            } catch (err) {
                console.error("Error fetching products:", err)
            } finally {
                this.loading = false
            }
        },

        async fetchCategories(force = false) {
            try {
                if (this.categoriesLoaded && !force) return this.categories
                const api = useApi()
                const res = await api.get("/categories")
                this.categories = res.data.data || res.data || []
                this.categoriesLoaded = true
                return this.categories
            } catch (err) {
                console.error("Error fetching categories:", err)
                this.categories = []
            }
        },

        setFilter(key, value) {
            this.filters[key] = value
            if (import.meta.client) {
                sessionStorage.setItem("shopFilters", JSON.stringify(this.filters))
            }
        },

        resetProducts() {
            this.products = []
            this.links = {}
            this.meta = {}
            this.loaded = false
        },

        resetCategories() {
            this.categories = []
            this.categoriesLoaded = false
        },

        resetFilters() {
            this.filters = { ...defaultFilters } // ✅ reset to safe defaults
            if (import.meta.client) {
                sessionStorage.setItem("shopFilters", JSON.stringify(this.filters))
            }
        },
    },
})
