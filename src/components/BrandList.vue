<script setup>
import { brands } from '../data'
import { reactive } from 'vue'
const failedLogos = reactive(new Set())
defineProps({ followedBrands: Array, expanded: Boolean })
defineEmits(['follow', 'brand'])
</script>
<template>
  <div :class="['brand-list', { expanded }]">
    <div v-for="(brand, index) in brands" :key="brand.id" class="brand-item">
      <template v-if="expanded"><div class="brand-index">{{ String(index + 1).padStart(2, '0') }} <span>{{ brand.origin }}</span></div></template>
      <button class="brand-logo-button" :aria-label="`View ${brand.name} releases`" @click="$emit('brand', brand.id)"><img v-if="brand.logoUrl && !failedLogos.has(brand.logoUrl)" class="official-brand-logo" :src="brand.logoUrl" :alt="brand.name" @error="failedLogos.add(brand.logoUrl)" /><span v-else :class="['brand-logo', brand.className]">{{ brand.name }}</span></button>
      <div v-if="expanded" class="brand-description"><span>{{ brand.categoryLabel }}<br><small v-if="brand.since">EST. {{ brand.since }}</small></span><button :class="['follow-button', { following: followedBrands.includes(brand.id) }]" :aria-pressed="followedBrands.includes(brand.id)" @click="$emit('follow', brand.id)">{{ followedBrands.includes(brand.id) ? 'FOLLOWING ✓' : 'FOLLOW +' }}</button></div>
    </div>
  </div>
</template>
<style scoped>
.official-brand-logo { width: 180px; max-width: 80%; max-height: 60px; object-fit: contain; }
</style>
