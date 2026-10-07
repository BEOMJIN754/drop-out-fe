<script setup>
import { ReleaseStatus, ReleaseType, UserRole } from '../enums'
import { computed, ref } from 'vue'
import { brands, releases } from '../data'
import SectionHeader from './SectionHeader.vue'
import ReleaseGrid from './ReleaseGrid.vue'
import MyDropList from './MyDropList.vue'
import EmptyMyDrop from './EmptyMyDrop.vue'
const props = defineProps({ followedBrands: Array })
defineEmits(['brands', 'open'])
const layout = ref('grid')
const following = computed(() => brands.filter(brand => props.followedBrands.includes(brand.id)))
const upcoming = computed(() => releases
  .filter(release => (release.status === ReleaseStatus.UPCOMING || release.status === ReleaseStatus.UNKNOWN) && props.followedBrands.includes(release.brand))
  .sort((a, b) => {
    const timestamp = date => {
      if (!date) return Infinity
      const value = Date.parse(date.includes('T') ? date : `${date}T00:00:00+09:00`)
      return Number.isNaN(value) ? Infinity : value
    }
    const first = timestamp(a.date), second = timestamp(b.date)
    return first === second ? 0 : first < second ? -1 : 1
  }))
</script>
<template>
  <section class="section my-drop-section"><SectionHeader title="MY DROP" subtitle="YOUR RELEASES / UPCOMING & DATE UNCONFIRMED" action="MANAGE BRANDS" @action="$emit('brands')" />
    <EmptyMyDrop v-if="!following.length" @select="$emit('brands')" />
    <template v-else><div class="my-drop-toolbar"><div class="following-brands"><span class="following-count">Following {{ following.length }} {{ following.length === 1 ? 'brand' : 'brands' }}</span><button v-for="brand in following" :key="brand.id" @click="$emit('brands')">{{ brand.name }}</button><button aria-label="Follow more brands" @click="$emit('brands')">+</button></div><div class="view-switch" aria-label="Display layout"><button :class="{ selected: layout === 'grid' }" :aria-pressed="layout === 'grid'" @click="layout = 'grid'">GRID</button><button :class="{ selected: layout === 'list' }" :aria-pressed="layout === 'list'" @click="layout = 'list'">LIST</button></div></div><template v-if="upcoming.length"><ReleaseGrid v-if="layout === 'grid'" :releases="upcoming" @open="$emit('open', $event)" /><MyDropList v-else :releases="upcoming" @open="$emit('open', $event)" /></template><div v-else class="no-results"><h3>All caught up.</h3><p>Your followed brands have no upcoming releases in this demo. Explore more brands to build your calendar.</p><button class="text-link" @click="$emit('brands')">EXPLORE BRANDS ↗</button></div></template>
  </section>
</template>
