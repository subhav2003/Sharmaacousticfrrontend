<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"
import { Plus, Pencil, Trash2, X, ImagePlus, Crown, Search, ChevronLeft, ChevronRight } from "lucide-vue-next"

definePageMeta({
  layout: "admin",
  middleware: "admin",// ✅ tells Nuxt to use layouts/admin.vue
})

const api = useApi()
const { showToast } = useToast()


// Tabs
const tab = ref("products") // products | categories

// UI state
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const modalOpen = ref(false)

// Filters
const filters = reactive({
  q: "",
  category_id: "",
  in_stock: "",
  sort: "created_at",
  order: "desc",
  per_page: 10,
  page: 1,
})

const products = ref({ data: [], meta: { total: 0, current_page: 1, last_page: 1 } })
const categories = ref([])
const categoriesLoading = ref(false)

// Product form state
const isEditing = ref(false)
const currentId = ref(null)
const productForm = reactive({
  category_id: "",
  name: "",
  price: "",
  stock: "",
  description: "",
})

// Images
const newFiles = ref([])          // File[]
const gallery = ref([])           // existing [{id, url, path, is_primary, sort_order}]
const deleteImages = ref([])      // ids
const primaryImageId = ref(null)  // existing primary id
const orders = ref({})            // { imageId: position }
const primaryIndexForNew = ref(0) // for new uploads in create mode

function resetProductForm() {
  isEditing.value = false
  currentId.value = null
  Object.assign(productForm, { category_id: "", name: "", price: "", stock: "", description: "" })
  newFiles.value = []
  gallery.value = []
  deleteImages.value = []
  primaryImageId.value = null
  orders.value = {}
  primaryIndexForNew.value = 0
}

async function fetchCategories() {
  try {
    categoriesLoading.value = true
    const { data } = await api.get("/categories", { params: { per_page: 999 } })
    categories.value = (data?.data ?? []).map(c => ({ id: c.id, name: c.name }))
  } catch {
    showToast("Failed to load categories", "error")
  } finally {
    categoriesLoading.value = false
  }
}

async function fetchProducts() {
  try {
    loading.value = true
    const { data } = await api.get("/products", { params: { ...filters } })
    products.value = {
      data: data?.data ?? [],
      meta: data?.meta ?? { total: 0, current_page: 1, last_page: 1 }
    }
  } catch {
    showToast("Failed to load products", "error")
  } finally {
    loading.value = false
  }
}

function openCreate() {
  resetProductForm()
  modalOpen.value = true
}

function openEdit(p) {
  resetProductForm()
  isEditing.value = true
  currentId.value = p.id
  productForm.category_id = p.category?.id ?? p.category_id ?? ""
  productForm.name = p.name
  productForm.price = p.price
  productForm.stock = p.stock
  productForm.description = p.description ?? ""
  gallery.value = (p.images ?? []).map(i => ({
    id: i.id,
    url: i.url,
    path: i.path,
    is_primary: !!i.is_primary,
    sort_order: i.sort_order ?? 0
  }))
  const primary = gallery.value.find(g => g.is_primary)
  primaryImageId.value = primary ? primary.id : null
  orders.value = {}
  gallery.value.forEach((g, idx) => { orders.value[g.id] = idx })
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  newFiles.value.push(...files)
  e.target.value = ""
}

function removeNewFile(index) {
  newFiles.value.splice(index, 1)
  if (primaryIndexForNew.value >= newFiles.value.length) {
    primaryIndexForNew.value = Math.max(0, newFiles.value.length - 1)
  }
}

function markExistingPrimary(id) {
  primaryImageId.value = id
  gallery.value = gallery.value.map(g => ({ ...g, is_primary: g.id === id }))
}

function queueDeleteImage(id) {
  if (!deleteImages.value.includes(id)) deleteImages.value.push(id)
  gallery.value = gallery.value.filter(g => g.id !== id)
  delete orders.value[id]
  if (primaryImageId.value === id) primaryImageId.value = null
}

function moveImage(id, dir) {
  const idx = gallery.value.findIndex(g => g.id === id)
  if (idx === -1) return
  const newIdx = dir === "up" ? Math.max(0, idx - 1) : Math.min(gallery.value.length - 1, idx + 1)
  if (idx === newIdx) return
  const [item] = gallery.value.splice(idx, 1)
  gallery.value.splice(newIdx, 0, item)
  gallery.value.forEach((g, i) => { orders.value[g.id] = i })
}

