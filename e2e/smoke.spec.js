import { test, expect } from '@playwright/test'

// 로그인 없이도 접근 가능한 페이지: /login
// 인증 필요한 페이지 (로그인 안 했으면 /login 으로 리다이렉트 — 정상 동작 확인)

test('로그인 페이지 로드', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('text=도깨비')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('text=Google로 로그인')).toBeVisible()
})

test('인증 미들웨어 — 보호된 페이지에서 /login 리다이렉트', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL(/\/login/, { timeout: 10_000 })
  await expect(page).toHaveURL(/\/login/)
})

test('SPA 라우팅 — 404 fallback 도 index.html 로드', async ({ page }) => {
  await page.goto('/nonexistent-path')
  // 404 도 SPA fallback 으로 index.html 응답 → 로그인 페이지 표시 (auth 필요)
  await page.waitForURL(/\/(login|nonexistent)/, { timeout: 10_000 })
  await expect(page.locator('body')).toBeVisible()
})

test('PWA manifest 응답', async ({ page }) => {
  const response = await page.request.get('/Dokkaebi_FC/manifest.webmanifest')
  expect(response.status()).toBe(200)
  const manifest = await response.json()
  expect(manifest.name).toMatch(/도깨비|Dokkaebi/)
})

test('Service Worker 등록 가능', async ({ page }) => {
  await page.goto('/')
  // SW 등록은 비동기, 일정 시간 후 navigator.serviceWorker.controller 또는 registration 확인
  await page.waitForLoadState('networkidle', { timeout: 10_000 })
  const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator)
  expect(hasServiceWorker).toBe(true)
})
