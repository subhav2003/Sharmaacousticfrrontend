<template>
  <div class="sticky">
    <!-- Navbar shown on all pages -->
    <NavBar />

    <!-- Page content -->
    <NuxtPage />

    <!-- Global Cart Drawer -->
    <CartDrawer />
  </div>
</template>

<script setup>
const cart = useCartStore()

onMounted(() => {
  cart.load() // syncs from API if logged in, else localStorage
})
</script>
