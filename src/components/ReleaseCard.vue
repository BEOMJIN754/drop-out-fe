<script setup>
import { ReleaseStatus, ReleaseType, UserRole } from '../enums'
import { getBrand, formatDate, formatTime } from '../data'
defineProps({ release: Object })
defineEmits(['open'])
</script>
<template>
  <button class="release-card" @click="$emit('open', release)">
    <div class="release-image-wrap"><img :src="release.image" :alt="`${getBrand(release.brand).name} — ${release.title} editorial`" :style="{ objectPosition: release.position || 'center' }" loading="lazy" /><span class="release-type">{{ release.type }}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
    <div class="release-meta"><time :datetime="release.date">{{ formatDate(release.date) }} <span v-if="formatTime(release.date)">· {{ formatTime(release.date) }} KST</span></time><span v-if="release.status === ReleaseStatus.RELEASED">RELEASED</span></div>
    <h3>{{ getBrand(release.brand).name }}</h3><p>{{ release.shortTitle }}</p>
  </button>
</template>
