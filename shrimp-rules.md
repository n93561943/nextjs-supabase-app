# Development Guidelines

## 1. 프로젝트 개요

- **제품명**: 모임 매니저 (Meeting Manager)
- **목적**: 주최자가 참여자 관리·공지·정산을 한 곳에서 처리하고, 참여자는 링크 하나로 비회원 신청 가능한 이벤트 관리 플랫폼
- **현재 상태**: MVP 개발 중 (M0 인프라 구축 단계)
- **기술 스택**: Next.js 15 App Router, Supabase (Auth + PostgreSQL), Tailwind CSS, shadcn/ui (new-york/neutral), React Hook Form + Zod, Server Actions, TypeScript (strict)
- **배포**: Vercel

### 사용자 역할

| 역할                 | 인증 방식                             | 접근 영역            |
| -------------------- | ------------------------------------- | -------------------- |
| 주최자 (Host)        | 이메일 또는 구글 OAuth                | `app/(host)/`        |
| 참여자 (Participant) | 비회원 가능 (guest_token)             | `app/(participant)/` |
| 관리자 (Admin)       | 이메일 또는 구글 OAuth + role='admin' | `app/(admin)/`       |

---

## 2. 디렉터리 및 파일 배치 규칙

### 라우트 구조

```
app/
├── page.tsx                          # 랜딩 페이지 (공개)
├── auth/                             # 인증 라우트 (기존 유지)
├── api/
│   └── guest-token/route.ts          # 비회원 guest_token 발급 전용
├── (host)/                           # 주최자 영역 — 인증 필수
│   ├── layout.tsx                    # 세션 검증 레이아웃
│   ├── dashboard/page.tsx
│   └── events/
│       ├── _actions/                 # 이벤트·참여자·공지·정산 Server Actions
│       ├── new/page.tsx
│       └── [eventId]/
│           ├── page.tsx
│           ├── participants/page.tsx
│           ├── notices/page.tsx
│           └── settlement/page.tsx
├── (participant)/                    # 참여자 영역 — 비회원 접근 허용
│   └── invite/
│       ├── _actions/                 # 참여 신청·납부 신고 Server Actions
│       └── [inviteToken]/page.tsx
└── (admin)/                          # 관리자 영역 — role='admin' 필수
    ├── layout.tsx                    # role 검증 레이아웃
    └── admin/
        ├── _actions/                 # 관리자 Server Actions
        ├── page.tsx
        ├── events/page.tsx
        └── users/page.tsx
```

### Server Actions 위치 규칙

- 주최자 액션: `app/(host)/events/_actions/{actionName}.ts`
  - 예: `createEvent.ts`, `updateParticipantStatus.ts`, `createNotice.ts`, `createSettlement.ts`
- 참여자 액션: `app/(participant)/invite/_actions/{actionName}.ts`
  - 예: `submitApplication.ts`, `reportPayment.ts`
- 관리자 액션: `app/(admin)/admin/_actions/{actionName}.ts`
  - 예: `suspendUser.ts`

### Zod 스키마 위치 규칙

- 모든 Zod 스키마: `lib/validations/{domain}.ts`
  - 예: `lib/validations/event.ts`, `lib/validations/participant.ts`, `lib/validations/notice.ts`, `lib/validations/settlement.ts`

### 컴포넌트 위치 규칙

- `components/ui/` — shadcn/ui 기반 순수 UI, **비즈니스 로직 포함 금지**
- `components/host/` — 주최자 영역 비즈니스 컴포넌트
  - 예: `EventCard.tsx`, `EventForm.tsx`, `ParticipantList.tsx`, `InviteLinkCopy.tsx`, `SettlementForm.tsx`, `PaymentStatusList.tsx`
- `components/participant/` — 참여자 영역 비즈니스 컴포넌트
  - 예: `ApplicationForm.tsx`, `NoticeSection.tsx`, `SettlementSection.tsx`
- `components/admin/` — 관리자 영역 비즈니스 컴포넌트
  - 예: `StatsCard.tsx`, `EventManageTable.tsx`, `UserManageTable.tsx`

---

## 3. 인증 및 접근 제어 규칙

### (host) 레이아웃 — `app/(host)/layout.tsx`

- `lib/supabase/server.ts`로 Supabase 클라이언트 생성 후 `supabase.auth.getClaims()` 호출
- 세션 없으면 `redirect('/auth/login')` 실행
- **`getUser()` 사용 금지** — `getClaims()` 사용

### (admin) 레이아웃 — `app/(admin)/layout.tsx`

