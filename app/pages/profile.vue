<script setup>
import { useAuthStore } from "~/stores/auth"
import { ref, onMounted } from "vue"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"

const auth = useAuthStore()
const api = useApi()
const { showToast } = useToast()

// state
const orders = ref([])
const loading = ref(false)
const meta = ref({})

// fetch orders
async function fetchOrders(page = 1) {
  try {
    loading.value = true
    const { data } = await api.get("/orders", { params: { page } })
    orders.value = data?.data ?? []
    meta.value = data?.meta ?? {}
  } catch (err) {
    console.error(err)
    showToast(err?.response?.data?.message || "Failed to load orders", "error")
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div
      class="overflow-y-hidden min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-100 to-gray-200 relative"
  >
    <!-- Card -->
    <div
        class="w-full max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in my-8"
    >
      <!-- Top Section (Profile Info) -->
      <div
          class="w-full flex flex-col md:flex-row items-center justify-between bg-gradient-to-b from-black to-neutral-900 text-white p-8 md:p-12 gap-6"
      >
        <!-- User Avatar -->
        <div class="flex flex-col items-center text-center md:text-left">
          <div
              class="w-28 h-28 rounded-full bg-gradient-to-tr from-gray-700 to-black flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4"
          >
            {{ auth.user?.name?.charAt(0) || "U" }}
          </div>
          <h2 class="text-2xl font-bold">{{ auth.user?.name }}</h2>
          <p class="text-gray-300">{{ auth.user?.email }}</p>
          <p class="text-gray-400 mt-1 text-sm">
            Joined:
            {{
              auth.user?.created_at
                  ? new Date(auth.user.created_at).toLocaleDateString()
                  : "N/A"
            }}
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-6 text-center w-full md:w-auto">
          <div
              class="bg-white/10 rounded-xl p-4 shadow hover:shadow-lg transition"
          >
            <p class="text-xl font-bold">{{ meta.total || 0 }}</p>
            <p class="text-gray-300 text-sm">Orders</p>
          </div>
          <div
              class="bg-white/10 rounded-xl p-4 shadow hover:shadow-lg transition"
          >
            <p class="text-xl font-bold">
              {{ orders.filter((o) => o.status === "pending").length }}
            </p>
            <p class="text-gray-300 text-sm">Pending</p>
          </div>
          <div
              class="bg-white/10 rounded-xl p-4 shadow hover:shadow-lg transition"
          >
            <p class="text-xl font-bold">
              {{ orders.filter((o) => o.status === "delivered").length }}
            </p>
            <p class="text-gray-300 text-sm">Delivered</p>
          </div>
        </div>
      </div>

      <!-- Bottom Section (Order History) -->
      <div class="p-8 md:p-12">
        <h3 class="text-2xl font-bold mb-6 text-gray-900">Order History</h3>

        <div v-if="loading" class="text-gray-500">Loading orders...</div>

        <div v-else-if="!orders.length" class="text-gray-500">
          You haven’t placed any orders yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
            <tr class="bg-gray-100 text-gray-700 text-left text-sm uppercase">
              <th class="px-4 py-3">Order ID</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Total</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="o in orders"
                :key="o.id"
                class="border-b hover:bg-gray-50 transition"
            >
              <td class="px-4 py-3 font-medium text-gray-800">#{{ o.id }}</td>
              <td class="px-4 py-3 text-gray-600">
                {{ new Date(o.created_at).toLocaleDateString() }}
              </td>
              <td class="px-4 py-3">
                  <span
                      :class="[
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      o.status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : o.status === 'shipped'
                        ? 'bg-blue-100 text-blue-700'
                        : o.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700',
                    ]"
                  >
                    {{ o.status }}
                  </span>
              </td>
              <td class="px-4 py-3 text-gray-800">
                Rs {{ Number(o.total_price).toFixed(2) }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.8s ease forwards;
}
</style>
