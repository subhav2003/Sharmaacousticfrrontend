<!-- components/ToastStack.vue -->
<script setup lang="ts">
import { useToast } from "~/composables/useToast"
import { X } from "lucide-vue-next"

const { toasts, removeToast } = useToast()
</script>

<template>
  <teleport to="body">
    <div class="fixed top-16 right-6 z-50 w-80">
      <transition-group
          name="toast"
          tag="div"
          class="flex flex-col space-y-3 items-end"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-x-20 -translate-y-2"
          enter-to-class="opacity-100 translate-x-0 translate-y-0"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100 translate-x-0 translate-y-0"
          leave-to-class="opacity-0 translate-x-20 -translate-y-2"
      >
        <div
            v-for="t in toasts"
            :key="t.id"
            class="flex items-center justify-between px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm"
            :class="t.type === 'error' ? 'bg-red-600' : (t.type === 'info' ? 'bg-blue-600' : 'bg-green-600')"
        >
          <span class="pr-3">{{ t.message }}</span>

          <button
              @click="removeToast(t.id)"
              class="ml-3 text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 rounded"
              aria-label="Dismiss notification"
              type="button"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>
