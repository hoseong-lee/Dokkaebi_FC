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
- [x] **Phase 2** 선수 관리 (CRUD · 사진 업로드 · 명단/프로필 · 통계 차트)
- [x] **Phase 3** 경기 관리 (시즌 · 경기 등록/수정 · 목록/상세 · 이벤트 타임라인)
- [x] **Phase 4** 결과 입력 + 통계 (QuickResultInput · 트랜잭션 통계 갱신 · 랭킹 · 홈 대시보드)
- [x] **Phase 5** RSVP + 화이트리스트 (실시간 RSVP · 참석자 명단 · 이메일 관리)
- [x] **Phase 6** 마무리 (관리자 대시보드 · 감사 이력 · 토스트/모달/빈상태 UX · 모바일 반응형)

### 구현 메모

- **랭킹 집계**: `players.stats` / `seasonStats` 비정규화 값을 클라이언트에서 정렬한다.
  스펙에서 우려한 `seasonStats.{seasonId}.goals` 동적 필드 인덱스 문제를 회피하기 위함.
- **시즌 부트스트랩**: 활성 시즌이 없으면 관리자 대시보드에서 "올해 시즌 생성" 버튼으로 생성.
- **결과 통계**: `submitMatchResult` 트랜잭션이 이전 events 와 비교해 골/도움/출전/MOM 의 net diff 만 반영(재입력 시 자동 롤백).
