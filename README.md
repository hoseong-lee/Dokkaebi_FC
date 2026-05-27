# 도깨비 FC

축구 동호회 도깨비 FC를 위한 웹 애플리케이션. 경기 일정/결과, 선수 통계, 랭킹, 참석(RSVP)을 관리한다.

## 기술 스택

- **Frontend**: Vue 3 (Composition API) + Vite
- **State**: Pinia
- **Router**: Vue Router 4 (History 모드)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth · Firestore · Storage · Security Rules)
- **Deploy**: GitHub Pages (GitHub Actions)

## 로컬 개발

```bash
npm install
cp .env.example .env.local   # Firebase config 값 채우기
npm run dev
```

## 빌드 / 배포

```bash
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 미리보기
```

`main` 브랜치 push 시 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 GitHub Pages에 배포한다.
저장소 이름이 `Dokkaebi_FC` 이므로 `vite.config.js`의 `base`는 `/Dokkaebi_FC/`로 설정되어 있다.

## Firebase 설정

1. Firebase Console에서 프로젝트 생성 → Authentication(Google), Firestore(asia-northeast3), Storage 활성화
2. 웹 앱 추가 후 config 값을 `.env.local` 및 GitHub Actions secrets에 등록
3. Authentication → Authorized domains에 `<github-username>.github.io` 추가
4. Google Cloud Console에서 API Key HTTP referrer 제한 설정
5. **부트스트랩**: `allowedEmails` 컬렉션에 첫 관리자 이메일 문서를 수동 등록
   (문서 ID = 이메일 lowercase, `{ role: "admin", active: true, addedBy: "system" }`)

```bash
# Firebase Rules / 인덱스 배포 (firebase-tools 설치 시)
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

## 권한 모델

- Google OAuth 로그인 + `allowedEmails` 화이트리스트 검증 (미등록 시 즉시 로그아웃)
- `admin`: 전체 등록/수정/삭제 / `member`: 조회 + 본인 RSVP만 수정
- 클라이언트 가드(`requiresAuth` / `requiresAdmin`)는 UX용이며, 실제 보안은 Firestore Rules에서 강제

## 진행 현황

- [x] **Phase 0** 프로젝트 셋업 (Vite · Tailwind · Pinia · Router · Firebase SDK · GitHub Actions)
- [x] **Phase 1** 인증 (Google 로그인 · 화이트리스트 검증 · Auth store · 라우터 가드 · Security Rules)
- [ ] Phase 2 선수 관리
- [ ] Phase 3 경기 관리
- [ ] Phase 4 결과 입력 + 통계
- [ ] Phase 5 RSVP + 화이트리스트 관리
- [ ] Phase 6 마무리
