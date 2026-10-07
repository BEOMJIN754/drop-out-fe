<script setup>
import { computed } from 'vue'
import { getBrand, formatDate, formatTime } from '../data'
const props = defineProps({ release: Object })
const brand = computed(() => getBrand(props.release.brand))
defineEmits(['open'])
</script>
<template>
  <section class="hero" aria-label="Featured release">
    <img class="hero-image" :src="release.image" :alt="release.title" fetchpriority="high" />
    <div class="hero-shade"></div>
    <div class="hero-top"><span class="eyebrow"><span class="live-dot"></span> FEATURED RELEASE</span></div>
    <div class="hero-content"><span class="hero-brand">{{ brand?.name?.toUpperCase() }}</span><h1>{{ release.title }}</h1><p>{{ formatDate(release.date) }} <span v-if="formatTime(release.date)">· {{ formatTime(release.date) }} KST</span></p><button class="text-link inverse" @click="$emit('open', release)">VIEW RELEASE <span>↗</span></button></div>
    <div class="hero-bottom"><span>NEW SEASON. SAME ATTITUDE.</span><span>{{ brand?.origin }}<template v-if="brand?.since">{{ brand?.origin ? ', ' : '' }}EST. {{ brand.since }}</template></span></div>
  </section>
</template>
