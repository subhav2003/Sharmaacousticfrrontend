<script setup lang="ts">
import { LogOut, Menu, X, Home, Box, Users, Settings } from "lucide-vue-next"
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "~/stores/auth"
import { useApi } from "~/composables/useApi"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const api = useApi()

const mobileMenuOpen = ref(false)
const loggingOut = ref(false)

// ✅ active link checker
const isActive = (path: string) => {
  if (path === "/") return route.path === "/"
  return new RegExp(`^${path}(\\/|$)`).test(route.path)
}

const handleLogout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await api.post("/logout")
  } catch (_) {
    // optional toast
  } finally {
    auth.logout()
    loggingOut.value = false
    router.push("/login")
  }
}
</script>

<template>
  <div class="flex">
    <!-- Desktop Sidebar -->
    <aside
        class="hidden md:flex flex-col bg-black text-white h-screen sticky top-0 transition-all duration-300 group w-16 hover:w-56"
    >
      <!-- Logo -->
      <div class="flex items-center justify-center py-4 border-b border-gray-800">
        <img
            src="/Logo.jpg"
            alt="Logo"
            class="h-10 w-10 rounded-full object-cover"
        />
      </div>

      <!-- Links -->
      <nav class="flex-1 flex flex-col mt-6 space-y-2">
        <NuxtLink
            to="/admin"
            :class="[
            'flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-gray-800',
            isActive('/admin') ? 'bg-gray-900' : ''
          ]"
        >
          <Home class="w-5 h-5" />
          <span class="opacity-0 group-hover:opacity-100 transition-opacity">Dashboard</span>
        </NuxtLink>

        <NuxtLink
            to="/admin/product"
            :class="[
            'flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-gray-800',
            isActive('/admin/products') ? 'bg-gray-900' : ''
          ]"
        >
          <Box class="w-5 h-5" />
          <span class="opacity-0 group-hover:opacity-100 transition-opacity">Products</span>
        </NuxtLink>

        <NuxtLink
            to="/admin/order"
            :class="[
            'flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-gray-800',
            isActive('/admin/order') ? 'bg-gray-900' : ''
          ]"
        >
          <Users class="w-5 h-5" />
          <span class="opacity-0 group-hover:opacity-100 transition-opacity">Users</span>
        </NuxtLink>

        <NuxtLink
            to="/admin/settings"
            :class="[
            'flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-gray-800',
            isActive('/admin/settings') ? 'bg-gray-900' : ''
          ]"
        >
          <Settings class="w-5 h-5" />
          <span class="opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <button
          @click="handleLogout"
          :disabled="loggingOut"
          class="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-gray-800 transition-colors duration-300"
      >
        <LogOut class="w-5 h-5" />
        <span class="opacity-0 group-hover:opacity-100 transition-opacity">
          {{ loggingOut ? "Logging out…" : "Logout" }}
        </span>
      </button>
    </aside>

    <!-- Mobile Navbar -->
    <div class="md:hidden w-full">
      <!-- Top bar with hamburger -->
      <div class="flex items-center justify-between bg-black text-white px-4 py-3">
        <img src="/Logo.jpg" alt="Logo" class="h-8 w-8 rounded-full" />
        <button @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>

      <transition name="slide-down">
        <nav
            v-if="mobileMenuOpen"
            class="flex flex-col bg-black text-white px-4 py-4 space-y-3"
        >
          <NuxtLink @click="mobileMenuOpen=false" to="/admin" class="hover:text-gray-300">Dashboard</NuxtLink>
          <NuxtLink @click="mobileMenuOpen=false" to="/admin/product" class="hover:text-gray-300">Products</NuxtLink>
          <NuxtLink @click="mobileMenuOpen=false" to="/admin/order" class="hover:text-gray-300">Orders</NuxtLink>
          <NuxtLink @click="mobileMenuOpen=false" to="/admin/settings" class="hover:text-gray-300">Settings</NuxtLink>

          <button
              @click="handleLogout"
              class="text-red-500 hover:text-red-700 pt-3 border-t border-gray-700 flex items-center gap-2"
          >
            <LogOut class="w-5 h-5" />
            <span>{{ loggingOut ? "Logging out…" : "Logout" }}</span>
          </button>
        </nav>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
