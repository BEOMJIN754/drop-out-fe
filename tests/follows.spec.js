import { test, expect } from '@playwright/test'

test('follows survive reload and are cleared when the account changes', async ({ page }) => {
  await page.route('**/api/brands', route => route.fulfill({ json: [{ id: 1, name: 'Supreme' }] }))
  await page.route('**/api/releases?*', route => route.fulfill({ json: [] }))
  let username = 'alice'
  const follows = { alice: [], bob: [] }
  await page.route('**/api/auth/me', route => route.fulfill({ json: { username, role: 'USER', admin: false } }))
  await page.route('**/api/auth/csrf', route => route.fulfill({ json: { headerName: 'X-CSRF-TOKEN', token: 'test' } }))
  await page.route('**/api/me/follows**', route => {
    const method = route.request().method()
    if (method === 'GET') return route.fulfill({ json: follows[username] })
    expect(route.request().headers()['x-csrf-token']).toBe('test')
    const id = Number(new URL(route.request().url()).pathname.split('/').pop())
    if (method === 'PUT') follows[username] = [...new Set([...follows[username], id])]
    if (method === 'DELETE') follows[username] = follows[username].filter(value => value !== id)
    return route.fulfill({ status: 204 })
  })
  await page.goto('/#brands')
  const supreme = page.locator('.brand-item').filter({ has: page.locator('[aria-label="View Supreme releases"]') })
  await supreme.getByRole('button', { name: 'FOLLOW +', exact: true }).click()
  await expect(supreme.getByRole('button', { name: 'FOLLOWING ✓' })).toBeVisible()
  await page.reload()
  await expect(supreme.getByRole('button', { name: 'FOLLOWING ✓' })).toBeVisible()
  username = 'bob'
  await page.reload()
  await expect(supreme.getByRole('button', { name: 'FOLLOW +', exact: true })).toBeVisible()
  expect(follows.alice).toEqual([1])
  username = 'alice'
  await page.reload()
  await supreme.getByRole('button', { name: 'FOLLOWING ✓' }).click()
  await expect(supreme.getByRole('button', { name: 'FOLLOW +', exact: true })).toBeVisible()
  expect(follows.alice).toEqual([])
})
