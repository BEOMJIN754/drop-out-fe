import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  const brands = [{ id: 1, name: 'Supreme' }, { id: 2, name: 'Nike' }, { id: 3, name: 'Palace' }, { id: 4, name: 'Stüssy' }]
  const releases = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, brand: brands[i === 0 ? 0 : i === 1 ? 1 : i < 4 ? 3 : 2],
    title: i === 1 ? 'Nike × NOCTA — Nightfall' : `Collection ${i + 1}`, releaseType: i === 1 ? 'COLLAB' : 'DROP',
    releaseAt: '2026-09-12T10:00:00+09:00', status: i < 4 ? 'UPCOMING' : 'RELEASED',
    imageUrl: '/images/photo-1488161628813-04466f872be2.jpg', sourceUrl: 'https://example.com', description: 'Official collection' }))
  let loggedIn = false
  let follows = []
  await page.route('**/api/brands', route => route.fulfill({ json: brands }))
  await page.route('**/api/releases?*', route => route.fulfill({ json: releases.filter(r => r.brand.id === Number(new URL(route.request().url()).searchParams.get('brand'))) }))
  await page.route('**/api/auth/me', route => route.fulfill(loggedIn ? { json: { username: 'Beom', role: 'USER', admin: false } } : { status: 401 }))
  await page.route('**/api/auth/login', route => { loggedIn = true; return route.fulfill({ json: { id: 1, username: 'Beom', role: 'USER', admin: false } }) })
  await page.route('**/api/auth/logout', route => { loggedIn = false; return route.fulfill({ status: 204 }) })
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { headerName: 'X-CSRF-TOKEN', token: 'test' } }))
  await page.route('**/api/me/follows**', route => {
    const method = route.request().method()
    if (method === 'GET') return route.fulfill({ json: follows })
    const id = Number(new URL(route.request().url()).pathname.split('/').pop())
    follows = method === 'PUT' ? [...new Set([...follows, id])] : follows.filter(value => value !== id)
    return route.fulfill({ status: 204 })
  })
})

test('logged-out home presents releases and loads its editorial images', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'UPCOMING RELEASES' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'MY DROP', exact: true })).toHaveCount(0)
  await expect(page.locator('.release-card')).toHaveCount(8)
  await expect(page.locator('.hero-image')).toBeVisible()
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('main img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true })
  expect(errors).toEqual([])
})

test('login, follow, personal list, persistence, unfollow, and logout', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'LOGIN' }).click()
  await page.getByLabel('USERNAME', { exact: true }).fill('Beom')
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'ENTER MY DROP' }).click()
  await expect(page.getByRole('heading', { name: 'YOUR DROP STARTS HERE.' })).toBeVisible()
  await page.getByRole('button', { name: 'SELECT BRANDS' }).click()
  await page.locator('.brand-item').filter({ has: page.getByRole('button', { name: 'View Supreme releases', exact: true }) }).getByRole('button', { name: 'FOLLOW +', exact: true }).click()
  await page.locator('.desktop-nav').getByRole('link', { name: 'MY DROP' }).click()
  await expect(page.locator('.release-card')).toHaveCount(1)
  await expect(page.locator('.release-card')).toContainText('Supreme')
  await page.getByRole('button', { name: 'LIST', exact: true }).click()
  await expect(page.locator('.my-drop-list>button')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.release-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'MANAGE BRANDS' }).click()
  await page.getByRole('button', { name: 'FOLLOWING ✓', exact: true }).click()
  await page.locator('.desktop-nav').getByRole('link', { name: 'MY DROP' }).click()
  await expect(page.getByRole('heading', { name: 'YOUR DROP STARTS HERE.' })).toBeVisible()
  await page.getByRole('button', { name: 'PROFILE' }).click()
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.locator('.my-drop-section')).toHaveCount(0)
})

test('discover combines brand, type, status filters and recovers from no results', async ({ page }) => {
  await page.goto('/#discover')
  await expect(page.locator('.release-card')).toHaveCount(4)
  await page.getByLabel('Brand', { exact: true }).selectOption('2')
  await expect(page.locator('.release-card')).toHaveCount(1)
  await page.getByLabel('Release type').selectOption('CAPSULE')
  await expect(page.getByRole('heading', { name: 'Nothing here. Yet.' })).toBeVisible()
  await page.getByRole('button', { name: 'RESET FILTERS' }).click()
  await expect(page.locator('.release-card')).toHaveCount(8)
  await page.getByRole('button', { name: 'RECENT', exact: true }).click()
  await expect(page.locator('.release-card')).toHaveCount(4)
})

test('search opens a detail and a valid calendar file downloads', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'SEARCH', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Search by brand, collection, or type' })).toBeFocused()
  await page.getByRole('textbox').fill('NOCTA')
  await expect(page.locator('.search-results>button')).toHaveCount(1)
  await page.locator('.search-results>button').click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Nike × NOCTA — Nightfall')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'ADD TO CALENDAR' }).click()
  const download = await downloadPromise
  const content = await readFile(await download.path(), 'utf8')
  expect(content).toContain('BEGIN:VCALENDAR')
  expect(content).toContain('DTSTART:20260912T010000Z')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('following from a logged-out brand page continues after login', async ({ page }) => {
  await page.goto('/#brands')
  await page.locator('.brand-item').filter({ has: page.getByRole('button', { name: 'View Palace releases', exact: true }) }).getByRole('button', { name: 'FOLLOW +', exact: true }).click()
  await page.getByLabel('USERNAME', { exact: true }).fill('Beom')
  await page.getByLabel('PASSWORD', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'ENTER MY DROP' }).click()
  await page.locator('.desktop-nav').getByRole('link', { name: 'MY DROP' }).click()
  await expect(page.getByRole('heading', { name: 'All caught up.' })).toBeVisible()
  await expect(page.locator('.following-brands')).toContainText('Palace')
})

test('mobile navigation and responsive grids avoid horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.mobile-menu')).toBeVisible()
  await expect.poll(() => page.locator('.release-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await page.locator('.mobile-navigation').getByRole('link', { name: 'Brands' }).click()
  await expect(page.getByRole('heading', { name: 'THE BRANDS.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.setViewportSize({ width: 800, height: 1000 })
  await page.goto('/#discover')
  await expect.poll(() => page.locator('.release-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2)
})
