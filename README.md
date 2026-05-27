# 도깨비 FC

축구 동호회 도깨비 FC를 위한 웹 애플리케이션. 경기 일정/결과, 선수 통계, 랭킹, 참석(RSVP)을 관리한다.

## 기술 스택

- **Frontend**: Vue 3 (Composition API) + Vite
- **State**: Pinia
- **Router**: Vue Router 4 (History 모드)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth · **Realtime Database** · Security Rules)
- **Deploy**: GitHub Pages (GitHub Actions)

> 데이터 저장은 **Realtime Database 단독** 사용 (Firestore 미사용). 사진/동영상 업로드(Storage)는
> 사용하지 않으며 관련 코드는 주석 처리되어 있다 (`src/firebase/storage.js`, PlayerManageView).

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

기존 개인 프로젝트 **`hosing-5913f`** 를 재사용한다 (travel 프로젝트와 동일, 같은 Realtime Database).
config 는 `src/firebase/config.js` 에 기본값으로 내장되어 있어 별도 `.env` 없이 바로 동작한다.
웹 API key 는 비밀이 아니며 Authorized domains + RTDB Rules 로 보호된다.

- **Authorized domains**: `hoseong-lee.github.io` 가 이미 등록되어 있어(같은 도메인에 travel 배포) Google 로그인이 바로 동작한다.
- **부트스트랩 관리자**: `3hosungo@gmail.com` 이 `src/firebase/auth.js`(BOOTSTRAP_ADMINS)에 하드코딩되어 있어, `allowedEmails` 가 비어 있어도 즉시 관리자로 로그인된다. 첫 로그인 시 본인 화이트리스트 노드가 자동 생성되며, 이후 다른 멤버는 `/admin/allowed-emails` 에서 추가한다.
- 다른 Firebase 프로젝트로 바꾸려면 `.env.local`(또는 GitHub secrets)에 `VITE_FIREBASE_*`(`VITE_FIREBASE_DATABASE_URL` 포함)를 채운다.

Realtime Database 가 활성화되어 있어야 하며, 보안 규칙은 한 번 배포한다:

```bash
# firebase-tools 설치 시 (firebase.json → database.rules.json)
firebase deploy --only database
```

> **네임스페이스**: 이 앱의 모든 데이터는 RTDB 의 **`dokkaebi/`** 노드 아래에 저장된다(travel/calendar 와 분리). 보안 규칙도 `dokkaebi` 블록 하나로 관리한다.
>
> **데이터 키 주의**: RTDB 키에 `.` 를 쓸 수 없어 `allowedEmails` 는 이메일의 `.` 를 `,` 로 인코딩해 키로 쓴다(`encodeEmailKey`). 표시는 노드 안의 `email` 필드를 사용한다.

## 권한 모델

- Google OAuth 로그인 + `allowedEmails` 화이트리스트 검증 (미등록 시 즉시 로그아웃)
- `admin`: 전체 등록/수정/삭제 / `member`: 조회 + 본인 RSVP만 수정
- 클라이언트 가드(`requiresAuth` / `requiresAdmin`)는 UX용이며, 1차 보안은 로그인 시 화이트리스트 검증으로 강제
- RTDB Rules 는 `auth != null` 기준(인증된 사용자만 읽기/쓰기). 화이트리스트 미등록자는 로그인 단계에서 즉시 로그아웃되므로 실질 접근이 차단된다. 더 엄격한 서버측 권한 분리가 필요하면 규칙에 admin uid 맵을 도입할 수 있다.

## 진행 현황

- [x] **Phase 0** 프로젝트 셋업 (Vite · Tailwind · Pinia · Router · Firebase SDK · GitHub Actions)
- [x] **Phase 1** 인증 (Google 로그인 · 화이트리스트 검증 · Auth store · 라우터 가드 · Security Rules)
- [x] **Phase 2** 선수 관리 (CRUD · 명단/프로필 · 통계 차트) — 사진 업로드는 미사용(주석 처리)
- [x] **Phase 3** 경기 관리 (시즌 · 경기 등록/수정 · 목록/상세 · 이벤트 타임라인)
- [x] **Phase 4** 결과 입력 + 통계 (QuickResultInput · 트랜잭션 통계 갱신 · 랭킹 · 홈 대시보드)
- [x] **Phase 5** RSVP + 화이트리스트 (실시간 RSVP · 참석자 명단 · 이메일 관리)
- [x] **Phase 6** 마무리 (관리자 대시보드 · 감사 이력 · 토스트/모달/빈상태 UX · 모바일 반응형)

### 구현 메모

- **랭킹 집계**: `players.stats` / `seasonStats` 비정규화 값을 클라이언트에서 정렬한다.
  스펙에서 우려한 `seasonStats.{seasonId}.goals` 동적 필드 인덱스 문제를 회피하기 위함.
- **시즌 부트스트랩**: 활성 시즌이 없으면 관리자 대시보드에서 "올해 시즌 생성" 버튼으로 생성.
- **결과 통계**: `submitMatchResult` 트랜잭션이 이전 events 와 비교해 골/도움/출전/MOM 의 net diff 만 반영(재입력 시 자동 롤백).
