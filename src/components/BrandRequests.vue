<script setup>
import { ref, watch } from 'vue'
import { RequestStatus, requestStatusLabels } from '../enums'
const props = defineProps({ admin: Boolean, isLoggedIn: Boolean })
defineEmits(['login'])
const name = ref(''), url = ref(''), reason = ref(''), error = ref(''), success = ref('')
const items = ref([]), loading = ref(false), sending = ref(false), hasNext = ref(false), page = ref(0)
let generation = 0
const reviewing = ref(new Set())
const reviewMessage = ref('')
const statusLabel = status => (requestStatusLabels[status] || requestStatusLabels.PENDING)
async function review(item, status) {
  if (reviewing.value.has(item.id) || loading.value) return
  reviewing.value.add(item.id); error.value = ''; reviewMessage.value = ''
  const current = generation
  try {
    const tokenResponse = await fetch('/api/auth/csrf')
    if (!tokenResponse.ok) throw new Error('인증 정보를 확인하지 못했습니다.')
    const csrf = await tokenResponse.json()
    const response = await fetch(`/api/brand/admin/requests/${item.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }, body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error(response.status === 403 ? '관리자 권한이 필요합니다.' : response.status === 401 ? '다시 로그인해주세요.' : response.status === 404 ? '요청을 찾을 수 없습니다. 목록을 새로고침해주세요.' : '처리 결과를 저장하지 못했습니다. 다시 시도해주세요.')
    const updated = await response.json()
    if (current !== generation) return
    items.value = items.value.map(value => value.id === item.id ? updated : value)
    reviewMessage.value = `${item.brandName} 요청을 ${statusLabel(updated.status)} 처리했습니다.`
  } catch (e) { if (current === generation) error.value = e.message }
  finally { reviewing.value.delete(item.id) }
}
async function load(reset = true) {
  const current = ++generation
  if (reset) { page.value = 0; items.value = []; hasNext.value = false }
  if (!props.isLoggedIn) return
  loading.value = true; error.value = ''
  try {
    const response = await fetch(`${props.admin ? '/api/brand/admin/requests' : '/api/brand/requests'}?page=${page.value}`)
    if (!response.ok) throw new Error(response.status === 403 ? '관리자 권한이 필요합니다.' : response.status === 401 ? '다시 로그인해주세요.' : '요청 목록을 불러오지 못했습니다.')
    const data = await response.json()
    if (current !== generation) return
    items.value = reset ? data.items : [...items.value, ...data.items]; hasNext.value = data.hasNext
  } catch (e) { if (current === generation) { error.value = e.message; if (!reset) page.value-- } }
  finally { if (current === generation) loading.value = false }
}
async function submit() {
  if (sending.value) return
  sending.value = true; error.value = ''; success.value = ''
  try {
    const tokenResponse = await fetch('/api/auth/csrf')
    if (!tokenResponse.ok) throw new Error('인증 정보를 확인하지 못했습니다.')
    const csrf = await tokenResponse.json()
    const response = await fetch('/api/brand/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token }, body: JSON.stringify({ brandName: name.value.trim(), officialUrl: url.value.trim(), reason: reason.value.trim() }) })
    if (!response.ok) throw new Error(response.status === 400 ? '브랜드명과 공식 사이트 주소를 확인해주세요.' : response.status === 401 || response.status === 403 ? '다시 로그인해주세요.' : '요청을 보내지 못했습니다. 잠시 후 다시 시도해주세요.')
    name.value = ''; url.value = ''; reason.value = ''; success.value = '브랜드 요청이 접수되었습니다.'
    await load()
  } catch (e) { error.value = e.message }
  finally { sending.value = false }
}
watch(() => [props.admin, props.isLoggedIn], () => load(), { immediate: true })
</script>

<template>
  <div class="page-intro"><span class="eyebrow">{{ admin ? 'ADMIN / BRAND REQUESTS' : 'HELP SHAPE DROP' }}</span><h1>{{ admin ? 'THE REQUESTS.' : 'YOUR NEXT BRAND.' }}</h1><p>{{ admin ? '사용자가 제안한 브랜드와 요청 내용을 확인하세요.' : 'DROP에서 만나고 싶은 브랜드를 알려주세요.' }}</p></div>
  <div v-if="!isLoggedIn" class="no-results request-login"><h2>Make your request.</h2><p>로그인 후 브랜드를 요청하고 내 요청 내역을 확인하세요.</p><button class="text-link" @click="$emit('login')">LOGIN ↗</button></div>
  <div v-else class="request-layout" :class="{ 'request-admin': admin }">
    <form v-if="!admin" class="request-form" @submit.prevent="submit">
      <label for="request-brand">BRAND NAME <span>필수</span></label><input id="request-brand" v-model="name" required maxlength="100" placeholder="브랜드 이름" :disabled="sending" />
      <label for="request-url">OFFICIAL WEBSITE <span>선택</span></label><input id="request-url" v-model="url" type="url" maxlength="500" placeholder="https://" :disabled="sending" />
      <label for="request-reason">WHY THIS BRAND? <span>선택</span></label><textarea id="request-reason" v-model="reason" maxlength="2000" rows="5" placeholder="이 브랜드를 추천하는 이유를 알려주세요." :disabled="sending"></textarea>
      <p class="request-note">요청은 관리자 검토 후 서비스 운영에 참고됩니다. 브랜드 등록을 보장하지는 않습니다.</p>
      <button class="solid-button" :disabled="sending || !name.trim()">{{ sending ? 'SENDING…' : 'REQUEST BRAND' }} <span>↗</span></button>
      <p v-if="success" role="status" class="request-note">{{ success }}</p>
    </form>
    <section class="request-history" aria-label="브랜드 요청 목록"><div class="section-header"><h2>{{ admin ? 'Brand requests' : 'My requests' }}</h2><button class="text-link" :disabled="loading" @click="load()">REFRESH ↻</button></div>
      <p v-if="error" role="alert" class="request-note">{{ error }}</p>
      <p v-if="admin && reviewMessage" role="status" class="request-note">{{ reviewMessage }}</p>
      <p v-if="loading" role="status" class="request-note">요청을 불러오는 중…</p>
      <div v-else-if="!items.length && !error" class="no-results"><h3>No requests. Yet.</h3><p>{{ admin ? '아직 접수된 브랜드 요청이 없습니다.' : '첫 번째 브랜드를 제안해보세요.' }}</p></div>
      <article v-for="item in items" :key="item.id" class="request-item">
        <div class="request-item-meta"><span>{{ admin ? item.requestedBy : 'MY REQUEST' }}</span><time>{{ new Date(item.createdAt).toLocaleDateString('ko-KR') }}</time></div>
        <div class="request-title"><h3>{{ item.brandName }}</h3><span class="request-status" :class="{ approved: item.status === RequestStatus.APPROVED }">{{ statusLabel(item.status) }}</span></div>
        <a v-if="item.officialUrl" :href="item.officialUrl" target="_blank" rel="noopener noreferrer" class="text-link">OFFICIAL WEBSITE ↗</a><p v-if="item.reason">{{ item.reason }}</p>
        <div v-if="admin" class="request-actions" :aria-busy="reviewing.has(item.id)">
          <button class="follow-button following" :disabled="loading || reviewing.has(item.id) || item.status === RequestStatus.APPROVED" :aria-label="`${item.brandName} 승인`" @click="review(item, RequestStatus.APPROVED)">승인 ✓</button>
          <button class="follow-button" :disabled="loading || reviewing.has(item.id) || item.status === RequestStatus.REJECTED" :aria-label="`${item.brandName} 거절`" @click="review(item, RequestStatus.REJECTED)">거절 ×</button>
          <span v-if="reviewing.has(item.id)" class="request-note">저장 중…</span>
        </div>
      </article>
      <button v-if="hasNext" class="text-link" :disabled="loading" @click="page++; load(false)">LOAD MORE ↓</button>
    </section>
  </div>
</template>

<style scoped>
.request-title{display:flex;align-items:baseline;justify-content:space-between;gap:20px}.request-status{flex-shrink:0;border:1px solid var(--color-border);padding:6px 10px;font-size:10px;color:#777}.request-status.approved{background:#111;border-color:#111;color:#fff}.request-actions{display:flex;align-items:center;gap:10px;margin-top:22px}.request-actions button{min-width:84px;padding:12px 18px}.request-actions button:disabled{opacity:.4}.request-title h3{min-width:0}
.request-layout{display:grid;grid-template-columns:1fr 1fr;gap:80px;padding-bottom:90px}.request-admin{grid-template-columns:1fr;max-width:1000px}.request-form{border-top:1px solid var(--color-border);padding-top:28px}.request-form label{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.08em;margin-bottom:12px}.request-form label span{color:#888;letter-spacing:0}.request-form input,.request-form textarea{display:block;width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #bbb;border-radius:0;background:white;padding:12px 0;font:inherit;margin-bottom:30px;resize:vertical}.request-note{font-size:12px;line-height:1.8;color:#777;margin:16px 0}.request-item{border-top:1px solid var(--color-border);padding:24px 0;overflow-wrap:anywhere}.request-item-meta{display:flex;justify-content:space-between;gap:20px;color:#777;font-size:10px;margin-bottom:15px}.request-item h3{font-size:21px;font-weight:550;margin-bottom:12px}.request-item p{font-size:13px;line-height:1.8;color:#666;white-space:pre-wrap;margin-top:16px}.request-login{margin-bottom:80px}@media(max-width:800px){.request-layout{grid-template-columns:1fr;gap:45px;padding-bottom:60px}}
</style>
