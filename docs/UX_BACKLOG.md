# UI/UX 개선 백로그

UI/UX 진단(2026-06) 기반. ✅ 완료 / ⬜ 대기.

## ✅ 1차 완료 (공통·접근성·온보딩·폼)
- ✅ EmptyState CTA prop (actionLabel/actionTo/@action) — 빈 상태에서 다음 행동 유도
- ✅ BaseButton sm 터치 영역 확대 + 다크 hover 버그 fix
- ✅ RsvpButtons 터치 영역(min-h 68px)·아이콘 키움·선택 강조·aria-pressed
- ✅ prefers-reduced-motion 전역 대응 (홀로/스파클/틸트/전환 최소화)
- ✅ 홈 온보딩 배너 (선수 미연결 — 권한별 분기) + 예정경기 없음 CTA
- ✅ 선수 등록 폼 select→칩 (주발/메인·서브 포지션) + 다크 input
- ✅ 경기 목록 빈 상태 CTA (관리자 → 경기 등록)

## ⬜ 대기 (효과 큰 순)
- ⬜ **스켈레톤 로딩** — LoadingSpinner 단일 → SkeletonCard/List.
  HomeView·MatchDetailView·RankingsView 체감 속도 ↑
- ⬜ **낙관적 업데이트** — RSVP/칭찬 투표 클릭 즉시 UI 반영 후 배경 저장.
  현재는 서버 응답 후에만 반영 (모바일 네트워크 체감)
- ⬜ **스쿼드 메이커 모바일** — 선수 카드 터치 영역 48px, grid-cols-4,
  추천 포메이션 고정 + '그 외' 접기
- ⬜ **결과 입력 폼** — 인라인 검증, '이전 쿼터 명단 복사' 강조,
  QuarterEditor 터치 영역 확대
- ⬜ **pull-to-refresh** — 리스트 뷰 당겨서 새로고침 (VueUse useSwipe)
  + '방금 업데이트됨' 타임스탬프
- ⬜ **이미지 lazy load** — 선수 사진/엠블럼 loading="lazy", WebP 변환
- ⬜ **AppNav 정보구조** — 14개 더보기 항목 우선순위 분류 / 6번째 메뉴 검토
- ⬜ **BaseModal 일관성** — 긴 폼은 풀페이지, 짧은 건 바텀시트로 통일
- ⬜ **검색 0건 피드백** — '결과 없음 + 필터 초기화' 버튼

## 메모
- 선수 연결은 **관리자 전용** (auth.linkPlayer 가드). 온보딩 문구는 권한별 분기 필수.
- 카드 애니메이션(홀로/틸트)은 reduced-motion 에서 자동 비활성.
