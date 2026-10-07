<script setup>
import { ref } from 'vue'
defineProps({ page: String, isLoggedIn: Boolean, isAdmin: Boolean, userName: String })
const emit = defineEmits(['navigate', 'search', 'login', 'logout'])
const menuOpen = ref(false)
const profileOpen = ref(false)
function navigate(page) { emit('navigate', page); menuOpen.value = false; profileOpen.value = false }
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <a class="wordmark" href="#home" aria-label="DROP home" @click.prevent="navigate('home')">DROP<span class="logo-dot">.</span></a>
      <nav class="desktop-nav" aria-label="Main navigation">
        <a href="#discover" :class="{ active: page === 'discover' }" @click.prevent="navigate('discover')">DISCOVER</a>
        <a v-if="isLoggedIn" href="#my-drop" :class="{ active: page === 'my-drop' }" @click.prevent="navigate('my-drop')">MY DROP</a>
        <a href="#brands" :class="{ active: page === 'brands' }" @click.prevent="navigate('brands')">BRANDS</a>
        <a v-if="!isAdmin" href="#brand-request" :class="{ active: page === 'brand-request' }" @click.prevent="navigate('brand-request')">REQUEST</a>
        <a v-if="isAdmin" href="#admin-requests" :class="{ active: page === 'admin-requests' }" @click.prevent="navigate('admin-requests')">REQUESTS</a>
      </nav>
      <div class="header-actions">
        <button class="search-trigger" @click="emit('search')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><span>SEARCH</span></button>
        <div v-if="isLoggedIn" class="profile-wrap">
          <button class="desktop-login" :aria-expanded="profileOpen" @click="profileOpen = !profileOpen">PROFILE <span class="tiny-chevron">⌄</span></button>
          <div v-if="profileOpen" class="profile-menu"><span class="eyebrow">HELLO, {{ userName }}</span><button @click="navigate('my-drop')">My Drop ↗</button><button @click="emit('logout'); profileOpen = false">Log out ↗</button></div>
        </div>
        <button v-else class="desktop-login" @click="emit('login')">LOGIN <span>↗</span></button>
        <button class="mobile-menu" :aria-expanded="menuOpen" aria-label="Toggle navigation" @click="menuOpen = !menuOpen"><span></span><span></span></button>
      </div>
    </div>
    <nav v-if="menuOpen" class="mobile-navigation" aria-label="Mobile navigation">
      <a v-if="!isAdmin" href="#brand-request" @click.prevent="navigate('brand-request')">Request a brand <span>↗</span></a>
      <a v-if="isAdmin" href="#admin-requests" @click.prevent="navigate('admin-requests')">Requests <span>↗</span></a>
      <a href="#discover" @click.prevent="navigate('discover')">Discover <span>↗</span></a>
      <a v-if="isLoggedIn" href="#my-drop" @click.prevent="navigate('my-drop')">My Drop <span>↗</span></a>
      <a href="#brands" @click.prevent="navigate('brands')">Brands <span>↗</span></a>
      <button @click="isLoggedIn ? emit('logout') : emit('login'); menuOpen = false">{{ isLoggedIn ? 'Log out' : 'Login' }} <span>↗</span></button>
    </nav>
  </header>
</template>