async function submitProduct() {
  try {
    saving.value = true
    if (isEditing.value) {
      const id = currentId.value
      const hasFiles = newFiles.value.length > 0
      if (hasFiles) {
        const fd = new FormData()
        if (productForm.category_id) fd.append("category_id", productForm.category_id)
        if (productForm.name) fd.append("name", productForm.name)
        if (productForm.price !== "") fd.append("price", String(productForm.price))
        if (productForm.stock !== "") fd.append("stock", String(productForm.stock))
        if (productForm.description) fd.append("description", productForm.description)
        newFiles.value.forEach(f => fd.append("images[]", f))
        deleteImages.value.forEach(i => fd.append("delete_images[]", String(i)))
        Object.entries(orders.value).forEach(([imageId, pos]) => fd.append(`orders[${imageId}]`, String(pos)))
        if (primaryImageId.value) fd.append("primary_image_id", String(primaryImageId.value))
        const { data } = await api.patch(`/products/${id}`, fd)
        showToast(data?.message || "Product updated", "success")
      } else {
        const body = {
          category_id: productForm.category_id || undefined,
          name: productForm.name || undefined,
          price: productForm.price !== "" ? Number(productForm.price) : undefined,
          stock: productForm.stock !== "" ? Number(productForm.stock) : undefined,
          description: productForm.description || undefined,
          delete_images: deleteImages.value.length ? deleteImages.value : undefined,
          orders: Object.keys(orders.value).length ? orders.value : undefined,
          primary_image_id: primaryImageId.value || undefined,
        }
        const { data } = await api.patch(`/products/${id}`, body)
        showToast(data?.message || "Product updated", "success")
      }
    } else {
      const fd = new FormData()
      fd.append("category_id", productForm.category_id)
      fd.append("name", productForm.name)
      fd.append("price", String(productForm.price))
      fd.append("stock", String(productForm.stock))
      if (productForm.description) fd.append("description", productForm.description)
      newFiles.value.forEach(f => fd.append("images[]", f))
      if (newFiles.value.length) fd.append("primary_index", String(primaryIndexForNew.value))
      const { data } = await api.post("/products", fd)
      showToast(data?.message || "Product created", "success")
    }
    closeModal()
    await fetchProducts()
  } catch (e) {
    const bag = e?.response?.data?.errors
    if (bag) Object.values(bag).flat().forEach(m => showToast(String(m), "error"))
    else showToast(e?.response?.data?.message || "Operation failed", "error")
  } finally {
    saving.value = false
  }
}

