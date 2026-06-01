# 도깨비FC Cloud Functions — 푸시 알림 셋업

이 폴더는 도깨비FC 백엔드(푸시 알림 발송)를 위한 Firebase Cloud Functions 입니다.
프론트엔드(클라이언트)는 이 폴더와 무관하게 GitHub Pages 에서 자동 배포되고, **푸시 알림만 이 백엔드가 담당**합니다.

배포 안 해도 앱은 정상 동작 (단 알림 발송 X).

---

## 📋 셋업 순서 (최초 1회)

### 1단계 — VAPID 키 생성 (필수)

푸시 알림용 웹 인증서가 필요합니다.

1. https://console.firebase.google.com → 프로젝트 `hosing-5913f` 선택
2. **프로젝트 설정 (⚙️)** → **Cloud Messaging** 탭
3. 아래쪽 **웹 푸시 인증서** → **키 쌍 생성**
4. 생성된 키 (예: `BAbCD...XYZ`) 를 복사

### 2단계 — 키를 환경변수로 등록

루트의 `.env.local` 파일을 만들거나 수정:

```env
VITE_FIREBASE_VAPID_KEY=여기에_복사한_키
```

GitHub Pages 배포에 반영하려면 **GitHub Settings → Secrets → Actions** 에 같은 이름으로 등록.
(GitHub Actions 워크플로에서 `secrets.VITE_FIREBASE_VAPID_KEY` 사용)

### 3단계 — Firebase 결제 정보 등록 (Blaze 플랜)

Cloud Functions 는 무료 Spark 플랜으로는 외부 호출이 안 됩니다.
**Blaze (사용량 기반) 플랜으로 업그레이드 필요. 도깨비FC 규모(멤버 30명·월 50 알림)는 무료 한도 안에서 해결됩니다.**

1. https://console.firebase.google.com → 프로젝트 → **Spark → Blaze 업그레이드**
2. 카드 등록 (사용량 없으면 0원 청구)

### 4단계 — Firebase CLI 설치 + 로그인

로컬 PC 에서:

```bash
npm i -g firebase-tools
firebase login
firebase use hosing-5913f
```

### 5단계 — 함수 배포

이 폴더(`functions/`) 에서:

```bash
cd functions
npm install
firebase deploy --only functions
```

배포 후:
- `onAnnouncementCreate` — 새 공지 → 모든 멤버 푸시
- `onMatchCreate` — 새 경기 등록 → 모든 멤버 푸시
- `onPostCommentCreate` — 게시판 댓글 → 글 작성자 푸시
- `onPhotoCommentCreate` — 사진 댓글 → 글 작성자 푸시
- `dailyMatchReminder` — 매일 KST 18:00 → 내일 경기 D-1 알림

---

## 🧪 테스트

1. 모바일에서 도깨비FC 앱 접속 → **홈 화면에 추가** (iOS 는 필수)
2. **마이페이지 → 🔔 알림 → ON**
3. 권한 허용
4. 관리자가 새 공지 작성 → 본인 디바이스에 알림 도착 확인

---

## 💰 비용

도깨비FC 예상 사용량 (멤버 30명 × 월 50 알림):
- Cloud Functions 호출 ~1,500회/월 → Spark 무료 한도(125,000회/월)의 **1.2%**
- FCM 발송 → 완전 무료 (무제한)
- 결과: **거의 평생 0원** 운영 가능

만약 멤버 100명 + 알림 빈도 ↑ 되어도 월 ~수백원 이내.

---

## 🛠 운영 메모

- 죽은 토큰(앱 삭제·로그아웃·만료) 은 발송 실패 시 자동 정리됨 (`pruneInvalidTokens`)
- 1 사용자 = 여러 디바이스 가능 (UID/tokenHash 키로 분리 저장)
- 알림 클릭 → 해당 페이지로 이동 (link 데이터 활용)
- D-1 알림은 매일 KST 18:00 1회 실행 (시간 변경하려면 `dailyMatchReminder` 의 `schedule` 수정)

## 🔒 Firebase Database Rules 추가 필요

`dokkaebi/fcmTokens` 노드 룰을 추가하세요:

```json
{
  "rules": {
    "dokkaebi": {
      "fcmTokens": {
        "$uid": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    }
  }
}
```
