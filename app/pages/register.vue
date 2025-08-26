<!-- pages/register.vue -->
<script setup>
import { ref } from "vue"
import { Eye, EyeOff } from "lucide-vue-next"
import { useApi } from "~/composables/useApi"
import { useToast } from "~/composables/useToast"
import { useAuthStore } from "~/stores/auth"
import { useCartStore } from "~/stores/cart"

const api = useApi()
const { showToast } = useToast()
const auth = useAuthStore()
const cart = useCartStore()

// form state
const name = ref("")
const email = ref("")
const phone = ref("")
const password = ref("")
const password_confirmation = ref("")

// UI state
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

// handle register
async function handleRegister(e) {
  e.preventDefault()
  if (loading.value) return
  loading.value = true

  try {
    const res = await api.post("/register", {
      name: name.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    })

    const user = res.data?.data
    const token = res.data?.token
    if (!token || !user) throw new Error("No token/user in register response")

    // ✅ set auth state
    auth.login(user, token)

    // ✅ merge guest cart into API cart
    await cart.mergeLocalWithApi()

    showToast(res.data?.message || "Account created. Welcome!", "success")
    navigateTo("/")
  } catch (err) {
    const bag = err?.response?.data?.errors
    if (bag) {
      Object.values(bag).flat().forEach((m) => showToast(String(m), "error"))
    } else {
      showToast(err?.response?.data?.message || "Registration failed", "error")
    }
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div class="overflow-y-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
    <!-- Card -->
    <div class="w-full max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-fade-in">
      <!-- Left Section (Form) -->
      <div class="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
        <h2 class="text-4xl font-extrabold mb-10 text-gray-900 text-center md:text-left">
          Create Account
        </h2>

        <form class="space-y-6" @submit="handleRegister">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
                v-model="name"
                type="text"
                class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400 transition-all duration-300"
                placeholder="Enter your name"
                required
                maxlength="255"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Email Address</label>
            <input
                v-model="email"
                type="email"
                class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400 transition-all duration-300"
                placeholder="Enter your email"
                required
                maxlength="255"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
                v-model="phone"
                type="text"
                class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 text-gray-900 placeholder-gray-400 transition-all duration-300"
                placeholder="Enter your phone number"
                required
                maxlength="20"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <div class="relative">
              <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 pr-12 text-gray-900 placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter your password"
                  required
                  minlength="8"
              />
              <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors duration-300"
                  aria-label="Toggle password visibility"
              >
                <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div class="relative">
              <input
                  v-model="password_confirmation"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-black py-3 pr-12 text-gray-900 placeholder-gray-400 transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                  minlength="8"
              />
              <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors duration-300"
                  aria-label="Toggle confirm password visibility"
              >
                <component :is="showConfirmPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Register Button -->
          <button
              type="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-md font-medium transition-transform duration-300 transform hover:enabled:scale-[1.02] active:enabled:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:bg-gray-800"
          >
            <Spinner v-if="loading" :size="18" :stroke="4" class="text-white" />
            <span>{{ loading ? "Creating account..." : "Sign Up" }}</span>
          </button>
        </form>

        <!-- Login Redirect -->
        <p class="mt-8 text-sm text-gray-600 text-center">
          Already have an account?
          <NuxtLink to="/login" class="text-black font-semibold hover:underline">Login</NuxtLink>
        </p>
      </div>

      <!-- Right Section (Logo + Tagline) -->
      <div class="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-black to-neutral-900 text-white p-12 text-center">
        <img src="/Logo.jpg" alt="Logo" class="max-w-[180px] mb-6 animate-pulse-slow" />
        <h3 class="text-2xl font-bold mb-4">Sharma Acoustic</h3>
        <p class="text-gray-300 max-w-md mb-8">
          Your ears deserve the best. Experience unmatched clarity and authentic sound.
        </p>
        <ul class="space-y-3 text-gray-300 text-sm">
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span>
            Premium Sound Quality
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span>
            Handcrafted Acoustic Design
          </li>
          <li class="flex items-center justify-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full"></span>
            Trusted by Musicians Worldwide
          </li>
        </ul>
      </div>
    </div>

    <!-- ToastStack should be global in your layout; no need to mount here -->
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-slow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.8s ease forwards; }
.animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
</style>
