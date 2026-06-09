# E2E 스모크 테스트

핵심 회귀 차단 — 인증 페이지 로드, 라우팅, PWA manifest, SW 등록.

## 실행

```bash
# 1. Chromium 다운로드 (최초 1회)
npx playwright install chromium

# 2. dev 서버 자동 띄움 + 테스트 실행
npm run e2e

# 3. headed 모드 (브라우저 열림)
npm run e2e -- --headed

# 4. 특정 테스트만
npm run e2e -- --grep "manifest"
```

## CI 통합

GitHub Actions 에 추가:

```yaml
- run: npx playwright install chromium
- run: npm run e2e
  env:
    CI: true
```

## 배포본 대상 테스트

```bash
E2E_BASE_URL=https://hoseong-lee.github.io/Dokkaebi_FC npm run e2e
```
