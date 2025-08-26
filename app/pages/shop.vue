<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useApiSSR } from "~/composables/useApiSSR"
import ProductCard from "@/components/ProductCard.vue"
import { Filter, Search } from "lucide-vue-next"
import Spinner from "@/components/Spinner.vue"

const route = useRoute()
const router = useRouter()
const api = useApiSSR()

// --- UI state ---
const showFilters = ref(false)
const isDesktop = ref(false)

// --- Filters ---
const filters = reactive({
  categories: [] as number[],
  priceRange: [500, 250000],
  inStock: null as number | null,
  q: "",
  sort: (route.query.sort as string) || "created_at",
  order: (route.query.order as string) || "desc",
})

// --- Hydrate filters from URL ---
function initFiltersFromUrl() {
  const q = route.query
  if (q["category_id[]"]) {
    filters.categories = Array.isArray(q["category_id[]"])
        ? (q["category_id[]"] as string[]).map(Number)
        : [Number(q["category_id[]"])]
  }
  if (q.price_min && q.price_max)
    filters.priceRange = [Number(q.price_min), Number(q.price_max)]
  if (q.in_stock !== undefined)
    filters.inStock = q.in_stock === "null" ? null : Number(q.in_stock)
  if (q.q) filters.q = String(q.q)
  if (q.sort) filters.sort = String(q.sort)
  if (q.order) filters.order = String(q.order)
}
initFiltersFromUrl()

// --- Initial SSR fetch ---
const { data: ssrProducts } = await useAsyncData("shop-products", () =>
    api("/products", {
      params: { page: 1, ...buildQueryParams() },
    })
)

const { data: ssrCategories } = await useAsyncData("shop-categories", () =>
    api("/categories")
)

// --- Local state hydrated from SSR ---
const products = ref(ssrProducts.value?.data || [])
const categories = ref(ssrCategories.value?.data || [])
const meta = ref(ssrProducts.value?.meta || { total: 0 })
const loading = ref(false)
const hasNextPage = ref(!!ssrProducts.value?.links?.next)
const currentPage = ref(1)

// --- Detect desktop ---
function detectDesktop() {
  isDesktop.value = window.matchMedia("(min-width: 1024px)").matches
}

// --- Build query params ---
function buildQueryParams() {
  const params: any = {}
  if (filters.categories.length) params["category_id[]"] = filters.categories
  if (filters.priceRange) {
    params.price_min = filters.priceRange[0]
    params.price_max = filters.priceRange[1]
  }
  if (filters.inStock !== null) params.in_stock = filters.inStock
  if (filters.q) params.q = filters.q
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  return params
}

// --- Sync filters → URL ---
function updateUrl() {
  router.replace({ query: buildQueryParams() })
}

// --- Fetch products (client-side updates) ---
async function fetchProducts(page = 1, replace = false) {
  loading.value = true
  try {
    const res = await api("/products", { params: { page, ...buildQueryParams() } })
    if (replace) {
      products.value = res.data
    } else {
      products.value.push(...res.data)
    }
    meta.value = res.meta
    currentPage.value = page
    hasNextPage.value = !!res.links?.next
  } finally {
    loading.value = false
  }
}

// --- Infinite scroll ---
let observer: IntersectionObserver | null = null
function handleIntersect(entries: IntersectionObserverEntry[]) {
  const entry = entries[0]
  if (entry.isIntersecting && hasNextPage.value && !loading.value) {
    fetchProducts(currentPage.value + 1)
  }
}

// --- Watch filters (debounced) ---
let filterTimeout: NodeJS.Timeout
watch(
    filters,
    () => {
      clearTimeout(filterTimeout)
      filterTimeout = setTimeout(() => {
        updateUrl()
        fetchProducts(1, true)
      }, 500)
    },
    { deep: true }
)

// --- Lifecycle ---
onMounted(() => {
  detectDesktop()
  window.addEventListener("resize", detectDesktop)

  observer = new IntersectionObserver(handleIntersect, { threshold: 1.0 })
  const sentinel = document.querySelector("#sentinel")
  if (sentinel) observer.observe(sentinel)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", detectDesktop)
  if (observer) observer.disconnect()
})

// --- SEO ---
const totalProducts = computed(() => meta.value?.total || 0)
const loadingMore = computed(() => loading.value && products.value.length > 0)

// Dynamic JSON-LD ItemList
const jsonLd = computed(() => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.value.map((p, index) => ({
      "@type": "Product",
      "position": index + 1,
      "name": p.name,
      "url": `https://yourdomain.com/product/${p.id}`,
      "image": p.primary_image_url || (p.images?.[0]?.url ?? ""),
      "offers": {
        "@type": "Offer",
        "priceCurrency": "NPR",
        "price": p.price,
        "availability": p.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
      }
    }))
  }
})

