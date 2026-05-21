# 모임 매니저 개발 로드맵

## 개요

- **목표**: 모임 주최자가 참여자 관리, 공지, 정산을 한 곳에서 처리하고, 참여자는 링크 하나로 비회원 신청 가능한 모임 이벤트 관리 플랫폼 MVP 출시
- **기간**: 약 7주 (M0 ~ M3)
- **성공 지표**:
  - 주최자 온보딩 시간 5분 이내 (이벤트 생성 + 초대 링크 공유까지)
  - 참여자 비회원 신청 완료율 측정 가능
  - 정산 금액 자동 계산 정확도 100%

---

## 기술 아키텍처 결정사항

### 라우트 그룹 구조

- `app/(host)/` — 주최자 전용 영역, `layout.tsx`에서 Supabase Auth 세션 검증
- `app/(participant)/` — 참여자 영역, 비회원 접근 허용 (guest_token 쿠키 발급)
- `app/(admin)/` — 관리자 전용, `layout.tsx`에서 `role='admin'` 검증

### 비회원 참여자 처리 방식

- 초대 링크 접근 시 `guest_token` (UUID) 생성 후 HttpOnly 쿠키로 저장
- `participants.guest_token` 컬럼과 매핑하여 본인 납부 신고 등 상태 변경 허용
- Route Handler (`app/api/guest-token/route.ts`)에서 쿠키 발급 처리

### Server Actions 활용 범위

- 폼 제출이 있는 모든 변경 작업: 이벤트 생성/수정, 참여 신청, 공지 작성, 정산 생성 등
- 파일 위치: `app/(host)/events/_actions/`, `app/(participant)/invite/_actions/` 등 각 도메인 폴더 하위

### DB 스키마 변경 계획

- `profiles` 테이블: `role` 컬럼 추가, 기존 컬럼 일부 정리
- 신규 테이블 5개 추가: `events`, `participants`, `notices`, `settlements`, `settlement_payments`
- 모든 테이블 RLS 정책 필수 적용
- `types/database.types.ts` Supabase CLI로 재생성 필요

### 컴포넌트 분류 원칙

- `components/ui/` — shadcn/ui 기반 순수 UI (비즈니스 로직 없음)
- `components/host/` — 주최자 영역 비즈니스 컴포넌트
- `components/participant/` — 참여자 영역 비즈니스 컴포넌트
- `components/admin/` — 관리자 영역 비즈니스 컴포넌트

---

## 리스크 및 전제조건

### 기술적 리스크

| 리스크                          | 수준 | 완화 전략                                                                    |
| ------------------------------- | ---- | ---------------------------------------------------------------------------- |
| 비회원 guest_token 보안         | 높음 | HttpOnly 쿠키 + RLS로 본인 레코드만 접근 허용                                |
| RLS 정책 누락                   | 높음 | M0에서 스키마와 RLS를 함께 작성, 마이그레이션 파일로 관리                    |
| `per_person_amount` 계산 타이밍 | 중간 | 정산 생성 시 승인된 참여자 수 기준으로 DB 트리거 또는 Server Action에서 계산 |
| proxy.ts 비회원 라우트 처리     | 중간 | `/invite/*` 경로는 리다이렉트 제외 목록에 추가 필요                          |
| 초대 링크 토큰 노출             | 낮음 | `invite_token`은 UUID v4 사용, 예측 불가                                     |

### 비즈니스 전제조건

- Supabase 프로젝트에 이미 이메일 + 구글 OAuth 인증이 구성되어 있음
- Vercel 배포 환경 준비 완료

### 외부 의존성

- Supabase 마이그레이션 CLI 사용 가능 여부 확인 필요
- Google OAuth Client ID/Secret 환경 변수 설정 확인

---

## 마일스톤

### M0: 인프라 및 DB 기반 구축 (1주)

