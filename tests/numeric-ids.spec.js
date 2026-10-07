import { test, expect } from '@playwright/test'

test('numeric database IDs drive brand filters and release details', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/brands', route => route.fulfill({ json: [{ id: 81, name: 'Supreme' }, { id: 92, name: 'Palace' }] }))
  await page.route('**/api/releases?*', route => {
    const id = Number(new URL(route.request().url()).searchParams.get('brand'))
    expect([81, 92]).toContain(id)
    return route.fulfill({ json: [{ id: id + 100, brand: { id, name: id === 81 ? 'Supreme' : 'Palace' }, title: `Release ${id}`, releaseType: 'DROP', releaseDate: '2026-10-10', status: 'UPCOMING', dateLabel: '공식 발매일', sourceUrl: 'https://example.com' }] })
  })
  await page.goto('/#discover')
  await expect(page.locator('.release-card')).toHaveCount(2)
  await page.getByLabel('Brand', { exact: true }).selectOption('92')
  await expect(page.locator('.release-card')).toHaveCount(1)
  await expect(page.locator('.release-card')).toContainText('Palace')
  await page.locator('.release-card').click()
  await expect(page.locator('.release-detail')).toContainText('Release 92')
  await expect(page.locator('.release-detail')).toContainText('공식 발매일')
  expect(errors).toEqual([])
})
