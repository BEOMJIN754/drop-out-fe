<script setup>
defineProps({ isLoggedIn: Boolean })
defineEmits(['navigate', 'info'])
</script>
<template>
  <footer class="site-footer"><div class="footer-top"><div><a href="#home" class="wordmark footer-logo" @click.prevent="$emit('navigate', 'home')">DROP.</a><p>Discover releases<br>from the brands you love.</p></div><div class="footer-links"><div><span class="eyebrow">EXPLORE</span><a href="#discover" @click.prevent="$emit('navigate', 'discover')">Discover ↗</a><a v-if="isLoggedIn" href="#my-drop" @click.prevent="$emit('navigate', 'my-drop')">My Drop ↗</a><a href="#brands" @click.prevent="$emit('navigate', 'brands')">Brands ↗</a></div><div><span class="eyebrow">INFORMATION</span><button @click="$emit('info', 'about')">About ↗</button><button @click="$emit('info', 'contact')">Contact ↗</button></div></div><p class="footer-statement">STAY AHEAD.<br>NEVER MISS A DROP.</p></div><div class="footer-bottom"><span>© 2026 DROP</span><span>AN INDEPENDENT RELEASE CALENDAR.</span><span>ALL TIMES IN KST (UTC+9)</span></div></footer>
</template>
