<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, X } from "lucide-vue-next"

definePageMeta({
  layout: "admin",
  middleware: "admin",// ✅ tells Nuxt to use layouts/admin.vue
})

const api = useApi()
const { showToast } = useToast()

// UI state
const loading = ref(false)
const deleting = ref(false)
const modalOpen = ref(false)

// Filters
const filters = reactive({
  q: "",
  status: "",
  sort: "created_at",
  order: "desc",
  per_page: 10,
  page: 1,
})

// Data
const orders = ref({
  data: [],
  meta: { total: 0, current_page: 1, last_page: 1 },
})

// Order modal
const currentOrder = ref(null)

async function fetchOrders() {
  try {
    loading.value = true
    const { data } = await api.get("/orders", { params: { ...filters } }) // ✅ correct admin endpoint
    orders.value = {
      data: data?.data ?? [],
      meta: data?.meta ?? { total: 0, current_page: 1, last_page: 1 },
    }
  } catch (e) {
    showToast(e?.response?.data?.message || "Failed to load orders", "error")
  } finally {
    loading.value = false
  }
}

function openView(order) {
  currentOrder.value = order
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  currentOrder.value = null
}

async function updateStatus(orderId, status) {
  try {
    const { data } = await api.put(`/orders/${orderId}`, { status })
    showToast(data?.message || "Order updated", "success")
    await fetchOrders()
    if (currentOrder.value?.id === orderId) currentOrder.value.status = status
  } catch (e) {
    showToast(e?.response?.data?.message || "Failed to update status", "error")
  }
}

async function deleteOrder(id) {
  if (deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/orders/${id}`)
    showToast(data?.message || "Order deleted", "success")
    await fetchOrders()
    if (currentOrder.value?.id === id) closeModal()
  } catch (e) {
    showToast(e?.response?.data?.message || "Delete failed", "error")
  } finally {
    deleting.value = false
  }
}

// Pagination helpers
const canPrev = computed(() => (orders.value.meta.current_page ?? 1) > 1)
const canNext = computed(() => (orders.value.meta.current_page ?? 1) < (orders.value.meta.last_page ?? 1))
function prevPage() {
  if (canPrev.value) filters.page = (orders.value.meta.current_page ?? 2) - 1
}
function nextPage() {
  if (canNext.value) filters.page = (orders.value.meta.current_page ?? 0) + 1
}

watch(() => ({ ...filters }), fetchOrders, { deep: true })
onMounted(fetchOrders)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-10">
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Order Management
        </h1>
        <p class="text-gray-600 mt-2">View and manage all recent orders.</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl shadow p-4 md:p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1 flex items-center gap-3">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                  v-model="filters.q"
                  type="text"
                  placeholder="Search orders..."
                  class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/60"
              />
            </div>
            <select v-model="filters.status" class="px-3 py-2 rounded-xl border border-gray-200">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select v-model="filters.sort" class="px-3 py-2 rounded-xl border border-gray-200">
              <option value="created_at">Newest</option>
              <option value="total_price">Price</option>
              <option value="status">Status</option>
            </select>
            <select v-model="filters.order" class="px-3 py-2 rounded-xl border border-gray-200">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white rounded-2xl shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">Order ID</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">User</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">Total</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">Payment</th>
              <th class="px-4 py-3"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-6 text-gray-500">Loading orders...</td>
            </tr>
            <tr
                v-for="o in orders.data"
                :key="o.id"
                class="hover:bg-gray-50/70 transition"
            >
              <td class="px-4 py-3">#{{ o.id }}</td>
              <td class="px-4 py-3">{{ o.user?.name ?? "—" }}</td>
              <td class="px-4 py-3">Rs. {{ Number(o.total_price).toFixed(2) }}</td>
              <td class="px-4 py-3">
                  <span
                      class="px-2 py-1 rounded text-xs font-semibold"
                      :class="{
                      'bg-yellow-100 text-yellow-800': o.status==='pending',
                      'bg-blue-100 text-blue-800': o.status==='processing',
                      'bg-indigo-100 text-indigo-800': o.status==='shipped',
                      'bg-green-100 text-green-800': o.status==='delivered',
                      'bg-red-100 text-red-800': o.status==='cancelled',
                    }"
                  >
                    {{ o.status }}
                  </span>
              </td>
              <td class="px-4 py-3 capitalize">{{ o.payment_status }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button class="p-2 rounded-lg border hover:bg-gray-50" @click="openView(o)">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                      class="p-2 rounded-lg border hover:bg-red-50 text-red-600"
                      @click="deleteOrder(o.id)"
                      :disabled="deleting"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && orders.data.length === 0">
              <td colspan="6" class="px-4 py-6 text-gray-500">No orders found.</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div class="text-sm text-gray-600">
            Page {{ orders.meta.current_page || 1 }} of {{ orders.meta.last_page || 1 }}
          </div>
          <div class="flex items-center gap-2">
            <button
                class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                :disabled="!canPrev"
                @click="prevPage"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
                class="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                :disabled="!canNext"
                @click="nextPage"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <select
                v-model.number="filters.per_page"
                class="ml-2 px-3 py-2 rounded-lg border text-sm"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- ORDER MODAL -->
    <transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 animate-rise">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">Order #{{ currentOrder?.id }}</h3>
            <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeModal">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="currentOrder">
            <p class="text-gray-700 mb-2"><strong>User:</strong> {{ currentOrder.user?.name }}</p>
            <p class="text-gray-700 mb-2"><strong>Total:</strong> Rs. {{ currentOrder.total_price }}</p>
            <p class="text-gray-700 mb-2"><strong>Status:</strong> {{ currentOrder.status }}</p>
            <p class="text-gray-700 mb-4"><strong>Payment:</strong> {{ currentOrder.payment_status }}</p>

            <h4 class="font-semibold mb-2">Items</h4>
            <ul class="divide-y divide-gray-200 mb-4">
              <li v-for="item in currentOrder.order_items" :key="item.id" class="py-2 flex justify-between">
                <span>{{ item.product?.name }}</span>
                <span>x{{ item.quantity }}</span>
              </li>
            </ul>

            <!-- Status buttons -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                  v-for="s in ['pending','processing','shipped','delivered','cancelled']"
                  :key="s"
                  class="px-3 py-1 rounded text-sm font-medium border"
                  :class="currentOrder.status===s ? 'bg-black text-white' : 'bg-white text-gray-700'"
                  @click="updateStatus(currentOrder.id, s)"
              >
                {{ s }}
              </button>
            </div>
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
