<script setup>
import { ref, computed } from "vue"
import { useCartStore } from "~/stores/cart"
import { NuxtImg, NuxtLink } from "#components"
import { Circle, CircleDot } from "lucide-vue-next"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"

const cart = useCartStore()
const api = useApi()
const { showToast } = useToast()

// form refs
const delivery = ref("delivery")
const fullName = ref("")
const email = ref("")
const phone = ref("")
const country = ref("")
const city = ref("")
const state = ref("")
const zip = ref("")
const payment = ref("cod") // "cod" or "esewa"
const discountCode = ref("")
const createdOrderId = ref(null)
const loading = ref(false)

// map frontend → backend payment keys
const paymentMethodMap = {
  cod: "cash",
  esewa: "esewa",
}

// helpers
function getImage(item) {
  return (
      item.product?.primary_image_url ||
      item.product?.image ||
      item.primary_image_url ||
      item.image ||
      "https://via.placeholder.com/150x150?text=No+Image"
  )
}

// Dynamic button
const payBtnText = computed(() =>
    payment.value === "cod" ? "Place Order" : "Pay Now"
)
const payBtnClass = computed(() =>
    payment.value === "cod"
        ? "bg-black hover:bg-gray-800"
        : "bg-[#1BA548] hover:bg-[#178f3c]"
)

// ---- API logic ----
async function createOrder() {
  try {
    loading.value = true
    const res = await api.post("/orders", {
      payment_method: paymentMethodMap[payment.value], // ✅ map properly
    })
    createdOrderId.value = res.data?.data?.id
    return res.data?.data
  } catch (err) {
    const bag = err?.response?.data?.errors
    if (bag) {
      Object.values(bag).flat().forEach((m) => showToast(String(m), "error"))
    } else {
      showToast(err?.response?.data?.message || "Failed to place order.", "error")
    }
    throw err
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  if (payment.value === "cod") {
    try {
      await createOrder()
      cart.clearLocal()
      showToast("Cash on Delivery order placed successfully.", "success")
    } catch {
      // handled in createOrder
    }
  } else {
    await payWithEsewa()
    cart.clearLocal()
  }
}

async function payWithEsewa() {
  try {
    if (!createdOrderId.value) {
      await createOrder()
    }
    const res = await api.post(`/orders/${createdOrderId.value}/pay-esewa`)
    const payResp = res.data


    // Build & submit eSewa form
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"

    Object.entries(payResp).forEach(([k, v]) => {
      const inp = document.createElement("input")
      inp.type = "hidden"
      inp.name = k
      inp.value = v
      form.appendChild(inp)
    })

    document.body.appendChild(form)
    form.submit()
  } catch (err) {
    console.error("Esewa initiation failed", err)
    const msg = err?.response?.data?.message || "Failed to initiate eSewa payment."
    showToast(msg, "error")
  }
}
</script>

<template>
  <div
      class="overflow-y-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
  >
    <div
        class="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-fade-in"
    >
      <!-- LEFT: Shipping Info -->
      <div class="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
        <h2 class="text-3xl font-extrabold mb-10 text-gray-900">Shipping Information</h2>

        <!-- Delivery / Pickup -->
        <div class="flex gap-6 mb-8">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="delivery" value="delivery" class="hidden" />
            <component :is="delivery === 'delivery' ? CircleDot : Circle" class="w-5 h-5 text-black" />
            <span>Delivery</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="delivery" value="pickup" class="hidden" />
            <component :is="delivery === 'pickup' ? CircleDot : Circle" class="w-5 h-5 text-black" />
            <span>Pick up</span>
          </label>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          <input v-model="fullName" placeholder="Full name"
                 class="w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400" />
          <input v-model="email" type="email" placeholder="Email address"
                 class="w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400" />
          <input v-model="phone" type="tel" placeholder="Phone number"
                 class="w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400" />

          <select v-model="country"
                  class="w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900">
            <option value="">Choose country</option>
            <option>United States</option>
            <option>Nepal</option>
            <option>India</option>
          </select>

          <div class="grid grid-cols-3 gap-4">
            <input v-model="city" placeholder="City"
                   class="border-b border-gray-300 focus:outline-none focus:border-black py-3 placeholder-gray-400" />
            <input v-model="state" placeholder="State"
                   class="border-b border-gray-300 focus:outline-none focus:border-black py-3 placeholder-gray-400" />
            <input v-model="zip" placeholder="ZIP Code"
                   class="border-b border-gray-300 focus:outline-none focus:border-black py-3 placeholder-gray-400" />
          </div>
        </div>

        <!-- Payment -->
        <h3 class="mt-10 mb-3 font-semibold text-gray-900">Payment Method</h3>
        <div class="space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="payment" value="cod" class="hidden" />
            <component :is="payment === 'cod' ? CircleDot : Circle" class="w-5 h-5 text-black" />
            <span>Cash on Delivery</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="payment" value="esewa" class="hidden" />
            <component :is="payment === 'esewa' ? CircleDot : Circle" class="w-5 h-5 text-black" />
            <span>Esewa</span>
          </label>
        </div>
      </div>

      <!-- RIGHT: Cart Review -->
      <div class="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center bg-gray-100">
        <h2 class="text-2xl font-extrabold mb-10 text-gray-900">Review your cart</h2>

        <!-- Empty Cart -->
        <div v-if="!cart.items.length" class="flex flex-col items-center justify-center flex-1 text-center py-12">
          <p class="text-gray-500 mb-4">Your cart is empty.</p>
          <NuxtLink to="/shop"
                    class="px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition">
            Go to Shop
          </NuxtLink>
        </div>

        <!-- Cart Items -->
        <div v-else>
          <div v-for="item in cart.items" :key="item.id"
               class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <NuxtImg :src="getImage(item)" class="w-16 h-16 rounded object-cover border" />
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ item.product?.name || item.name }}</p>
              <p class="text-sm text-gray-500">Qty: {{ item.quantity }}</p>
            </div>
            <span class="font-semibold text-gray-900">
              Rs. {{ (item.product?.price || item.price) * item.quantity }}
            </span>
          </div>

          <!-- Discount -->
          <div class="flex mb-6">
            <input v-model="discountCode" placeholder="Discount code"
                   class="flex-1 border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400" />
            <button @click="() => showToast('Discount applied (dummy)','success')"
                    class="ml-2 px-6 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition">
              Apply
            </button>
          </div>

          <!-- Totals -->
          <div class="space-y-2 text-gray-800">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {{ cart.total || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span>Shipping</span>
              <span>Rs. 200</span>
            </div>
            <div class="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>Rs. {{ (cart.total || 0) + 200 }}</span>
            </div>
          </div>

          <!-- Pay Button -->
          <button
              @click="handlePay"
              :disabled="loading"
              :class="`mt-8 w-full flex items-center justify-center gap-2 text-white py-3 rounded-md font-medium transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${payBtnClass}`"
          >
            {{ loading ? "Processing..." : payBtnText }}
          </button>

          <p class="mt-4 text-xs text-gray-500 text-center">
            Secure Checkout – SSL Encrypted
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.8s ease forwards; }
</style>