**목표**: DB 스키마, RLS, 타입, 라우트 뼈대를 완성하여 이후 마일스톤의 블로커를 제거한다.

**완료 기준**:

- 모든 테이블이 Supabase에 생성되고 RLS 정책이 적용된 상태
- `types/database.types.ts`가 새 스키마 기준으로 재생성된 상태
- 라우트 그룹 폴더 구조와 각 레이아웃 파일이 생성된 상태
- proxy.ts에 비회원 경로 예외 처리가 추가된 상태

#### Phase M0-1: DB 스키마 마이그레이션

- [ ] `profiles` 테이블에 `role text DEFAULT 'host'`, `display_name text` 컬럼 추가 (예상: 0.5d) `P0`
  - Supabase 대시보드 또는 마이그레이션 SQL 파일로 작성
  - 기존 profiles 행에 role='host' 기본값 backfill
- [ ] `events` 테이블 생성 (예상: 0.5d) `P0`
  - 관련 컬럼: `id, host_id, title, description, location, event_date, max_participants, status, invite_token, created_at`
  - `status` CHECK 제약: `'open' | 'closed' | 'cancelled'`
  - `invite_token` DEFAULT `gen_random_uuid()`
- [ ] `participants` 테이블 생성 (예상: 0.5d) `P0`
  - 관련 컬럼: `id, event_id, user_id (nullable), guest_token (nullable), name, contact, status, created_at`
  - `status` CHECK 제약: `'pending' | 'approved' | 'rejected'`
- [ ] `notices` 테이블 생성 (예상: 0.5d) `P0`
  - 관련 컬럼: `id, event_id, author_id, title, content, is_pinned, created_at, updated_at`
- [ ] `settlements` 테이블 생성 (예상: 0.5d) `P0`
  - 관련 컬럼: `id, event_id (UNIQUE), total_amount, per_person_amount, bank_name, account_number, account_holder, status, created_at`
  - `status` CHECK 제약: `'open' | 'closed'`
- [ ] `settlement_payments` 테이블 생성 (예상: 0.5d) `P0`
  - 관련 컬럼: `id, settlement_id, participant_id, status, reported_at, confirmed_at`
  - `status` CHECK 제약: `'unpaid' | 'reported' | 'confirmed'`

#### Phase M0-2: RLS 정책 설정

- [ ] `events` RLS 정책 작성 (예상: 1d) `P0`
  - SELECT: 공개 (invite_token으로 조회 포함)
  - INSERT/UPDATE/DELETE: `auth.uid() = host_id` 또는 `role = 'admin'`
  - 관련 파일: Supabase SQL 마이그레이션 파일
- [ ] `participants` RLS 정책 작성 (예상: 1d) `P0`
  - SELECT: 이벤트 host 또는 본인 (user_id 일치 또는 guest_token 쿠키 일치)
  - INSERT: 공개 (비회원 신청 허용)
  - UPDATE: host 또는 본인만
  - DELETE: host 또는 admin만
- [ ] `notices` RLS 정책 작성 (예상: 0.5d) `P0`
  - SELECT: 공개
  - INSERT/UPDATE/DELETE: `author_id = auth.uid()` 또는 admin
- [ ] `settlements`, `settlement_payments` RLS 정책 작성 (예상: 1d) `P0`
  - settlements SELECT: 공개, INSERT/UPDATE: host 또는 admin
  - settlement_payments SELECT: host 또는 본인 participant, UPDATE: 본인(reported) 또는 host(confirmed)

#### Phase M0-3: 타입 및 라우트 뼈대

- [ ] `types/database.types.ts` Supabase CLI로 재생성 (예상: 0.5d) `P0`
  - 커맨드: `npx supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts`
