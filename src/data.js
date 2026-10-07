import { reactive } from 'vue'
import { ReleaseStatus, brandCategoryLabels } from './enums'
export const brands = reactive([])
export const releases = reactive([])
const brandClasses = { Supreme: 'supreme', Palace: 'palace', SPAO: 'spao', 'SAN SAN GEAR': 'sansan-gear' }
export async function loadBrandMetadata() {
  const response = await fetch('/api/brands', { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Brand API unavailable')
  const rows = await response.json()
  if (!Array.isArray(rows) || rows.some(row => !Number.isSafeInteger(row.id))) throw new Error('Invalid brand response')
  brands.splice(0, brands.length, ...rows.map(row => ({ ...row, since: row.foundedYear, categoryLabel: brandCategoryLabels[row.category] || brandCategoryLabels.OTHER, className: brandClasses[row.name] || '' })))
}
export async function loadBrandReleases(brandId) {
  const response = await fetch(`/api/releases?brand=${encodeURIComponent(brandId)}`, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Release API unavailable')
  const rows = await response.json()
  if (!Array.isArray(rows) || rows.some(r => !Number.isSafeInteger(r.id) || r.brand?.id !== brandId)) throw new Error('Brand collection pending')
  const actual = rows.map(r => ({ id: r.id, brand: r.brand.id, title: r.title, shortTitle: r.title,
    type: r.releaseType, date: r.releaseAt || r.releaseDate, status: Object.values(ReleaseStatus).includes(r.status) ? r.status : ReleaseStatus.UNKNOWN,
    image: r.imageUrl, description: r.description, dateLabel: r.dateLabel, sourceUrl: r.sourceUrl, crawledAt: r.crawledAt, live: true }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  releases.splice(0, releases.length, ...actual, ...releases.filter(r => r.brand !== brandId))
}
export const getBrand = id => brands.find(brand => brand.id === id)
export const formatDate = date => date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(date)).toUpperCase() : 'DATE TBA'
export const formatTime = date => date?.includes('T') ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(date)) : ''