- `getClaims()`로 세션 확인 후 `profiles` 테이블에서 `role` 조회
- `role !== 'admin'`이면 홈(`/`) 또는 403으로 리다이렉트
- 관리자 계정 생성: Supabase 대시보드에서 `profiles.role='admin'` 직접 설정

### (participant) 영역

- 인증 불필요, 비회원 접근 허용
- `/invite/[inviteToken]` 진입 시 `app/api/guest-token/route.ts`에서 guest_token 쿠키 발급

### proxy.ts 수정 규칙

- `/invite/*` 경로는 반드시 인증 리다이렉트 제외 목록에 추가
- `/`, `/auth/*`, `/invite/*` 경로는 미인증 상태 허용
- **proxy.ts 수정 시 제외 목록 누락 여부를 반드시 확인**

---

## 4. 비회원 guest_token 처리 규칙

- guest_token은 UUID v4로 생성
- `app/api/guest-token/route.ts`에서 GET 요청으로 발급
  - 기존 쿠키 확인 → 없으면 UUID 생성 → HttpOnly 쿠키 설정
- `participants.guest_token` 컬럼과 1:1 매핑
- RLS 정책에서 guest_token 쿠키 값과 `participants.guest_token` 일치로 본인 레코드 접근 허용
- 참여 신청 Server Action에서 쿠키 없으면 발급 후 진행
- 중복 신청 방지: 동일 guest_token으로 재신청 시 안내 메시지 표시

---

## 5. DB 타입 및 Supabase 클라이언트 규칙

### DB 타입 파일

- `types/database.types.ts` — **Supabase CLI로만 재생성, 수동 편집 금지**
- 재생성 커맨드: `npx supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts`
- 스키마 변경 후 반드시 재생성

### DB 스키마 테이블 목록

| 테이블                | 주요 관계                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `profiles`            | auth.users 참조, role 컬럼 포함                                  |
| `events`              | host_id → profiles.id                                            |
| `participants`        | event_id → events.id, user_id nullable, guest_token nullable     |
| `notices`             | event_id → events.id, author_id → profiles.id                    |
| `settlements`         | event_id → events.id (UNIQUE)                                    |
| `settlement_payments` | settlement_id → settlements.id, participant_id → participants.id |

### Supabase 클라이언트 선택 규칙

| 환경                                          | 파일                     |
| --------------------------------------------- | ------------------------ |
| 서버 컴포넌트 / Route Handler / Server Action | `lib/supabase/server.ts` |
| 클라이언트 컴포넌트                           | `lib/supabase/client.ts` |
| proxy.ts 세션 갱신                            | `lib/supabase/proxy.ts`  |

- **서버 클라이언트를 전역 변수에 저장 금지** — 요청/함수 호출마다 새로 생성

### RLS 적용 규칙

- 모든 테이블에 RLS 정책 필수 적용
- events: SELECT 공개, INSERT/UPDATE/DELETE는 host 또는 admin만
- participants: SELECT는 host 또는 본인, INSERT는 공개(비회원 신청), UPDATE/DELETE는 host 또는 본인
- notices: SELECT 공개, INSERT/UPDATE/DELETE는 author 또는 admin
- settlements: SELECT 공개, INSERT/UPDATE는 host 또는 admin
- settlement_payments: SELECT는 host 또는 본인 participant, UPDATE는 본인(reported) 또는 host(confirmed)

---

## 6. 기능 구현 규칙

### Server Component vs Client Component

- **Server Component를 기본**으로 사용
- 상호작용(이벤트 핸들러, useState, useEffect)이 필요한 경우에만 `'use client'` 추가
- 데이터 fetching은 Server Component에서 처리

### 폼 구현 패턴

- React Hook Form + Zod + Server Actions 조합 사용
- Zod 스키마를 `lib/validations/` 에 정의 후 Server Action과 폼 양측에서 공유
- Server Action 파일은 `'use server'` 지시어로 시작
- 자세한 패턴: `docs/guides/forms-react-hook-form.md` 참고

### 이벤트 생성 흐름 (예시)

1. `lib/validations/event.ts`에 Zod 스키마 정의
2. `app/(host)/events/_actions/createEvent.ts`에 Server Action 작성
3. `components/host/EventForm.tsx`에 폼 컴포넌트 작성 (`'use client'`)
4. `app/(host)/events/new/page.tsx`에서 폼 컴포넌트 렌더링

### 정산 계산 규칙

- `per_person_amount` = `total_amount` ÷ 승인된 참여자 수
- 정산 생성 시 `participants.status='approved'` 인원 기준으로 계산
- 정산 생성 Server Action에서 approved 참여자 전원에 대해 `settlement_payments` 자동 생성 (status='unpaid')

