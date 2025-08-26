<script setup>
import { ref } from "vue"
import { useApi } from "~/composables/useApi"
import Spinner from "@/components/Spinner.vue"
import { ArrowLeft, ArrowRight } from "lucide-vue-next"
import ProductCard from "@/components/ProductCard.vue"

const api = useApi()

// --- SSR Data Fetch ---
const { data: topExpensiveData, pending: loadingTop } = await useAsyncData(
    "topExpensive",
    () =>
        api
            .get("/products", {
              params: { sort: "price", order: "desc", per_page: 5 },
            })
            .then((res) => res.data)
)

const { data: latestReleasesData, pending: loadingLatest } = await useAsyncData(
    "latestReleases",
    () =>
        api
            .get("/products", {
              params: { sort: "created_at", order: "desc", per_page: 5 },
            })
            .then((res) => res.data)
)

// --- State ---
const topExpensive = ref(topExpensiveData.value?.data || [])
const latestReleases = ref(latestReleasesData.value?.data || [])
const currentTopIndex = ref(0)

// --- Hero Controls ---
function prevTop() {
  if (topExpensive.value.length) {
    currentTopIndex.value =
        (currentTopIndex.value - 1 + topExpensive.value.length) %
        topExpensive.value.length
  }
}
function nextTop() {
  if (topExpensive.value.length) {
    currentTopIndex.value =
        (currentTopIndex.value + 1) % topExpensive.value.length
  }
}
useHead({
  title: "Home | SharmaAcoustic",
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">

    <!-- Top Expensive Picks -->
    <section class="relative w-full h-[70vh] flex flex-col justify-center items-center text-center">
      <div v-if="loadingTop" class="text-gray-400"><Spinner/></div>

      <div v-else-if="topExpensive.length" class="relative w-full h-full overflow-hidden">
        <div
            v-for="(item, index) in topExpensive"
            :key="item.id"
            class="absolute inset-0 transition-opacity duration-700 ease-in-out"
            :class="index === currentTopIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'"
        >
          <!-- Background Image -->
          <NuxtImg
              :src="item.primary_image_url"
              :alt="item.name"
              class="absolute inset-0 w-full h-full object-cover"
          />

          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>

          <!-- Content -->
          <div class="relative z-20 flex flex-col items-center justify-center h-full text-white px-6">
            <h2 class="text-4xl md:text-6xl font-extrabold mb-4">{{ item.name }}</h2>
            <p class="text-xl md:text-2xl text-gray-200 mb-6">
              Rs {{ Number(item.price).toLocaleString() }} NPR
            </p>
            <NuxtLink
                :to="`/product/${item.id}`"
                class="bg-white text-black px-6 py-3 rounded-md font-medium hover:scale-105 transition"
            >
              View Details
            </NuxtLink>
          </div>
        </div>

        <!-- Controls -->
        <button
            @click="prevTop"
            class="absolute top-1/2 left-6 -translate-y-1/2 bg-white/30 hover:bg-white/60 p-3 rounded-full z-30"
        >
          <ArrowLeft class="w-6 h-6 text-black"/>
        </button>
        <button
            @click="nextTop"
            class="absolute top-1/2 right-6 -translate-y-1/2 bg-white/30 hover:bg-white/60 p-3 rounded-full z-30"
        >
          <ArrowRight class="w-6 h-6 text-black"/>
        </button>
      </div>
    </section>

    <!-- Latest Releases -->
    <section class="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
      <!-- Heading with "View More" -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Latest Releases</h2>
        <NuxtLink
            to="/shop"
            class="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-black transition"
        >
          View More →
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="loadingLatest" class="text-gray-500"><Spinner /></div>

      <!-- Product Cards -->
      <div v-else class="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        <ProductCard
            v-for="p in latestReleases"
            :key="p.id"
            :product="p"
            class="min-w-[220px] flex-shrink-0"
        />
      </div>
    </section>

    <!-- Inspiring Story -->
    <section class="bg-white py-16 px-6">
      <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <NuxtImg src="/Logo.jpg" alt="Logo" class="w-64 mx-auto md:mx-0 rounded-full shadow-lg"/>
        <div>
          <h2 class="text-3xl font-bold mb-4">Our Story</h2>
          <p class="text-gray-600 leading-relaxed">
            SharmaAcoustic began with a simple idea: music should not only be heard but felt.
            Inspired by timeless traditions and modern craftsmanship, we bring together the warmth of heritage
            with the clarity of innovation. Each product is more than audio gear — it is a journey, a story,
            and an emotion woven into sound. With every note, we invite you to rediscover music, the way it was
            meant to be experienced.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-8 px-6 mt-auto">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p>© 2025 Sharma Acoustic · All rights reserved</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