- [ ] 라우트 그룹 폴더 구조 생성 (예상: 1d) `P0`
  - `app/(host)/layout.tsx` — 세션 검증 후 미인증 시 `/auth/login` 리다이렉트
  - `app/(host)/dashboard/page.tsx` — 빈 페이지 (placeholder)
  - `app/(host)/events/new/page.tsx` — 빈 페이지
  - `app/(host)/events/[eventId]/page.tsx` — 빈 페이지
  - `app/(host)/events/[eventId]/participants/page.tsx` — 빈 페이지
  - `app/(host)/events/[eventId]/notices/page.tsx` — 빈 페이지
  - `app/(host)/events/[eventId]/settlement/page.tsx` — 빈 페이지
  - `app/(participant)/invite/[inviteToken]/page.tsx` — 빈 페이지
  - `app/(admin)/admin/page.tsx` — 빈 페이지
  - `app/(admin)/admin/events/page.tsx` — 빈 페이지
  - `app/(admin)/admin/users/page.tsx` — 빈 페이지
  - `app/(admin)/layout.tsx` — role='admin' 검증
- [ ] `proxy.ts` 비회원 경로 예외 처리 추가 (예상: 0.5d) `P0`
  - `/invite/*` 경로를 인증 리다이렉트 제외 목록에 추가
  - 관련 파일: `proxy.ts`
- [ ] guest_token 발급 Route Handler 생성 (예상: 1d) `P0`
  - 파일: `app/api/guest-token/route.ts`
  - GET 요청 시 기존 쿠키 확인 후 없으면 UUID 생성하여 HttpOnly 쿠키 설정

---

### M1: P0 핵심 기능 구현 — MVP (3주)

**목표**: P0 요구사항 전체를 구현하여 주최자가 이벤트를 만들고, 참여자가 신청하고, 공지를 올리고, 정산을 생성하는 핵심 흐름을 완성한다.

**완료 기준**:

- 주최자가 이벤트를 생성하고 초대 링크를 공유할 수 있음
- 비회원이 초대 링크로 참여 신청 가능
- 주최자가 신청 목록을 보고 승인/거절 처리 가능
- 공지를 작성하고 참여자가 열람 가능
- 정산을 생성하고 납부 현황 조회 가능

#### Phase M1-1: 주최자 대시보드 및 이벤트 생성

- [ ] 주최자 대시보드 (`app/(host)/dashboard/page.tsx`) 구현 (예상: 1.5d) `P0`
  - Server Component로 구현, `lib/supabase/server.ts` 활용
  - 본인이 주최한 이벤트 목록 조회 (status별 뱃지 표시)
  - 이벤트 없을 때 빈 상태(empty state) UI 포함
  - 관련 컴포넌트: `components/host/EventCard.tsx`
- [ ] 이벤트 생성 폼 구현 (예상: 2d) `P0`
  - 파일: `app/(host)/events/new/page.tsx` (Client Component 폼)
  - 필드: 제목, 날짜/시간, 장소, 설명, 최대 인원
  - Zod 스키마: `lib/validations/event.ts`
  - Server Action: `app/(host)/events/_actions/createEvent.ts`
  - 생성 성공 시 `invite_token` 자동 생성 (DB DEFAULT), 이벤트 상세 페이지로 리다이렉트
  - 관련 컴포넌트: `components/host/EventForm.tsx`
- [ ] 이벤트 상세/관리 페이지 구현 (예상: 1.5d) `P0`
  - 파일: `app/(host)/events/[eventId]/page.tsx`
  - 이벤트 정보 표시 + 초대 링크 복사 버튼
  - 클립보드 복사: `navigator.clipboard.writeText()` 활용
  - 참여자 수 현황, 공지 수, 정산 상태 요약 카드
  - 관련 컴포넌트: `components/host/InviteLinkCopy.tsx`

#### Phase M1-2: 참여자 신청 및 승인 흐름