### 레이아웃 반응형 규칙

- 주최자/참여자 화면: 모바일 우선, `max-w-md mx-auto` 적용
- 관리자 화면: 데스크톱 최적화, grid 레이아웃

---

## 7. 코드 컨벤션 규칙

### 임포트 경로

- **항상 `@/` 별칭 사용, 상대 경로(`../`) 사용 금지**

```typescript
// 올바른 예
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations/event";

// 금지
import { Button } from "../../../components/ui/button";
```

### 인증 상태 확인

```typescript
// 올바른 예
const {
  data: { claims },
} = await supabase.auth.getClaims();

// 금지
const {
  data: { user },
} = await supabase.auth.getUser();
```

### shadcn/ui 컴포넌트 추가

- `npx shadcn@latest add [컴포넌트명]` 커맨드로만 추가
- 아이콘: `lucide-react` 사용

### 들여쓰기 및 포맷팅

- 들여쓰기 2칸
- 저장 시 Prettier + ESLint 자동 적용 (VSCode 설정)
- 커밋 전 lint-staged 자동 실행

---

## 8. 커밋 메시지 규칙

- **형식**: `{이모지} {type}: {한국어 설명}`
- **예시**:
  - `✨ feat: 이벤트 생성 기능 추가`
  - `🐛 fix: 참여자 중복 신청 방지 로직 수정`
  - `♻️ refactor: 정산 계산 Server Action 분리`
  - `📝 docs: ROADMAP M0 완료 항목 업데이트`
- **타입 목록**: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
- Husky commit-msg 훅에서 commitlint로 형식 검증

---

## 9. 키 파일 동시 수정 규칙

| 작업                  | 수정해야 할 파일                                                            |
| --------------------- | --------------------------------------------------------------------------- |
| DB 스키마 변경        | Supabase SQL 마이그레이션 → `types/database.types.ts` CLI 재생성            |
| 새 라우트 그룹 추가   | `proxy.ts` 제외 목록 확인                                                   |
| `/invite/*` 관련 수정 | `proxy.ts` 인증 제외 목록 유지 여부 확인                                    |
| 새 Server Action 추가 | 해당 도메인 `_actions/` 폴더에 배치, `'use server'` 지시어 필수             |
| 새 컴포넌트 추가      | 역할별 컴포넌트 폴더 (`host/`, `participant/`, `admin/`, `ui/`) 정확히 분류 |
| ROADMAP 작업 완료     | `docs/ROADMAP.md`에서 해당 항목 체크 (`[ ]` → `[x]`)                        |

---

## 10. 금지 사항

- `types/database.types.ts` 수동 편집 — CLI 재생성만 허용
- `supabase.auth.getUser()` 사용 — `getClaims()` 사용
- 상대 경로 임포트 (`../`, `../../`) — `@/` 별칭 사용
- 서버 클라이언트를 모듈 레벨 전역 변수에 저장
- `components/ui/`에 비즈니스 로직 또는 Supabase 호출 추가
- proxy.ts에서 `/invite/*` 경로에 인증 리다이렉트 적용
- `components/tutorial/` 컴포넌트를 실제 앱 기능에 재사용 — 튜토리얼용이므로 참고 후 별도 구현
- RLS 없이 테이블 생성 — 모든 테이블에 RLS 필수
- `per_person_amount` DB 컬럼 수동 계산 후 하드코딩 — Server Action에서 동적 계산

---

## 11. AI 의사결정 기준

### 새 기능 구현 시 결정 트리

```
새 기능 추가
├── 데이터 변경(폼 제출)?
│   └── YES → Server Action (_actions/ 폴더) + Zod 스키마 (lib/validations/)
├── 인증 필요?
│   ├── 주최자 전용 → app/(host)/ + layout.tsx 세션 확인
│   ├── 관리자 전용 → app/(admin)/ + layout.tsx role 검증
│   └── 비회원 가능 → app/(participant)/ + guest_token 처리
├── 컴포넌트 재사용?
│   ├── 순수 UI (비즈니스 로직 없음) → components/ui/
│   └── 비즈니스 컴포넌트 → components/{host|participant|admin}/
└── DB 타입 필요?
    └── types/database.types.ts 참조 (수동 편집 금지)
```

### 모호한 상황 처리

- 컴포넌트 배치 모호: 비즈니스 로직(Supabase 호출, 역할별 분기)이 있으면 `components/{역할}/`에 배치
- Server vs Client Component 모호: 이벤트 핸들러나 React 훅이 없으면 Server Component
- 정산 인원 기준 모호: 정산 **생성 시점**의 `status='approved'` 참여자 수를 기준으로 고정
