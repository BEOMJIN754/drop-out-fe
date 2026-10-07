<script setup>
import ReleaseCard from './ReleaseCard.vue'
defineProps({ releases: Array })
defineEmits(['open'])
</script>
<template><div class="release-grid"><ReleaseCard v-for="release in releases" :key="release.id" :release="release" @open="$emit('open', $event)" /></div></template>