- [ ] 초대 링크 페이지 구현 (예상: 2d) `P0`
  - 파일: `app/(participant)/invite/[inviteToken]/page.tsx`
  - `invite_token`으로 이벤트 조회 (없거나 cancelled면 404/안내 페이지)
  - 이벤트 정보 (제목, 날짜, 장소, 설명, 현재 인원/최대 인원) 표시
  - 모바일 우선 레이아웃 (max-w-md, mx-auto)
  - status='closed'이면 신청 폼 숨기고 마감 안내 표시
- [ ] 비회원 참여 신청 폼 구현 (예상: 2d) `P0`
  - 필드: 이름, 연락처
  - Zod 스키마: `lib/validations/participant.ts`
  - Server Action: `app/(participant)/invite/_actions/submitApplication.ts`
  - guest_token 쿠키 없으면 발급 후 진행
  - 중복 신청 방지: 동일 guest_token으로 재신청 시 안내
  - 관련 컴포넌트: `components/participant/ApplicationForm.tsx`
- [ ] 참여자 관리 페이지 구현 (예상: 2d) `P0`
  - 파일: `app/(host)/events/[eventId]/participants/page.tsx`
  - Server Component로 참여자 목록 조회
  - 상태별 탭 필터: 대기(pending) / 승인(approved) / 거절(rejected)
  - 승인/거절 버튼 → Server Action: `app/(host)/events/_actions/updateParticipantStatus.ts`
  - 관련 컴포넌트: `components/host/ParticipantList.tsx`, `components/host/ParticipantStatusBadge.tsx`

#### Phase M1-3: 공지 관리

- [ ] 공지 목록 조회 및 작성 페이지 구현 (예상: 2d) `P0`
  - 파일: `app/(host)/events/[eventId]/notices/page.tsx`
  - Server Component로 공지 목록 조회 (최신순)
  - 공지 작성 폼 (제목, 내용)
  - Zod 스키마: `lib/validations/notice.ts`
  - Server Action: `app/(host)/events/_actions/createNotice.ts`
  - 관련 컴포넌트: `components/host/NoticeForm.tsx`, `components/host/NoticeList.tsx`
- [ ] 참여자 공지 열람 UI 구현 (예상: 1d) `P0`
  - 초대 링크 페이지 하단 공지 섹션에 통합
  - 공지 목록 표시 (제목 + 내용 + 작성일)
  - 관련 컴포넌트: `components/participant/NoticeSection.tsx`

#### Phase M1-4: 정산 생성 및 납부 현황

- [ ] 정산 생성 페이지 구현 (예상: 2d) `P0`
  - 파일: `app/(host)/events/[eventId]/settlement/page.tsx`
  - 총 금액 입력 시 승인된 참여자 수로 1인당 금액 자동 계산 (클라이언트 실시간 미리보기)
  - Server Action: `app/(host)/events/_actions/createSettlement.ts`
    - settlement 생성 후 approved 상태 참여자 전원에 대해 `settlement_payments` 자동 생성 (status='unpaid')
  - 이미 정산이 있으면 납부 현황 화면으로 전환
  - Zod 스키마: `lib/validations/settlement.ts`
  - 관련 컴포넌트: `components/host/SettlementForm.tsx`
- [ ] 납부 현황 조회 UI 구현 (예상: 1.5d) `P0`
  - 미납/납부 신고/확인 완료 3단계 상태 목록
  - 참여자별 납부 상태 표시
  - 관련 컴포넌트: `components/host/PaymentStatusList.tsx`
- [ ] 참여자 정산 정보 열람 UI 구현 (예상: 1d) `P0`
  - 초대 링크 페이지에 정산 섹션 통합
  - 1인당 금액, 계좌 정보 표시
  - 관련 컴포넌트: `components/participant/SettlementSection.tsx`

---

### M2: P1 기능 구현 — 완성도 향상 (2주)

**목표**: P1 요구사항을 구현하여 서비스 운영 편의성을 높이고 관리자 대시보드를 완성한다.

**완료 기준**:

