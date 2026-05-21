# 로드맵 에이전트 메모리

## 프로젝트 특이사항

- 인증: 이메일 + 구글 OAuth 이미 구현 완료 (재구현 불필요)
- DB 타입: `types/database.types.ts` — 스키마 변경 시 Supabase CLI로 재생성 필요
- proxy.ts: 비회원 접근 경로(`/invite/*` 등) 추가 시 인증 리다이렉트 예외 목록에 반드시 포함
- 서버 클라이언트: 전역 변수 저장 금지, 요청마다 새로 생성

## 로드맵 구조 패턴

- M0: 인프라/DB (1주) → M1: P0 MVP (3주) → M2: P1 완성도 (2주) → M3: P2+배포 (1주)
- Server Actions 위치: 각 도메인 폴더 하위 `_actions/` 디렉토리
- Zod 스키마 위치: `lib/validations/` 하위 도메인별 파일

## 반복되는 기술 리스크 패턴

- RLS 정책 누락: 마일스톤 0에서 스키마와 함께 작성, 블로커 제거 우선
- 비회원 처리: guest_token HttpOnly 쿠키 + RLS 조합, Route Handler로 발급
- 계산 타이밍: DB 트리거 vs Server Action 계산 방식 결정을 열린 질문으로 명시

## 열린 질문 패턴 (자주 누락되는 항목)

- 연관 레코드 삭제 시 처리 방식 (cascade vs soft delete)
- 자동 계산 값의 재계산 시점 정책
- 중복 신청 방지 수준 (기기 단위 vs 연락처 단위)
- 상태 변경 시 참여자 알림 여부
