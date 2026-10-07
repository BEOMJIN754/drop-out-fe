<script setup>
import { getBrand, formatDate, formatTime } from '../data'
defineProps({ releases: Array })
defineEmits(['open'])
</script>
<template><div class="my-drop-list"><button v-for="release in releases" :key="release.id" @click="$emit('open', release)"><time :datetime="release.date">{{ formatDate(release.date) }}</time><strong>{{ getBrand(release.brand).name }}</strong><span class="list-release-title">{{ release.shortTitle }}</span><span v-if="formatTime(release.date)" class="list-time">{{ formatTime(release.date) }} KST</span><span>↗</span></button></div></template>
