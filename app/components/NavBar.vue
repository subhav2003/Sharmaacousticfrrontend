<script setup>
import { User, ShoppingCart, LogOut, Menu, X } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useAuthStore } from "~/stores/auth.js";
import { useApi } from "~/composables/useApi";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const api = useApi();
const cart = useCartStore(); // ✅ added cart store

const loggingOut = ref(false);
const mobileMenuOpen = ref(false);

const profileLink = computed(() => (auth.isLoggedIn ? "/profile" : "/login"));
const authIconActive = computed(() =>
    /^\/(login|register|profile)(\/|$)/i.test(route.path)
);

const isActive = (path) => {
  if (path === "/") return route.path === "/";
  return new RegExp(`^${path}(\\/|$)`).test(route.path);
};

const handleLogout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await api.post("/logout");
  } catch (_) {
    // optional toast
  } finally {
    auth.logout()
    cart.clearLocal()
    loggingOut.value = false;
    router.push("/login");
  }
};
</script>

<template>
  <header class="sticky top-0 z-50 bg-black text-white shadow-md">
    <!-- Top Bar -->
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-3">
        <img
            src="/Logo.jpg"
            alt="Sharma Acoustic Logo"
            class="h-10 w-10 rounded-full object-cover"
        />
      </NuxtLink>

      <!-- Brand (desktop only) -->
      <h1
          class="hidden md:block text-2xl font-bold text-center flex-1 tracking-wide"
      >
        <span class="">Sharma</span>Acoustic
      </h1>

      <!-- Right Section -->
      <div class="flex items-center gap-6">
        <!-- Hamburger (mobile only) -->
        <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden focus:outline-none"
            aria-label="Toggle menu"
        >
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>

        <!-- Profile -->
        <NuxtLink :to="profileLink" class="flex items-center" aria-label="Profile">
          <User
              :class="[
              'w-6 h-6 cursor-pointer transition-colors duration-300',
              authIconActive ? 'text-white underline' : 'hover:text-gray-300'
            ]"
          />
        </NuxtLink>

        <!-- Cart (changed from NuxtLink to button) -->
        <button
            @click="cart.toggleCart"
            class="relative flex items-center"
            aria-label="Cart"
        >
          <ShoppingCart
              class="w-6 h-6 cursor-pointer transition-colors duration-300 hover:text-gray-300"
          />
          <span
              v-if="cart.count"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ cart.count }}
          </span>
        </button>

        <!-- Logout (desktop only) -->
        <button
            v-if="auth.isLoggedIn"
            @click="handleLogout"
            :disabled="loggingOut"
            class="hidden md:flex items-center gap-2 text-red-500 hover:text-red-700"
        >
          <LogOut class="w-5 h-5" />
          <span>{{ loggingOut ? "Logging out…" : "Logout" }}</span>
        </button>
      </div>
    </div>

    <!-- Desktop Nav -->
    <nav
        class="hidden md:flex justify-center space-x-8 py-3 text-sm font-semibold border-t border-gray-800 uppercase"
    >
      <NuxtLink
          to="/"
          :class="[
          'hover:text-gray-300 transition-colors duration-300 font-bold',
          isActive('/') ? 'text-white border-b-2 border-white pb-1' : ''
        ]"
      >
        Home
      </NuxtLink>
      <NuxtLink
          to="/admin/product"
          :class="[
          'hover:text-gray-300 transition-colors duration-300 font-bold',
          isActive('/admin') ? 'text-white border-b-2 border-white pb-1' : ''
        ]"
      >
        About
      </NuxtLink>
      <NuxtLink
          to="/contact"
          :class="[
          'hover:text-gray-300 transition-colors duration-300 font-bold',
          isActive('/contact') ? 'text-white border-b-2 border-white pb-1' : ''
        ]"
      >
        Contact
      </NuxtLink>
      <NuxtLink
          to="/shop"
          :class="[
          'hover:text-gray-300 transition-colors duration-300 font-bold',
          isActive('/shop') ? 'text-white border-b-2 border-white pb-1' : ''
        ]"
      >
        Shop
      </NuxtLink>
    </nav>

    <!-- Mobile Dropdown -->
    <transition name="fade">
      <nav
          v-if="mobileMenuOpen"
          class="md:hidden bg-black border-t border-gray-800 py-4"
      >
        <ul class="flex flex-col space-y-4 px-6 font-bold uppercase">
          <li>
            <NuxtLink
                @click="mobileMenuOpen = false"
                to="/"
                :class="[
                'hover:text-gray-300',
                isActive('/') ? 'text-white border-b-2 border-white inline-block pb-1' : ''
              ]"
            >
              Home
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
                @click="mobileMenuOpen = false"
                to="/admin/product"
                :class="[
                'hover:text-gray-300',
                isActive('/admin') ? 'text-white border-b-2 border-white inline-block pb-1' : ''
              ]"
            >
              About
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
                @click="mobileMenuOpen = false"
                to="/contact"
                :class="[
                'hover:text-gray-300',
                isActive('/contact') ? 'text-white border-b-2 border-white inline-block pb-1' : ''
              ]"
            >
              Contact
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
                @click="mobileMenuOpen = false"
                to="/shop"
                :class="[
                'hover:text-gray-300',
                isActive('/shop') ? 'text-white border-b-2 border-white inline-block pb-1' : ''
              ]"
            >
              Shop
            </NuxtLink>
          </li>

          <!-- Logout (mobile only) -->
          <li class="pt-4 border-t border-gray-700">
            <button
                v-if="auth.isLoggedIn"
                @click="handleLogout"
                :disabled="loggingOut"
                class="flex items-center gap-2 text-red-500 hover:text-red-700 w-full"
            >
              <LogOut class="w-5 h-5" />
              <span>{{ loggingOut ? "Logging out…" : "Logout" }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