- 주최자가 이벤트를 수정하고 상태를 변경할 수 있음
- 공지 핀 고정, 수정, 삭제 가능
- 참여자가 납부를 자기 신고하고 주최자가 확인 가능
- 관리자 대시보드에서 통계 및 이벤트/회원 관리 가능

#### Phase M2-1: 이벤트 및 참여자 관리 강화

- [ ] 이벤트 수정 기능 구현 (예상: 1.5d) `P1`
  - 이벤트 상세 페이지에 수정 폼 연결
  - Server Action: `app/(host)/events/_actions/updateEvent.ts`
  - 기존 `EventForm` 컴포넌트 재활용 (create/update 모드 분기)
  - 관련 파일: `components/host/EventForm.tsx`
- [ ] 이벤트 상태 관리 기능 구현 (예상: 1d) `P1`
  - 이벤트 상세 페이지에 상태 변경 드롭다운 추가 (모집 중 / 마감 / 취소)
  - Server Action: `app/(host)/events/_actions/updateEventStatus.ts`
  - 상태별 UI 처리 (취소 시 경고 다이얼로그)
- [ ] 참여자 강제 삭제 기능 구현 (예상: 1d) `P1`
  - 참여자 목록에 삭제 버튼 추가 (확인 다이얼로그 포함)
  - Server Action: `app/(host)/events/_actions/removeParticipant.ts`
  - 삭제 시 연관 `settlement_payments` 처리 (삭제 또는 상태 유지 여부 결정 필요)

#### Phase M2-2: 공지 강화

- [ ] 공지 핀 고정 기능 구현 (예상: 0.5d) `P1`
  - 공지 목록 아이템에 핀 토글 버튼
  - Server Action: `app/(host)/events/_actions/toggleNoticePin.ts`
  - 핀 고정된 공지가 목록 상단에 표시되도록 정렬
- [ ] 공지 수정/삭제 기능 구현 (예상: 1d) `P1`
  - 공지 아이템에 수정/삭제 버튼 (주최자에게만 표시)
  - Server Actions: `updateNotice.ts`, `deleteNotice.ts`
  - 수정 시 인라인 폼 또는 모달로 처리
  - 관련 파일: `app/(host)/events/_actions/updateNotice.ts`, `deleteNotice.ts`

#### Phase M2-3: 정산 고도화

- [ ] 납부 자기 신고 기능 구현 (예상: 1d) `P1`
  - 초대 링크 페이지 정산 섹션에 "납부했어요" 버튼 추가
  - Server Action: `app/(participant)/invite/_actions/reportPayment.ts`
  - guest_token 쿠키로 본인 `settlement_payments` 레코드 확인 후 status='reported' 업데이트
  - 이미 신고한 경우 버튼 비활성화
- [ ] 주최자 납부 확인 기능 구현 (예상: 1d) `P1`
  - 납부 현황 목록에서 status='reported' 항목에 "확인" 버튼 표시
  - Server Action: `app/(host)/events/_actions/confirmPayment.ts`
  - 일괄 확인 버튼 추가 고려
- [ ] 계좌 정보 입력 기능 구현 (예상: 1d) `P1`
  - 정산 생성 폼에 계좌 정보 필드 추가 (은행명, 계좌번호, 예금주)
  - 정산 생성 후 수정 기능: Server Action `updateSettlementAccount.ts`
  - 참여자 화면 정산 섹션에 계좌 정보 표시
  - 관련 파일: `app/(host)/events/_actions/updateSettlementAccount.ts`

#### Phase M2-4: 관리자 대시보드

- [ ] 관리자 레이아웃 및 role 검증 구현 (예상: 0.5d) `P1`
  - 파일: `app/(admin)/layout.tsx`
  - `supabase.auth.getClaims()`로 세션 확인 후 `profiles.role` 조회
  - role != 'admin'이면 403 또는 홈으로 리다이렉트
