import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/me/follows', route => route.fulfill({ json: [] }))
})

test('admin approval and rejection update status; members only see the status', async ({ page }) => {
  const item = { id: 1, brandName: 'Example', requestedBy: 'alice', createdAt: '2026-09-10T00:00:00Z', status: 'PENDING' }
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'manager', role: 'ADMIN', admin: true } }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { headerName: 'X-CSRF-TOKEN', token: 'test' } }))
  await page.route('**/api/brand/admin/requests**', route => {
    if (route.request().method() === 'PATCH') {
      expect(route.request().headers()['x-csrf-token']).toBe('test')
      item.status = route.request().postDataJSON().status
      return route.fulfill({ json: item })
    }
    return route.fulfill({ json: { items: [item], hasNext: false } })
  })
  await page.goto('/#admin-requests')
  await page.getByRole('button', { name: 'Example 승인', exact: true }).click()
  await expect(page.locator('.request-status')).toHaveText('승인')
  await page.reload()
  await expect(page.locator('.request-status')).toHaveText('승인')
  await page.getByRole('button', { name: 'Example 거절', exact: true }).click()
  await expect(page.locator('.request-status')).toHaveText('거절')
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'alice', role: 'USER', admin: false } }))
  await page.route('**/api/brand/requests*', route => route.fulfill({ json: { items: [item], hasNext: false } }))
  await page.goto('/#brand-request'); await page.reload()
  await expect(page.locator('.request-status')).toHaveText('거절')
  await expect(page.locator('.request-actions')).toHaveCount(0)
})

test('brand request submission and history work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  let items = []
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'alice', role: 'USER', admin: false } }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { headerName: 'X-CSRF-TOKEN', token: 'test' } }))
  await page.route('**/api/brand/requests*', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().headers()['x-csrf-token']).toBe('test')
      items = [{ ...route.request().postDataJSON(), id: 1, createdAt: '2026-09-09T00:00:00Z' }]
      await route.fulfill({ status: 201, json: items[0] })
    } else await route.fulfill({ json: { items, hasNext: false } })
  })
  await page.goto('/#brand-request')
  await page.getByLabel('BRAND NAME').fill('Example Brand')
  await page.getByLabel('OFFICIAL WEBSITE').fill('https://example.com')
  await page.getByRole('button', { name: 'REQUEST BRAND' }).click()
  await expect(page.getByRole('heading', { name: 'Example Brand' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('브랜드 요청이 접수되었습니다.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('admin sees requester and ordinary users cannot open admin page', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'manager', role: 'ADMIN', admin: true } }))
  await page.route('**/api/brand/admin/requests*', route => route.fulfill({ json: { items: [{ id: 1, brandName: 'Example', requestedBy: 'alice', createdAt: '2026-09-09T00:00:00Z', reason: 'Please add' }], hasNext: false } }))
  await page.goto('/#admin-requests')
  await expect(page.getByRole('heading', { name: 'THE REQUESTS.' })).toBeVisible()
  await expect(page.getByText('alice', { exact: true })).toBeVisible()
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username: 'alice', role: 'USER', admin: false } }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'THE REQUESTS.' })).toHaveCount(0)
})
