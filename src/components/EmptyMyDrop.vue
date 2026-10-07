<script setup>
defineEmits(['select'])
</script>
<template><div class="empty-my-drop"><span class="eyebrow">A LITTLE MORE YOU.</span><h3>YOUR DROP<br>STARTS HERE.</h3><p>Follow the brands you love.</p><p class="korean-copy">새로운 Drop, Collaboration, Collection을 한곳에서 확인하세요.</p><button class="text-link" @click="$emit('select')">SELECT BRANDS <span>↗</span></button><span class="empty-decoration" aria-hidden="true">↗</span></div></template>
