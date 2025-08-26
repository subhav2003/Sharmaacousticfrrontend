<script setup lang="ts">
import { ref, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useCartStore } from "~/stores/cart"
import { useApiSSR } from "~/composables/useApiSSR"

const route = useRoute()
const router = useRouter()
const id = route.params.id

// Cart store
const cart = useCartStore()

// ✅ Use SSR composable
const api = useApiSSR()
const { data, pending, error } = await useAsyncData(`product-${id}`, () =>
    api(`/products/${id}`).then((res: any) => res.data)
)

const product = computed(() => data.value || {})
const currentIndex = ref(0)

// image navigation
function prevImage() {
  currentIndex.value =
      currentIndex.value > 0
          ? currentIndex.value - 1
          : product.value.images.length - 1
}

function nextImage() {
  currentIndex.value =
      currentIndex.value < product.value.images.length - 1
          ? currentIndex.value + 1
          : 0
}

// back button
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push("/shop")
  }
}

// Add to cart handler
function handleAddToCart() {
  if (!product.value || !product.value.id) return
  cart.addToCart(product.value, 1)
}

// ✅ SEO optimization (same as before)
useHead(() => {
  if (!product.value) return {}

  const title = product.value.name
      ? `${product.value.name} | SharmaAcoustic`
      : "CraftConnect Product"
  const description =
      product.value.description?.slice(0, 160) ||
      "Browse unique handcrafted products on CraftConnect."
  const image =
      product.value.primary_image_url ||
      product.value.images?.[0]?.url ||
      "https://via.placeholder.com/600x600"

  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    link: [{ rel: "canonical", href: `https://yourdomain.com/shop/${id}` }],
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          name: product.value.name,
          description: product.value.description,
          image: image,
          sku: product.value.id,
          offers: {
            "@type": "Offer",
            priceCurrency: "NPR",
            price: product.value.price,
            availability:
                product.value.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
          },
        }),
      },
    ],
  }
})
</script>



<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-12 animate-fade-in">
    <!-- Back Button -->
    <div class="w-full mb-6">
      <button
          @click="goBack"
          class="inline-flex items-center gap-2 text-gray-600 hover:text-black transition text-sm"
      >
        ← Back
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="pending" class="flex justify-center items-center h-64 text-gray-500">
      <Spinner />
    </div>
    <div v-else-if="error" class="text-red-500">Failed to load product.</div>

    <!-- Product Layout -->
    <div v-else class="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
      <!-- Left: Image Gallery -->
      <div class="w-full md:w-1/2 md:sticky md:top-24 self-start">
        <!-- Main Image -->
        <div
            class="relative w-full aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg"
        >
          <NuxtImg
              :src="product.images?.[currentIndex]?.url || product.primary_image_url || 'https://via.placeholder.com/600x600?text=No+Image'"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-300"
          />

          <!-- Arrows -->
          <button
              v-if="product.images && product.images.length > 1"
              @click.stop="prevImage"
              class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
          >
            ‹
          </button>
          <button
              v-if="product.images && product.images.length > 1"
              @click.stop="nextImage"
              class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
          >
            ›
          </button>
        </div>

        <!-- Thumbnails -->
        <div
            v-if="product.images && product.images.length > 1"
            class="flex gap-3 mt-4 overflow-x-auto"
        >
          <NuxtImg
              v-for="(img, i) in product.images"
              :key="img.id"
              :src="img.url"
              class="w-20 h-20 rounded-lg object-cover cursor-pointer border-2 transition shadow-sm"
              :class="
              i === currentIndex
                ? 'border-black'
                : 'border-transparent opacity-70 hover:opacity-100'
            "
              @click="currentIndex = i"
          />
        </div>
      </div>

      <!-- Right: Product Info -->
      <div class="w-full md:w-1/2 flex flex-col justify-start">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 mb-4">
          {{ product.name }}
        </h1>

        <p class="text-gray-700 leading-relaxed mb-6">
          {{ product.description }}
        </p>

        <div class="text-3xl font-semibold text-black mb-4">
          Rs. {{ Number(product.price).toLocaleString() }}
        </div>

        <p class="text-sm text-gray-600 mb-2">
          Stock: <span class="font-medium">{{ product.stock }}</span>
        </p>
        <p class="text-sm text-gray-600 mb-8">
          Category: <span class="font-medium">{{ product.category?.name }}</span>
        </p>

        <!-- Add to Cart -->
        <button
            @click="handleAddToCart"
            class="w-full md:w-1/2 bg-black text-white py-3 rounded-md font-medium tracking-wide shadow hover:bg-gray-900 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Add to Cart
        </button>
      </div>
    </div>

    <!-- Elegant Review Section -->
    <div
        class="max-w-5xl mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
    >
      <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">
        Customer Reviews
      </h2>

      <!-- Review Summary -->
      <div
          class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6"
      >
        <div class="text-center">
          <p class="text-5xl font-extrabold text-black">4.7</p>
          <p class="text-gray-500">out of 5</p>
        </div>
        <div class="flex-1">
          <div
              v-for="i in 5"
              :key="i"
              class="flex items-center gap-2 text-gray-600"
          >
            <span>{{ 6 - i }} ★</span>
            <div class="flex-1 h-2 bg-gray-200 rounded">
              <div
                  class="h-2 bg-yellow-400 rounded"
                  :style="{ width: `${(6 - i) * 15}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Cards -->
      <div class="grid gap-6">
        <div
            v-for="review in [
            { name: 'John Doe', rating: 5, text: 'Really impressed with the quality, will buy again.' },
            { name: 'Jane Smith', rating: 4, text: 'Works as expected. Could improve packaging.' },
            { name: 'Arjun KC', rating: 5, text: 'Luxurious feel and excellent craftsmanship.' }
          ]"
            :key="review.name"
            class="border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold text-gray-900">{{ review.name }}</p>
            <p class="text-yellow-500">
              {{ "★".repeat(review.rating) }}
              <span class="text-gray-300">{{ "★".repeat(5 - review.rating) }}</span>
            </p>
          </div>
          <p class="text-gray-700 leading-relaxed">{{ review.text }}</p>
        </div>
      </div>

      <div class="mt-10 text-center text-gray-400 italic">
        (Dynamic reviews will be implemented here later)
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
