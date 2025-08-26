<script setup>
import { defineProps } from "vue"
import { ShoppingCart } from "lucide-vue-next"
import { useCartStore } from "~/stores/cart"

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const cart = useCartStore()

// format money with commas
function formatPrice(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// handle add to cart
function handleAddToCart(e) {
  e.preventDefault() // prevent NuxtLink navigation when button is clicked
  cart.addToCart(props.product, 1)
}
</script>

<template>
  <div
      class="relative group bg-white rounded-xl shadow-md hover:shadow-xl transition flex flex-col overflow-hidden cursor-pointer"
  >
    <!-- NuxtLink wrapper -->
    <NuxtLink :to="`/product/${product.id}`" class="flex flex-col flex-grow">
      <!-- Product Image -->
      <div class="relative w-full aspect-square bg-gray-50">
        <NuxtImg
            :src="product.primary_image_url"
            :alt="product.name"
            class="absolute inset-0 w-full h-full object-cover"
            @error="$event.target.src = 'https://via.placeholder.com/400x400?text=No+Image'"
        />
      </div>

      <!-- Info -->
      <div class="p-3 flex flex-col flex-grow">
        <h3
            class="text-sm font-semibold text-gray-900 mb-1 capitalize line-clamp-2"
        >
          {{ product.name }}
        </h3>

        <!-- Dummy review stars -->
        <div class="flex items-center mb-2">
          <span v-for="i in 5" :key="i" class="text-yellow-400 text-sm">★</span>
          <span class="ml-1 text-gray-500 text-xs">(12)</span>
        </div>

        <!-- Price -->
        <p class="text-base font-bold text-gray-900 mt-auto">
          Rs {{ formatPrice(product.price) }}
        </p>
      </div>
    </NuxtLink>

    <!-- Add to Cart (hover reveal) -->
    <button
        @click="handleAddToCart"
        class="absolute bottom-0 left-0 right-0 bg-black text-white py-2 flex items-center justify-center gap-2 transform translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-in-out"
    >
      <ShoppingCart class="w-4 h-4" />
      Add to Cart
    </button>
  </div>
</template>