useHead({
  title: "Shop | SharmaAcoustic",
  meta: [
    { name: "description", content: "Browse premium audio gear and accessories at SharmaAcoustic." },
    { property: "og:title", content: "Shop | SharmaAcoustic" },
    { property: "og:description", content: "Discover handcrafted and high-quality audio products." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Shop | SharmaAcoustic" },
    { name: "twitter:description", content: "Discover handcrafted and high-quality audio products." },
  ],
  link: [{ rel: "canonical", href: "https://yourdomain.com/shop" }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify(jsonLd.value)
    }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
      <!-- Overlay for mobile -->
      <div
          v-if="showFilters && !isDesktop"
          class="fixed inset-0 z-40 bg-black/40"
          @click.self="showFilters = false"
      ></div>

      <!-- Sidebar Filters -->
      <aside
          class="fixed top-16 left-0 h-full w-72 bg-white shadow-2xl z-40 transform transition-transform duration-300
               lg:static lg:translate-x-0 lg:w-64 lg:block"
          :class="{
          '-translate-x-full': !showFilters && !isDesktop,
          'translate-x-0': showFilters || isDesktop,
        }"
      >
        <div class="p-6 h-full overflow-y-auto lg:h-auto lg:overflow-visible">
          <h3 class="text-xl font-bold mb-6 text-gray-800 border-b pb-3">Filters</h3>

          <!-- Categories -->
          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">Category</h4>
            <ul v-if="categories && categories.length" class="space-y-2 text-sm text-gray-600">
              <li v-for="c in categories" :key="c.id">
                <input type="checkbox" :id="'cat-' + c.id" :value="c.id" v-model="filters.categories" />
                <label :for="'cat-' + c.id">{{ c.name }}</label>
              </li>
            </ul>
            <p v-else class="text-xs text-gray-400 mt-2"><Spinner/></p>
          </div>

          <!-- Price Range -->
          <div class="mb-6">
            <h4 class="font-semibold text-gray-700 mb-3">Price Range (NPR)</h4>
            <div class="flex flex-col gap-3">
              <input type="range" min="500" max="250000" step="500" v-model.number="filters.priceRange[0]" class="range-black" />
              <input type="range" min="500" max="250000" step="500" v-model.number="filters.priceRange[1]" class="range-black" />
              <div class="flex justify-between text-sm text-gray-600">
                <span>Min: Rs {{ filters.priceRange[0].toLocaleString() }}</span>
                <span>Max: Rs {{ filters.priceRange[1].toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Stock -->
          <div>
            <h4 class="font-semibold text-gray-700 mb-3">Availability</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <input type="radio" id="in_stock" :value="1" v-model="filters.inStock" />
                <label for="in_stock">In Stock</label>
              </li>
              <li>
                <input type="radio" id="out_stock" :value="0" v-model="filters.inStock" />
                <label for="out_stock">Out of Stock</label>
              </li>
              <li>
                <input type="radio" id="both_stock" :value="null" v-model="filters.inStock" />
                <label for="both_stock">Both</label>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Main Products Section -->
      <main class="flex-1 w-full">
        <!-- Mobile Filter Toggle -->
        <button
            class="lg:hidden flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md mb-6"
            @click="showFilters = true"
        >
          <Filter class="w-4 h-4" /> Filters
        </button>

        <!-- Search bar -->
        <div class="bg-white rounded-xl shadow p-4 flex items-center gap-3 mb-6">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                v-model="filters.q"
                type="text"
                placeholder="Search products..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/60"
            />
          </div>
        </div>

        <!-- Product count + Sort -->
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-2xl font-extrabold animate-fade-in">
            {{ totalProducts }} Products
          </h1>

          <div class="flex items-center gap-2">
            <select v-model="filters.sort" class="border bg-white border-gray-300 rounded-md px-2 py-1 text-sm">
              <option value="created_at">Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="price">Price (Low → High)</option>
            </select>
            <select v-model="filters.order" class="border bg-white border-gray-300 rounded-md px-2 py-1 text-sm">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading && !(products && products.length)" class="text-center text-gray-500">
          <Spinner/>
        </div>

        <!-- Product Grid -->
        <div
            v-else-if="products && products.length"
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in"
        >
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>

        <div v-else class="text-center text-gray-500">No products found.</div>

        <!-- Lazy Load Sentinel -->
        <div id="sentinel" class="h-20 flex items-center justify-center mt-10">
          <span v-if="loadingMore" class="text-gray-500"><Spinner/></span>
          <span v-else-if="!hasNextPage && products && products.length" class="text-gray-400">
            End of the catalogue.
          </span>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.range-black {
  accent-color: black;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.7s ease both; }
</style>