- [ ] 관리자 대시보드 통계 페이지 구현 (예상: 1.5d) `P1`
  - 파일: `app/(admin)/admin/page.tsx`
  - 통계 카드: 전체 이벤트 수, 가입 회원 수, 전체 정산 총액
  - Server Component로 Supabase 집계 쿼리 활용
  - 데스크톱 최적화 레이아웃 (grid)
  - 관련 컴포넌트: `components/admin/StatsCard.tsx`
- [ ] 전체 이벤트 관리 페이지 구현 (예상: 2d) `P1`
  - 파일: `app/(admin)/admin/events/page.tsx`
  - 이벤트 목록 (주최자명, 제목, 상태, 참여자 수, 생성일)
  - 검색 (제목), 상태 필터
  - 강제 수정: 이벤트 상태 변경
  - 강제 삭제: 확인 다이얼로그 후 삭제
  - 관련 컴포넌트: `components/admin/EventManageTable.tsx`
- [ ] 회원 목록 관리 페이지 구현 (예상: 1.5d) `P1`
  - 파일: `app/(admin)/admin/users/page.tsx`
  - 가입 회원 목록 (이름, 이메일, 가입일, role)
  - 관련 컴포넌트: `components/admin/UserManageTable.tsx`

---

### M3: P2 기능 및 마무리 (1주)

**목표**: P2 기능을 구현하고 전체 품질을 점검하여 프로덕션 배포 준비를 완료한다.

**완료 기준**:

- 초대 링크 재발급, 정산 마감, 회원 정지 기능 동작
- 랜딩 페이지 정비 완료
- 접근성 및 반응형 최종 점검 완료
- Vercel 프로덕션 배포 완료

#### Phase M3-1: P2 기능 구현

- [ ] 초대 링크 재발급 기능 구현 (예상: 1d) `P2`
  - 이벤트 상세 페이지에 "링크 재발급" 버튼 추가 (경고 다이얼로그: 기존 링크 무효화 안내)
  - Server Action: `app/(host)/events/_actions/regenerateInviteToken.ts`
  - DB에서 `invite_token = gen_random_uuid()` 업데이트
  - 관련 파일: `components/host/InviteLinkCopy.tsx`
- [ ] 정산 마감 기능 구현 (예상: 1d) `P2`
  - 정산 페이지에 "정산 마감" 버튼 추가
  - Server Action: `app/(host)/events/_actions/closeSettlement.ts`
  - `settlements.status = 'closed'` 업데이트
  - 마감 후 납부 신고/확인 버튼 비활성화
- [ ] 회원 정지 기능 구현 (예상: 1d) `P2`
  - 관리자 회원 목록에 "정지" 버튼 추가
  - `profiles` 테이블에 `is_suspended boolean DEFAULT false` 컬럼 추가
  - Server Action: `app/(admin)/admin/_actions/suspendUser.ts`
  - proxy.ts에서 정지 회원 로그인 차단 처리

#### Phase M3-2: 랜딩 페이지 및 전체 마무리

- [ ] 랜딩 페이지 정비 (예상: 1d) `P1`
  - 파일: `app/page.tsx`
  - 서비스 소개 (주요 기능 3가지 강조)
  - 주최자 회원가입/로그인 CTA 버튼
  - 기존 tutorial 컴포넌트 제거
- [ ] 반응형 및 접근성 최종 점검 (예상: 1d) `P1`
  - 주최자/참여자 화면: max-w-md 모바일 우선 확인
  - 관리자 화면: 데스크톱 레이아웃 확인
  - shadcn/ui ARIA 속성 유지 여부 확인
- [ ] Vercel 프로덕션 배포 및 환경 변수 설정 (예상: 0.5d) `P1`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 설정
  - Supabase Auth URL 설정 (Site URL, Redirect URLs)
  - 배포 후 핵심 흐름 E2E 확인

---

## 의존성 맵

