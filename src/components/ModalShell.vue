<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
defineProps({ title: String, wide: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus
let previousOverflow
function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
  if (event.key !== 'Tab') return
  const elements = [...dialog.value.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length)
  const first = elements[0], last = elements.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(async () => { previousFocus = document.activeElement; previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKeydown); await nextTick(); (dialog.value.querySelector('[autofocus]') || dialog.value.querySelector('button'))?.focus() })
onBeforeUnmount(() => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeydown); previousFocus?.focus() })
</script>
<template><Teleport to="body"><div class="modal-backdrop" @click.self="$emit('close')"><section ref="dialog" :class="['modal', { 'modal-wide': wide }]" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1"><button class="modal-close" aria-label="Close dialog" @click="$emit('close')">✕</button><slot /></section></div></Teleport></template>
