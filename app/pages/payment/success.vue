<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"
import Spinner from "@/components/Spinner.vue"

const route = useRoute()
const api = useApi()
const { showToast } = useToast()

// state
const order = ref(null)
const apiError = ref("")
const isLoading = ref(true)
const transactionId = ref("")
const amount = ref("")

onMounted(async () => {
  try {
    const encodedResponse = route.query.data
    if (!encodedResponse) {
      apiError.value = "Response data is missing."
      isLoading.value = false
      return
    }

    // decode response
    const decodedResponse = atob(encodedResponse)
    const parsedResponse = JSON.parse(decodedResponse)
    const transactionIdFromResponse = parsedResponse.transaction_uuid

    if (!transactionIdFromResponse) {
      apiError.value = "Transaction ID is missing."
      isLoading.value = false
      return
    }

    // verify payment with backend
    const res = await api.post("/orders/verify-esewa", {
      transaction_id: transactionIdFromResponse,
    })

    transactionId.value = res.data?.transaction_id
    amount.value = res.data?.amount_paid

    // fetch corresponding order
    if (res.data?.order_id) {
      const orderRes = await api.get(`/orders/${res.data.order_id}`)
      order.value = orderRes.data?.data
    }

    showToast("Payment verified successfully!", "success")
  } catch (err) {
    console.error("Payment verify error:", err)
    apiError.value =
        err?.response?.data?.message ||
        "Unable to verify payment. Please try again."
    showToast(apiError.value, "error")
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div
      class="overflow-y-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative"
  >
    <!-- Card -->
    <div
        class="w-full max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in"
    >
      <!-- Left Section (Payment Info) -->
      <div class="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
        <h2
            class="text-4xl font-extrabold mb-10 text-gray-900 text-center md:text-left"
        >
          {{ apiError ? "Payment Failed" : "Payment Successful!" }}
        </h2>

        <!-- Loader -->
        <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-12"
        >
          <Spinner :size="36" :stroke="4" class="text-black mb-4" />
          <span class="text-gray-700 font-semibold text-lg"
          >Verifying Payment...</span
          >
        </div>

        <!-- Success / Failure -->
        <div v-else>
          <p class="text-gray-600 mb-6">
            {{
              apiError ||
              "Thank you for your purchase. Your payment was processed successfully."
            }}
          </p>

          <!-- Payment Info -->
          <div
              v-if="!apiError"
              class="bg-gray-50 p-6 rounded-lg shadow mb-6 text-gray-800"
          >
            <p><strong>Transaction ID:</strong> {{ transactionId }}</p>
            <p><strong>Amount Paid:</strong> Rs. {{ amount }}</p>
          </div>

          <!-- Order Details -->
          <div
              v-if="order && !apiError"
              class="bg-gray-50 p-6 rounded-lg shadow mb-6 text-gray-800"
          >
            <h3 class="font-semibold mb-3">Order #{{ order.id }}</h3>
            <p><strong>Status:</strong> {{ order.status }}</p>
            <ul class="divide-y divide-gray-200 mt-3">
              <li
                  v-for="item in order.order_items"
                  :key="item.id"
                  class="py-2 flex justify-between"
              >
                <span>{{ item.product?.name }}</span>
                <span>x{{ item.quantity }}</span>
              </li>
            </ul>
          </div>

          <!-- Back Button -->
          <NuxtLink
              to="/shop"
              class="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md font-medium transition-all duration-300 hover:bg-gray-800 hover:scale-[1.02]"
          >
            Return to Shop
          </NuxtLink>
        </div>
      </div>

      <!-- Right Section (Logo + Tagline) -->
      <div
          class="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-black to-neutral-900 text-white p-12 text-center"
      >
        <img
            src="/Logo.jpg"
            alt="Logo"
            class="max-w-[180px] mb-6 animate-pulse-slow"
        />
        <h3 class="text-2xl font-bold mb-4">Sharma Acoustic</h3>
        <p class="text-gray-300 max-w-md mb-8">
          Your ears deserve the best. Experience unmatched clarity and authentic
          sound.
        </p>
        <ul class="space-y-3 text-gray-300 text-sm">
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Premium Sound
            Quality
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Handcrafted
            Acoustic Design
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Trusted by
            Musicians Worldwide
          </li>
        </ul>
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
@keyframes pulse-slow {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.8s ease forwards;
}
.animate-pulse-slow {
  animation: pulse-slow 4s infinite ease-in-out;
}
</style>
