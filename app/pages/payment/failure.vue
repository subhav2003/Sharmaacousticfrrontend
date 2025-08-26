<script setup>
import { Frown } from "lucide-vue-next" // ✅ Lucide icon for sad robot/face
</script>

<template>
  <div
      class="overflow-y-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative"
  >
    <!-- Card -->
    <div
        class="w-full max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in"
    >
      <!-- Left Section (Failed Info) -->
      <div class="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center items-center text-center">
        <h2 class="text-4xl font-extrabold mb-6 text-red-600">
          Payment Failed
        </h2>

        <!-- Sad Robot / Icon -->
        <div class="flex flex-col items-center mb-8">
          <Frown class="w-20 h-20 text-red-500 mb-4" />
          <p class="text-gray-600 text-lg">
            Oops! Something went wrong while processing your payment.
          </p>
          <p class="text-gray-500 text-sm mt-2">
            Don’t worry — your order is saved. You can try again from your order history.
          </p>
        </div>

        <!-- Button -->
        <NuxtLink
            to="/profile"
            class="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md font-medium transition-all duration-300 hover:bg-gray-800 hover:scale-[1.02]"
        >
          Go to Order History
        </NuxtLink>
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
          Your ears deserve the best. Experience unmatched clarity and authentic sound.
        </p>
        <ul class="space-y-3 text-gray-300 text-sm">
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Premium Sound Quality
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Handcrafted Acoustic Design
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span> Trusted by Musicians Worldwide
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
  0%, 100% {
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
