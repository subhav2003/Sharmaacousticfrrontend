<script setup>
import { useCartStore } from "~/stores/cart"
import { useAuthStore } from "~/stores/auth"
import { NuxtImg } from "#components"
import { Trash2 } from "lucide-vue-next"
import { useRouter } from "vue-router"
import { useToast } from "~/composables/useToast" // ✅ your toast composable

const cart = useCartStore()
const auth = useAuthStore()
const router = useRouter()
const { showToast } = useToast()

function closeDrawer() {
  cart.isOpen = false
}

function getImage(item) {
  return (
      item.product?.primary_image_url ||
      item.product?.image ||
      item.primary_image_url ||
      item.image ||
      "https://via.placeholder.com/150x150?text=No+Image"
  )
}

// ✅ Checkout logic
function handleCheckout() {
  if (!cart.items.length) return
  if (auth.isLoggedIn) {
    router.push("/checkout")
  } else {
    showToast("Login to checkout", "warning") // 🔔 toast
    router.push("/login")
  }
}
</script>

<template>
  <transition name="slide-right">
    <aside
        v-if="cart.isOpen"
        class="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-[999] flex flex-col"
    >
      <!-- Header -->
      <header
          class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-white"
      >
        <h2 class="text-lg font-bold text-gray-900">Your Cart</h2>
        <button
            @click="closeDrawer"
            class="text-gray-500 hover:text-black transition"
        >
          ✕
        </button>
      </header>

      <!-- Items list -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
            v-for="item in cart.items"
            :key="item.id"
            class="flex items-center gap-3 border-b border-gray-100 pb-3"
        >
          <!-- Thumbnail -->
          <NuxtImg
              :src="getImage(item)"
              :alt="item.product?.name || item.name || 'Product'"
              width="64"
              height="64"
              class="w-16 h-16 rounded object-cover border"
              @error="$event.target.src = 'https://via.placeholder.com/150x150?text=No+Image'"
          />

          <!-- Details -->
          <div class="flex-1">
            <h3 class="font-semibold text-sm text-gray-900">
              {{ item.product?.name || item.name }}
            </h3>
            <p class="text-xs text-gray-500">
              Rs. {{ item.product?.price || item.price }}
            </p>

            <!-- Quantity Controls -->
            <div class="flex items-center gap-2 mt-1">
              <button
                  @click="cart.updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="px-2 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                -
              </button>
              <span class="px-2 text-gray-700">
                {{ item.quantity }}
              </span>
              <button
                  @click="cart.updateQuantity(item.id, item.quantity + 1)"
                  class="px-2 py-1 border rounded text-sm hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <!-- Remove -->
          <button
              @click="cart.removeFromCart(item.id)"
              class="text-red-500 hover:text-red-700 transition"
              aria-label="Remove from cart"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>

        <!-- Empty cart message -->
        <p v-if="!cart.items.length" class="text-center text-gray-500 mt-6">
          Your cart is empty.
        </p>
      </div>

      <!-- Footer -->
      <footer
          class="sticky bottom-0 z-10 p-4 border-t border-gray-200 bg-gray-50"
      >
        <div class="flex justify-between mb-3 text-gray-900">
          <span class="font-medium">Estimated total</span>
          <span class="font-bold">Rs. {{ cart.total }}</span>
        </div>

        <button
            @click="handleCheckout"
            :disabled="!cart.items.length"
            class="block w-full py-3 rounded-md font-medium text-center transition
                text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-black hover:bg-gray-800 active:scale-[0.98]"
        >
          Check out
        </button>
      </footer>
    </aside>
  </transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