```
M0 (인프라) ──────────────────────────────────────┐
  ├── M0-1 (DB 스키마) ──► M0-2 (RLS)             │
  │                         ├──► M0-3 (타입/라우트) │
  │                         └──► M1 전체 블록       │
  └──────────────────────────────────────────────► M1

M1 (P0 핵심 기능)
  ├── M1-1 (이벤트 생성) ──► M1-2 (참여자 신청)
  ├── M1-2 (참여자 승인) ──► M1-4 (정산 생성 — 승인자 수 기준)
  └── M1-3 (공지) — M1-1과 병렬 가능

M2 (P1 기능)
  ├── M2-1 의존: M1-1 완료
  ├── M2-2 의존: M1-3 완료
  ├── M2-3 의존: M1-4 완료
  └── M2-4 (관리자) — M1 전체 완료 후 병렬 가능

M3 (P2 + 마무리)
  └── M2 전체 완료 후 시작
```

---

## 전체 일정 요약

| 마일스톤              | 기간    | 주요 내용                         | 우선순위 | 상태   |
| --------------------- | ------- | --------------------------------- | -------- | ------ |
| M0: 인프라 및 DB 기반 | 1주     | DB 스키마, RLS, 타입, 라우트 뼈대 | P0       | 미시작 |
| M1: MVP 핵심 기능     | 3주     | 이벤트/참여/공지/정산 P0 전체     | P0       | 미시작 |
| M2: 완성도 향상       | 2주     | P1 기능 + 관리자 대시보드         | P1       | 미시작 |
| M3: P2 및 배포        | 1주     | P2 기능 + 랜딩 + 배포             | P2       | 미시작 |
| **합계**              | **7주** |                                   |          |        |

---

## 범위 외 (Out of Scope)

이번 로드맵(M0~M3)에서 제외된 기능:

- 카풀 매칭 기능
- 실시간 알림 (채팅, 푸시 — Supabase Realtime 미활용)
- 외부 정산 앱 연동 (토스, 카카오페이)
- 반복 이벤트 (정기 모임) 자동화
- 캘린더 연동
- 테스트 코드 작성 (현재 프레임워크 미설정)
- CI/CD 파이프라인 자동화

---

## 열린 질문 (Open Questions)

1. **참여자 강제 삭제 시 settlement_payments 처리**: 승인된 참여자를 삭제하면 해당 참여자의 settlement_payments 레코드를 함께 삭제할지, 아니면 유지하고 per_person_amount를 재계산할지 결정이 필요합니다.

2. **per_person_amount 재계산 시점**: 정산 생성 후 추가 참여자가 승인되거나 삭제되면 per_person_amount를 자동으로 재계산해야 하는지, 또는 정산 생성 시점의 인원으로 고정할지 명확히 해야 합니다.

3. **비회원 참여자 중복 신청 방지 방식**: 동일 브라우저에서 guest_token으로 중복 방지하면 다른 기기에서는 재신청이 가능합니다. 연락처 기반 중복 체크를 추가할지 여부를 결정해야 합니다.

4. **이벤트 취소 시 참여자 알림**: 취소 상태로 변경 시 참여자에게 별도 알림 없이 초대 링크 페이지에서만 확인 가능한 것으로 처리할지, 향후 알림 기능과 연계할지 방향을 확인해야 합니다.

5. **관리자 계정 생성 방식**: PRD에서 "DB에서 role='admin' 부여"라고 명시되어 있으나, 초기 관리자 계정 생성 절차(Supabase 대시보드 직접 수정 vs 별도 스크립트)를 팀 내에서 정리해야 합니다.

6. **max_participants 초과 신청 처리**: 최대 인원에 도달했을 때 신청 폼을 숨길지, 대기 신청(pending 유지)을 허용할지 정책 결정이 필요합니다.

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                       |
| ----- | ---------- | ------------------------------- |
| 1.0.0 | 2026-05-21 | PRD 1.0.0 기반 초기 로드맵 작성 |
