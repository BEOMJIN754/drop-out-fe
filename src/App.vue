<script setup>
import { ReleaseStatus, ReleaseType, UserRole } from './enums'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { brands, releases, getBrand, formatDate, formatTime, loadBrandReleases, loadBrandMetadata } from './data'
import Header from './components/Header.vue'
import HeroRelease from './components/HeroRelease.vue'
import SectionHeader from './components/SectionHeader.vue'
import ReleaseGrid from './components/ReleaseGrid.vue'
import MyDropSection from './components/MyDropSection.vue'
import BrandList from './components/BrandList.vue'
import Footer from './components/Footer.vue'
import ModalShell from './components/ModalShell.vue'
import BrandRequests from './components/BrandRequests.vue'

const isLoggedIn = ref(false)
const userName = ref('')
const isAdmin = ref(false)
const followedBrands = ref([])
let followGeneration = 0
const followBusy = new Set()
let followsReady = false
const validPages = ['home', 'discover', 'brands', 'my-drop', 'brand-request', 'admin-requests']
const page = ref('home')
const modal = ref(null)
const selectedRelease = ref(null)
const loginName = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginBusy = ref(false)
let loginController
const pendingFollow = ref(null)
const query = ref('')
const statusFilter = ref(ReleaseStatus.UPCOMING)
const typeFilter = ref('ALL')
const brandFilter = ref('ALL')
const toast = ref('')
let toastTimer
const upcoming = computed(() => releases.filter(r => r.status === ReleaseStatus.UPCOMING))
const recent = computed(() => releases.filter(r => r.status === ReleaseStatus.RELEASED))
const undated = computed(() => releases.filter(r => r.status === ReleaseStatus.UNKNOWN))
const featured = computed(() => [...releases].sort((a, b) => {
  const timestamp = date => {
    const value = date ? Date.parse(date.includes('T') ? date : `${date}T00:00:00+09:00`) : NaN
    return Number.isFinite(value) ? value : -Infinity
  }
  const aDate = timestamp(a.date)
  const bDate = timestamp(b.date)
  return aDate === bDate ? b.id - a.id : (aDate > bDate ? -1 : 1)
})[0])
const feedMessage = ref('브랜드 및 발매 정보를 불러오는 중…')
const filteredReleases = computed(() => releases.filter(r => (statusFilter.value === 'all' || r.status === statusFilter.value) && (typeFilter.value === 'ALL' || r.type === typeFilter.value) && (brandFilter.value === 'ALL' || r.brand === brandFilter.value)))
const searchResults = computed(() => {
  const search = query.value.trim().toLocaleLowerCase()
  return search ? releases.filter(r => `${getBrand(r.brand).name} ${r.title} ${r.type}`.toLocaleLowerCase().includes(search)) : []
})
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.value = '' }, 3500) }
function navigate(next) {
  if (next === 'admin-requests' && !isAdmin.value) return
  if (next === 'my-drop' && !isLoggedIn.value) { modal.value = 'login'; return }
  page.value = validPages.includes(next) ? next : 'home'
  window.location.hash = page.value === 'home' ? 'home' : page.value
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function syncHash() { const next = window.location.hash.slice(1) || 'home'; page.value = validPages.includes(next) && (next !== 'my-drop' || isLoggedIn.value) && (next !== 'admin-requests' || isAdmin.value) ? next : 'home' }
onMounted(async () => {
  try { const response = await fetch('/api/auth/me'); if (response.ok) { const user = await response.json(); userName.value = user.username; isAdmin.value = user.role === UserRole.ADMIN; isLoggedIn.value = true } } catch { /* Login remains available. */ }
  syncHash(); window.addEventListener('hashchange', syncHash)
  if (isLoggedIn.value) await loadFollows()
  try {
    await loadBrandMetadata()
    const results = await Promise.allSettled(brands.map(brand => loadBrandReleases(brand.id)))
    feedMessage.value = results.map((result, i) => brands[i].name + ': ' + (result.status === 'fulfilled' ? '공식 수집 데이터' : '연결 실패')).join(' / ') || '등록된 브랜드가 없습니다.'
  } catch { feedMessage.value = '브랜드 정보를 불러오지 못했습니다. 새로고침해주세요.' }
})
onBeforeUnmount(() => { window.removeEventListener('hashchange', syncHash); clearTimeout(toastTimer) })
function discover(status = ReleaseStatus.UPCOMING, brand = 'ALL') { statusFilter.value = status; brandFilter.value = brand; typeFilter.value = 'ALL'; navigate('discover') }
function openRelease(release) { selectedRelease.value = release; modal.value = 'release' }
async function loadFollows() {
  const generation = ++followGeneration
  followedBrands.value = []; followsReady = false
  try {
    const response = await fetch('/api/me/follows')
    if (!response.ok) throw new Error()
    const ids = await response.json()
    if (!Array.isArray(ids) || ids.some(id => !Number.isSafeInteger(id))) throw new Error()
    if (generation === followGeneration) { followedBrands.value = ids; followsReady = true }
  } catch { if (generation === followGeneration) notify('팔로우 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.') }
}
async function follow(id) {
  if (!isLoggedIn.value) { pendingFollow.value = id; modal.value = 'login'; return }
  if (followBusy.has(id)) return
  followBusy.add(id)
  try {
    if (!followsReady) await loadFollows()
    if (!followsReady || !isLoggedIn.value) return
    const generation = followGeneration
    const removing = followedBrands.value.includes(id)
    const tokenResponse = await fetch('/api/auth/csrf')
    if (!tokenResponse.ok) throw new Error('인증 정보를 확인하지 못했습니다.')
    const csrf = await tokenResponse.json()
    const response = await fetch(`/api/me/follows/${encodeURIComponent(id)}`, { method: removing ? 'DELETE' : 'PUT', headers: { [csrf.headerName]: csrf.token } })
    if (!response.ok) throw new Error(response.status === 404 ? '아직 등록되지 않은 브랜드입니다. REQUEST에서 등록을 요청해주세요.' : response.status === 401 || response.status === 403 ? '다시 로그인해주세요.' : '팔로우를 저장하지 못했습니다.')
    if (generation !== followGeneration) return
    followedBrands.value = removing ? followedBrands.value.filter(value => value !== id) : [...followedBrands.value.filter(value => value !== id), id]
    notify(`${removing ? 'Unfollowed' : 'Now following'} ${getBrand(id).name}`)
  } catch (error) { notify(error.message) }
  finally { followBusy.delete(id) }
}
async function login() {
  if (loginBusy.value) return
  loginError.value = ''; loginBusy.value = true
  const controller = new AbortController()
  loginController = controller
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ username: loginName.value.trim(), password: loginPassword.value })
    })
    if (!response.ok) {
      loginError.value = response.status === 401 ? '아이디 또는 비밀번호가 올바르지 않습니다.' : response.status === 400 ? '아이디와 비밀번호를 확인해주세요.' : '로그인 서버에 연결할 수 없습니다.'
      return
    }
    const user = await response.json()
    if (!user.id || typeof user.username !== 'string') throw new Error('Invalid login response')
    if (controller.signal.aborted || modal.value !== 'login') return
    userName.value = user.username; isAdmin.value = user.role === UserRole.ADMIN; isLoggedIn.value = true; modal.value = null
    await loadFollows()
    if (pendingFollow.value) { follow(pendingFollow.value); pendingFollow.value = null }
    else { if (page.value !== 'brand-request') navigate('home'); notify(`Welcome to DROP, ${userName.value}.`) }
  } catch {
    if (modal.value === 'login') loginError.value = '로그인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    clearTimeout(timeout); loginPassword.value = ''; loginBusy.value = false; loginController = null
  }
}
function closeModal() { loginController?.abort(); loginPassword.value = ''; loginError.value = ''; modal.value = null; pendingFollow.value = null }
async function logout() {
  try {
    const tokenResponse = await fetch('/api/auth/csrf'); if (!tokenResponse.ok) throw new Error()
    const csrf = await tokenResponse.json()
    const response = await fetch('/api/auth/logout', { method: 'POST', headers: { [csrf.headerName]: csrf.token } })
    if (!response.ok) throw new Error()
    followGeneration++; followedBrands.value = []; followsReady = false
    isLoggedIn.value = false; isAdmin.value = false; userName.value = ''; navigate('home'); notify('You have been logged out.')
  } catch { notify('로그아웃하지 못했습니다. 다시 시도해주세요.') }
}
function calendar(release) {
  if (!release.date) return
  const start = new Date(release.date)
  const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const escape = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DROP//Release Calendar//EN', 'BEGIN:VEVENT', `UID:${release.id}@drop.demo`, `DTSTAMP:${stamp(new Date())}`, ...(release.date.includes('T') ? [`DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 3600000))}`] : [`DTSTART;VALUE=DATE:${release.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${new Date(start.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '')}`]), `SUMMARY:${escape(`${getBrand(release.brand).name} — ${release.title}`)}`, `DESCRIPTION:${escape(release.live ? release.sourceUrl : 'Illustrative demo schedule')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${release.id}.ics`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Calendar file downloaded.')
}
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <Header :page="page" :is-logged-in="isLoggedIn" :is-admin="isAdmin" :user-name="userName" @navigate="navigate" @search="modal = 'search'; query = ''" @login="modal = 'login'" @logout="logout" />
  <main id="main" class="main-container">
    <BrandRequests v-if="page === 'brand-request' || page === 'admin-requests'" :key="page" :admin="page === 'admin-requests'" :is-logged-in="isLoggedIn" @login="modal = 'login'" />
    <template v-if="page === 'home'">
      <MyDropSection v-if="isLoggedIn" :followed-brands="followedBrands" @brands="navigate('brands')" @open="openRelease" />
      <div class="home-intro"><div><span class="eyebrow">THE CULTURE. THE COLLECTIONS. THE CALENDAR.</span><p>Stay ahead of the release<span>.</span></p></div><div class="intro-note">The drops that matter.<br>All in one place.<span class="intro-arrow">↙</span></div></div>
      <HeroRelease v-if="featured" :release="featured" @open="openRelease" />
      <div class="hero-caption"><span>CURATED RELEASES. NO NOISE.</span><span>DROP, COLLABORATION, AND EVERYTHING IN BETWEEN.</span><span>SCROLL TO DISCOVER ↓</span></div>
      <section class="section"><SectionHeader title="UPCOMING RELEASES" :count="upcoming.length" @action="discover(ReleaseStatus.UPCOMING)" /><ReleaseGrid :releases="upcoming" @open="openRelease" /></section>
      <section class="section recent-section"><SectionHeader title="RECENT RELEASES" :count="recent.length" @action="discover(ReleaseStatus.RELEASED)" /><ReleaseGrid :releases="recent" @open="openRelease" /></section>
      <section v-if="undated.length" class="section"><SectionHeader title="COLLECTIONS / DATE UNCONFIRMED" :count="undated.length" @action="discover('all')" /><ReleaseGrid :releases="undated" @open="openRelease" /></section>
      <section class="section discover-brands-section"><SectionHeader title="DISCOVER BRANDS" action="ALL BRANDS" @action="navigate('brands')" /><p class="brand-section-copy">Find your people. Follow your brands.</p><BrandList :followed-brands="followedBrands" @brand="discover('all', $event)" /></section>
      <div class="closing-note"><span class="eyebrow">LESS SEARCHING. MORE DISCOVERING.</span><p>Your next favorite<br>is about to drop.</p><button class="text-link" @click="isLoggedIn ? navigate('my-drop') : modal = 'login'">{{ isLoggedIn ? 'GO TO MY DROP' : 'MAKE IT YOURS' }} <span>↗</span></button></div>
    </template>
    <template v-else-if="page === 'discover'">
      <div class="page-intro"><span class="eyebrow">THE RELEASE INDEX / 2026</span><h1>DISCOVER<span>.</span></h1><p>A considered edit of what’s next — and what just landed.</p></div>
      <div class="filter-bar"><div class="status-tabs"><button v-for="option in [[ReleaseStatus.UPCOMING, 'UPCOMING'], [ReleaseStatus.RELEASED, 'RECENT'], ['all', 'ALL RELEASES']]" :key="option[0]" :class="{ active: statusFilter === option[0] }" :aria-pressed="statusFilter === option[0]" @click="statusFilter = option[0]">{{ option[1] }}</button></div><div class="select-filters"><label><span class="sr-only">Brand</span><select v-model="brandFilter" aria-label="Brand"><option value="ALL">ALL BRANDS</option><option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name.toUpperCase() }}</option></select></label><label><span class="sr-only">Release type</span><select v-model="typeFilter" aria-label="Release type"><option value="ALL">ALL TYPES</option><option v-for="type in Object.values(ReleaseType)" :key="type">{{ type }}</option></select></label></div></div>
      <div class="results-meta"><span>{{ String(filteredReleases.length).padStart(2, '0') }} RELEASES</span><span>ALL TIMES IN KST</span></div>
      <section class="discovery-results" aria-label="Filtered releases"><ReleaseGrid v-if="filteredReleases.length" :releases="filteredReleases" @open="openRelease" /><div v-else class="no-results"><h2>Nothing here. Yet.</h2><p>No releases match these filters. Try another brand or release type.</p><button class="text-link" @click="statusFilter = 'all'; typeFilter = 'ALL'; brandFilter = 'ALL'">RESET FILTERS ↗</button></div></section>
    </template>
    <template v-else-if="page === 'brands'"><div class="page-intro"><span class="eyebrow">IN GOOD COMPANY</span><h1>THE BRANDS<span>.</span></h1><p>Independent spirits. Cultural mainstays. Find the ones you follow.</p></div><div class="results-meta brand-results-meta"><span>{{ brands.length }} BRANDS, ONE PLACE</span><span>{{ isLoggedIn ? `${followedBrands.length} FOLLOWING` : 'LOGIN TO BUILD YOUR DROP' }}</span></div><BrandList expanded :followed-brands="followedBrands" @follow="follow" @brand="discover('all', $event)" /><div class="brands-endnote"><span>GOOD TASTE IS PERSONAL.</span><p>Follow a brand to see its next release in My Drop.</p></div></template>
    <template v-else-if="page === 'my-drop'"><MyDropSection :followed-brands="followedBrands" @brands="navigate('brands')" @open="openRelease" /></template>
  </main>
  <Footer :is-logged-in="isLoggedIn" @navigate="navigate" @info="modal = $event" />
  <div class="demo-strip">{{ feedMessage }}</div>
  <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><span>✓</span> {{ toast }}</div></Transition>
  <ModalShell v-if="modal" :key="modal" :title="modal === 'release' ? selectedRelease.title : modal === 'search' ? 'Search releases' : modal === 'login' ? 'Login' : modal === 'about' ? 'About DROP' : 'Contact DROP'" :wide="modal === 'release' || modal === 'search'" @close="closeModal">
    <div v-if="modal === 'login'" class="login-content"><span class="wordmark">DROP.</span><span class="eyebrow">YOUR BRANDS. YOUR CALENDAR.</span><h2>Make it<br>personal.</h2><p>Follow the brands you love.<br>Keep their next release within reach.</p><form @submit.prevent="login"><label for="login-username">USERNAME</label><input id="login-username" v-model="loginName" autofocus placeholder="아이디" maxlength="50" autocomplete="username" required /><label for="login-password">PASSWORD</label><input id="login-password" v-model="loginPassword" type="password" placeholder="비밀번호" autocomplete="current-password" required /><p v-if="loginError" role="alert">{{ loginError }}</p><button class="solid-button" type="submit" :disabled="loginBusy">{{ loginBusy ? '로그인 중…' : 'ENTER MY DROP' }} <span>↗</span></button></form><p class="demo-note">등록된 아이디와 비밀번호로 로그인하세요.<br>로그인 후 브랜드 요청과 My Drop을 이용할 수 있습니다.</p></div>
    <div v-else-if="modal === 'search'" class="search-content"><span class="eyebrow">FIND YOUR NEXT DROP</span><label class="sr-only" for="release-search">Search by brand, collection, or type</label><input id="release-search" v-model="query" class="search-input" autofocus placeholder="Search brands, releases…" autocomplete="off" /><div v-if="!query.trim()" class="search-suggestions"><span class="eyebrow">EXPLORE THE BRANDS</span><button v-for="brand in brands" :key="brand.id" @click="query = brand.name">{{ brand.name }} <span>↗</span></button></div><template v-else><p class="results-meta" aria-live="polite">{{ searchResults.length }} RESULTS</p><div class="search-results"><button v-for="release in searchResults" :key="release.id" @click="openRelease(release)"><img :src="release.image" alt="" /><span><strong>{{ getBrand(release.brand).name }}</strong><span>{{ release.title }}</span><small>{{ formatDate(release.date) }} · {{ release.type }}</small></span><span class="search-result-arrow">↗</span></button></div><div v-if="!searchResults.length" class="no-results"><h3>No releases found.</h3><p>Try “Nike”, “capsule”, or another brand.</p></div></template></div>
    <div v-else-if="modal === 'release'" class="release-detail"><img class="detail-image" :src="selectedRelease.image" :alt="`${getBrand(selectedRelease.brand).name} release editorial`" /><div class="detail-copy"><span class="eyebrow">{{ selectedRelease.type }} / {{ selectedRelease.status === ReleaseStatus.UPCOMING ? 'UPCOMING RELEASE' : selectedRelease.status === ReleaseStatus.RELEASED ? 'RECENT RELEASE' : 'DATE TBA' }}</span><div class="detail-brand">{{ getBrand(selectedRelease.brand).name }}</div><h2>{{ selectedRelease.title }}</h2><p class="detail-description">{{ selectedRelease.description }}</p><dl><div><dt>RELEASE DATE</dt><dd>{{ formatDate(selectedRelease.date) }}</dd></div><div v-if="formatTime(selectedRelease.date)"><dt>TIME</dt><dd>{{ formatTime(selectedRelease.date) }} KST (UTC+9)</dd></div></dl><button v-if="selectedRelease.date" class="solid-button" @click="calendar(selectedRelease)">ADD TO CALENDAR <span>↗</span></button><button class="detail-follow text-link" @click="follow(selectedRelease.brand)">{{ isLoggedIn && followedBrands.includes(selectedRelease.brand) ? 'FOLLOWING' : 'FOLLOW' }} {{ getBrand(selectedRelease.brand).name.toUpperCase() }} <span>{{ isLoggedIn && followedBrands.includes(selectedRelease.brand) ? '✓' : '+' }}</span></button><p v-if="selectedRelease.live" class="demo-note"><a :href="selectedRelease.sourceUrl" target="_blank" rel="noopener noreferrer">{{ getBrand(selectedRelease.brand).name }} 공식 공지 ↗</a> · {{ selectedRelease.dateLabel }}</p><p v-else class="demo-note">Illustrative release. Dates and collection details are mock data; photography is editorial and may not depict the named brand.</p></div></div>
    <div v-else class="info-content"><span class="eyebrow">{{ modal === 'about' ? 'THE IDEA BEHIND DROP' : 'LET’S CONNECT' }}</span><h2>{{ modal === 'about' ? 'Culture moves.\nKeep up.' : 'Good things\nstart somewhere.' }}</h2><template v-if="modal === 'about'"><p>DROP is an independent release calendar for fashion culture. We bring brand drops, collaborations, capsules, seasonal collections, and limited releases together in one considered place.</p><p>Follow the brands you love and make the calendar your own.</p><p class="demo-note">DROP combines official release announcements with illustrative demo releases. DROP is not affiliated with the featured brands.</p></template><template v-else><p>This concept does not have a live contact inbox yet. For now, explore the brands and try building your own release calendar.</p><button class="text-link" @click="closeModal(); navigate('brands')">EXPLORE BRANDS ↗</button></template></div>
  </ModalShell>
</template>
