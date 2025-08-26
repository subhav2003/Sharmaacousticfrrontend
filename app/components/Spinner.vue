<!-- components/Spinner.vue -->
<script setup lang="ts">
defineProps<{
  size?: number         // px
  stroke?: number       // px
  ariaLabel?: string
}>()
</script>

<template>
  <svg
      :width="size ?? 20"
      :height="size ?? 20"
      viewBox="0 0 50 50"
      role="status"
      :aria-label="ariaLabel ?? 'Loading'"
      class="inline-block"
  >
    <!-- Track (optional subtle background circle) -->
    <circle
        cx="25" cy="25" r="20"
        fill="none"
        stroke="currentColor"
        opacity="0.15"
        :stroke-width="stroke ?? 4"
    />
    <!-- Animated arc -->
    <circle
        cx="25" cy="25" r="20"
        fill="none"
        stroke="currentColor"
        :stroke-width="stroke ?? 4"
        stroke-linecap="round"
        class="spinner-arc"
    />
  </svg>
</template>

<style scoped>
@keyframes spinner-rotate {
  100% { transform: rotate(360deg); }
}
@keyframes spinner-dash {
  0%   { stroke-dasharray: 1, 126; stroke-dashoffset: 0; }
  50%  { stroke-dasharray: 90, 126; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 1, 126; stroke-dashoffset: -125; }
}
svg { transform-origin: center; animation: spinner-rotate 1.4s linear infinite; }
.spinner-arc { stroke-dasharray: 1, 126; animation: spinner-dash 1.4s ease-in-out infinite; }
</style>
