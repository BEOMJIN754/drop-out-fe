<script setup>
defineProps({ title: String, count: [Number, String], action: { type: String, default: 'VIEW ALL' }, subtitle: String })
defineEmits(['action'])
</script>
<template>
  <div class="section-header"><div><h2>{{ title }}<sup v-if="count !== undefined">{{ String(count).padStart(2, '0') }}</sup></h2><p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p></div><button v-if="action" class="text-link" @click="$emit('action')">{{ action }} <span>↗</span></button></div>
</template>