async function deleteProduct(id) {
  if (deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/products/${id}`)
    showToast(data?.message || "Product deleted", "success")
    await fetchProducts()
  } catch (e) {
    showToast(e?.response?.data?.message || "Delete failed", "error")
  } finally {
    deleting.value = false
  }
}

// Categories CRUD in same page
const catModalOpen = ref(false)
const catEditing = ref(false)
const catCurrentId = ref(null)
const catForm = reactive({ name: "" })
const catSaving = ref(false)
const catDeleting = ref(false)

function openCreateCategory() {
  catEditing.value = false
  catCurrentId.value = null
  catForm.name = ""
  catModalOpen.value = true
}
function openEditCategory(cat) {
  catEditing.value = true
  catCurrentId.value = cat.id
  catForm.name = cat.name
  catModalOpen.value = true
}
function closeCatModal() {
  catModalOpen.value = false
}

async function submitCategory() {
  try {
    catSaving.value = true
    if (catEditing.value) {
      const { data } = await api.patch(`/categories/${catCurrentId.value}`, { name: catForm.name })
      showToast(data?.message || "Category updated", "success")
    } else {
      const { data } = await api.post("/categories", { name: catForm.name })
      showToast(data?.message || "Category created", "success")
    }
    closeCatModal()
    await fetchCategories()
    await fetchProducts()
  } catch (e) {
    const bag = e?.response?.data?.errors
    if (bag) Object.values(bag).flat().forEach(m => showToast(String(m), "error"))
    else showToast(e?.response?.data?.message || "Operation failed", "error")
  } finally {
    catSaving.value = false
  }
}

async function deleteCategory(id) {
  if (catDeleting.value) return
  catDeleting.value = true
  try {
    const { data } = await api.delete(`/categories/${id}`)
    showToast(data?.message || "Category deleted", "success")
    await fetchCategories()
    await fetchProducts()
  } catch (e) {
    showToast(e?.response?.data?.message || "Delete failed", "error")
  } finally {
    catDeleting.value = false
  }
}

// Pagination helpers
const canPrev = computed(() => (products.value.meta.current_page ?? 1) > 1)
const canNext = computed(() => (products.value.meta.current_page ?? 1) < (products.value.meta.last_page ?? 1))
function prevPage() { if (canPrev.value) { filters.page = (products.value.meta.current_page ?? 2) - 1 } }
function nextPage() { if (canNext.value) { filters.page = (products.value.meta.current_page ?? 0) + 1 } }

watch(() => ({ ...filters }), fetchProducts, { deep: true })

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-10">
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Product Management
        </h1>
        <p class="text-gray-600 mt-2">Manage products and categories in one place.</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-3 mb-6">
        <button
            class="px-4 py-2 rounded-xl font-medium transition-all"
            :class="tab==='products' ? 'bg-black text-white shadow-lg scale-[1.02]' : 'bg-white text-gray-800 shadow hover:scale-[1.01]'"
            @click="tab='products'">
          Products
        </button>
        <button
            class="px-4 py-2 rounded-xl font-medium transition-all"
            :class="tab==='categories' ? 'bg-black text-white shadow-lg scale-[1.02]' : 'bg-white text-gray-800 shadow hover:scale-[1.01]'"
            @click="tab='categories'">
          Categories
        </button>
      </div>

      <!-- PRODUCTS TAB -->
      <div v-if="tab==='products'" class="space-y-6 animate-fade-in">
        <!-- Actions + Filters -->
        <div class="bg-white rounded-2xl shadow p-4 md:p-6">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1 flex items-center gap-3">
              <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    v-model="filters.q"
                    type="text"
                    placeholder="Search products..."
                    class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/60"
                />
              </div>
              <select v-model="filters.category_id" class="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none">
                <option value="">All Categories</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <select v-model="filters.in_stock" class="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none">
                <option value="">Stock: Any</option>
                <option value="1">In stock</option>
                <option value="0">Out of stock</option>
              </select>
              <select v-model="filters.sort" class="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none">
                <option value="created_at">Newest</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              <select v-model="filters.order" class="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <button
                class="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl shadow hover:scale-[1.02] active:scale-[0.98] transition"
                @click="openCreate">
              <Plus class="w-5 h-5" /> New Product
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-sm font-semibold text-gray-700">Product</th>
                <th class="px-4 py-3 text-sm font-semibold text-gray-700">Category</th>
                <th class="px-4 py-3 text-sm font-semibold text-gray-700">Price</th>
                <th class="px-4 py-3 text-sm font-semibold text-gray-700">Stock</th>
                <th class="px-4 py-3 text-sm font-semibold text-gray-700"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="loading">
                <td class="px-4 py-6 text-gray-500" colspan="5">Loading products...</td>
              </tr>
              <tr v-for="p in products.data" :key="p.id" class="hover:bg-gray-50/70 transition">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img
                        :src="p.primary_image_url || '/placeholder.png'"
                        class="w-12 h-12 rounded-lg object-cover border"
                        alt=""
                    />
                    <div>
                      <div class="font-semibold text-gray-900">{{ p.name }}</div>
                      <div class="text-xs text-gray-500">#{{ p.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">{{ p.category?.name ?? '—' }}</td>
                <td class="px-4 py-3">Rs. {{ Number(p.price).toFixed(2) }}</td>
                <td class="px-4 py-3">
                  <span :class="p.stock > 0 ? 'text-green-600' : 'text-red-600'">{{ p.stock }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <button class="p-2 rounded-lg border hover:bg-gray-50" @click="openEdit(p)">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button class="p-2 rounded-lg border hover:bg-red-50 text-red-600" @click="deleteProduct(p.id)" :disabled="deleting">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && products.data.length === 0">
                <td class="px-4 py-6 text-gray-500" colspan="5">No products found.</td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div class="text-sm text-gray-600">
              Page {{ products.meta.current_page || 1 }} of {{ products.meta.last_page || 1 }}
            </div>
            <div class="flex items-center gap-2">
              <button class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50" :disabled="!canPrev" @click="prevPage">
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50" :disabled="!canNext" @click="nextPage">
                <ChevronRight class="w-4 h-4" />
              </button>
              <select v-model.number="filters.per_page" class="ml-2 px-3 py-2 rounded-lg border text-sm">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- CATEGORIES TAB -->
      <div v-else class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Categories</h2>
          <button
              class="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl shadow hover:scale-[1.02] active:scale-[0.98] transition"
              @click="openCreateCategory">
            <Plus class="w-5 h-5" /> New Category
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow overflow-hidden">
          <table class="min-w-full text-left">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="categoriesLoading">
              <td class="px-4 py-6 text-gray-500" colspan="2">Loading categories...</td>
            </tr>
            <tr v-for="c in categories" :key="c.id" class="hover:bg-gray-50/70 transition">
              <td class="px-4 py-3">{{ c.name }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button class="p-2 rounded-lg border hover:bg-gray-50" @click="openEditCategory(c)">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button class="p-2 rounded-lg border hover:bg-red-50 text-red-600" @click="deleteCategory(c.id)" :disabled="catDeleting">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!categoriesLoading && categories.length === 0">
              <td class="px-4 py-6 text-gray-500" colspan="2">No categories yet.</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PRODUCT MODAL -->
    <transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 md:p-8 animate-rise">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">{{ isEditing ? "Edit Product" : "Create Product" }}</h3>
            <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeModal"><X class="w-5 h-5" /></button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input v-model="productForm.name" type="text" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Category</label>
              <select v-model="productForm.category_id" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2">
                <option value="">Select category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Price</label>
              <input v-model="productForm.price" type="number" step="0.01" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Stock</label>
              <input v-model="productForm.stock" type="number" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea v-model="productForm.description" rows="3" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2"></textarea>
            </div>
          </div>

          <!-- Images -->
          <div class="mt-6">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Images</h4>
              <label class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:bg-gray-50">
                <ImagePlus class="w-4 h-4" /> Add Images
                <input type="file" class="hidden" accept="image/*" multiple @change="onFilesSelected" />
              </label>
            </div>

            <!-- Existing gallery -->
            <div v-if="gallery.length" class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div v-for="g in gallery" :key="g.id" class="relative group rounded-xl overflow-hidden border">
                <img :src="g.url" class="w-full h-32 object-cover" alt="" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
                <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button class="px-2 py-1 text-xs rounded bg-white" @click="moveImage(g.id, 'up')">Up</button>
                  <button class="px-2 py-1 text-xs rounded bg-white" @click="moveImage(g.id, 'down')">Down</button>
                </div>
                <div class="absolute bottom-2 left-2 flex gap-2">
                  <button class="px-2 py-1 text-xs rounded bg-white/90 hover:bg-white" @click="markExistingPrimary(g.id)">
                    <span class="inline-flex items-center gap-1"><Crown class="w-3 h-3" /> Primary</span>
                  </button>
                  <button class="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" @click="queueDeleteImage(g.id)">Remove</button>
                </div>
                <div v-if="g.is_primary" class="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded">
                  Primary
                </div>
              </div>
            </div>

            <!-- New files (preview names) -->
            <div v-if="newFiles.length" class="mt-4 bg-gray-50 rounded-xl p-3 border">
              <div class="text-sm text-gray-700 mb-2">New uploads</div>
              <ul class="space-y-2">
                <li v-for="(f, idx) in newFiles" :key="idx" class="flex items-center justify-between">
                  <div class="truncate">{{ f.name }}</div>
                  <div class="flex items-center gap-2">
                    <label class="text-xs flex items-center gap-1">
                      <input type="radio" name="primary_new" :value="idx" v-model.number="primaryIndexForNew" />
                      Primary
                    </label>
                    <button class="text-sm text-red-600 hover:underline" @click="removeNewFile(idx)">Remove</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-end gap-3">
            <button class="px-4 py-2 rounded-xl border hover:bg-gray-50" @click="closeModal">Cancel</button>
            <button
                class="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl shadow hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
                :disabled="saving"
                @click="submitProduct">
              <Spinner v-if="saving" :size="18" :stroke="4" class="text-white" />
              <span>{{ saving ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Product") }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- CATEGORY MODAL -->
    <transition name="fade">
      <div v-if="catModalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-rise">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">{{ catEditing ? "Edit Category" : "Create Category" }}</h3>
            <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeCatModal"><X class="w-5 h-5" /></button>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input v-model="catForm.name" type="text" class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-2" />
          </div>
          <div class="mt-6 flex items-center justify-end gap-3">
            <button class="px-4 py-2 rounded-xl border hover:bg-gray-50" @click="closeCatModal">Cancel</button>
            <button
                class="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl shadow hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
                :disabled="catSaving"
                @click="submitCategory">
              <Spinner v-if="catSaving" :size="18" :stroke="4" class="text-white" />
              <span>{{ catSaving ? "Saving..." : (catEditing ? "Save Changes" : "Create") }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rise { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.animate-fade-in { animation: fade-in 0.6s ease forwards; }
.animate-rise { animation: rise 0.25s ease forwards; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
