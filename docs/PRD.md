# PRD (Product Requirements Document)

> 문서 버전: 1.0.0
> 최종 업데이트: 2026-05-20
> 상태: 작성 완료

---

## 1. 제품 개요

### 1.1 제품명

**모임 매니저** (가칭)

### 1.2 한 줄 설명

모임 주최자가 참여자 관리, 공지, 정산을 한 곳에서 처리하고, 참여자는 링크 하나로 비회원 신청 가능한 모임 이벤트 관리 플랫폼

### 1.3 배경 및 문제 정의

수영, 헬스, 친구 모임 등을 주최할 때 주최자는 다음 작업을 카카오톡, 엑셀, 계좌이체 앱을 오가며 처리해야 한다:

- 공지 및 일정 안내 (단톡방에서 묻힘)
- 참여 확인 (수동 카운팅)
- 정산 요청 및 납부 확인 (일일이 확인)

이를 하나의 웹 서비스에서 처리하면 주최자의 운영 부담을 크게 줄일 수 있다.

### 1.4 목표

- MVP 출시 후 주최자 온보딩 시간 5분 이내
- 참여자는 앱 설치/회원가입 없이 링크만으로 신청 가능
- 정산 금액 계산 자동화로 주최자 실수 제거

---

## 2. 사용자 역할

| 역할                     | 설명                      | 접근 방식                            | UI       |
| ------------------------ | ------------------------- | ------------------------------------ | -------- |
| **관리자 (Admin)**       | 플랫폼 전체 운영자        | 회원가입 후 DB에서 role='admin' 부여 | 데스크톱 |
| **주최자 (Host)**        | 이벤트를 만드는 일반 회원 | 이메일 또는 구글 소셜 로그인         | 모바일   |
| **참여자 (Participant)** | 초대 링크로 참여하는 사람 | 링크 접근 (비회원 가능)              | 모바일   |

---

## 3. 핵심 기능 요구사항

### 3.1 이벤트 관리 (주최자)

| 기능             | 설명                                   | 우선순위 |
| ---------------- | -------------------------------------- | -------- |
| 이벤트 생성      | 제목, 날짜, 장소, 설명, 최대 인원 입력 | P0       |
| 초대 링크 생성   | UUID 기반 고유 링크 자동 생성          | P0       |
| 이벤트 수정      | 날짜, 장소 등 변경 가능                | P1       |
| 이벤트 상태 관리 | 모집 중 / 마감 / 취소                  | P1       |
| 초대 링크 재발급 | 기존 링크 무효화 후 새 링크 생성       | P2       |

### 3.2 참여자 관리 (주최자)

| 기능             | 설명                             | 우선순위 |
| ---------------- | -------------------------------- | -------- |
| 참여 신청 수신   | 비회원도 이름+연락처로 신청 가능 | P0       |
| 참여자 승인/거절 | 주최자가 각 신청 처리            | P0       |
| 참여자 목록 조회 | 상태별 필터 (대기/승인/거절)     | P0       |
| 참여자 강제 삭제 | 확정 후 취소자 처리              | P1       |

### 3.3 공지 관리

| 기능           | 설명                          | 우선순위 |
| -------------- | ----------------------------- | -------- |
| 공지 작성      | 주최자만 작성 가능            | P0       |
| 공지 조회      | 참여자가 링크 페이지에서 열람 | P0       |
| 공지 상단 고정 | 중요 공지 핀 처리             | P1       |
| 공지 수정/삭제 | 주최자만 가능                 | P1       |

### 3.4 정산 (1/N 균등 분배)

| 기능             | 설명                                | 우선순위 |
| ---------------- | ----------------------------------- | -------- |
| 정산 생성        | 총 금액 입력 → 1인당 금액 자동 계산 | P0       |
| 납부 현황 조회   | 미납/납부/확인 3단계 상태           | P0       |
| 납부 자기 신고   | 참여자가 본인 납부 표시             | P1       |
| 주최자 납부 확인 | 주최자가 최종 확인 처리             | P1       |
| 계좌 정보 입력   | 정산 페이지에 계좌 표시             | P1       |
| 정산 마감        | 정산 완료 처리                      | P2       |

### 3.5 관리자 대시보드

| 기능                  | 설명                               | 우선순위 |
| --------------------- | ---------------------------------- | -------- |
| 통계 현황             | 전체 이벤트 수, 회원 수, 정산 합계 | P1       |
| 전체 이벤트 조회      | 목록 + 검색/필터                   | P1       |
| 이벤트 강제 수정/삭제 | 문제 이벤트 처리                   | P1       |
| 회원 목록 조회        | 가입 회원 (주최자) 관리            | P1       |
| 회원 정지             | 악용 회원 비활성화                 | P2       |

---

## 4. 비기능 요구사항

| 항목       | 요구사항                                                               |
| ---------- | ---------------------------------------------------------------------- |
| **반응형** | 주최자/참여자 화면: 모바일 우선 (max-w-md), 관리자: 데스크톱 최적화    |
| **보안**   | 모든 테이블 RLS 적용, 비회원 guest_token HttpOnly 쿠키, 초대 링크 UUID |
| **성능**   | 핵심 페이지 LCP 2.5초 이내 (Server Component 기본 활용)                |
| **인증**   | 이메일/비밀번호 + 구글 OAuth (기존 구현)                               |
| **접근성** | shadcn/ui 기본 ARIA 속성 유지                                          |

---

## 5. 기술 스택

| 레이어       | 기술                                         |
| ------------ | -------------------------------------------- |
| 프레임워크   | Next.js 15 App Router                        |
| 데이터베이스 | Supabase (PostgreSQL)                        |
| 인증         | Supabase Auth (이메일 + 구글 OAuth)          |
| ORM          | Supabase JS Client (타입 안전 쿼리)          |
| UI           | Tailwind CSS + shadcn/ui (new-york, neutral) |
| 폼           | React Hook Form + Zod + Server Actions       |
| 배포         | Vercel                                       |

---

## 6. DB 스키마 요약

```
profiles (기존 + role 컬럼 추가)
  └─ events (host_id → auth.users)
       ├─ participants (event_id, user_id nullable, guest_token)
       ├─ notices (event_id, author_id)
       └─ settlements (event_id UNIQUE)
            └─ settlement_payments (settlement_id, participant_id)
```

### 6.1 테이블별 주요 컬럼

#### profiles

| 컬럼         | 타입        | 설명                               |
| ------------ | ----------- | ---------------------------------- |
| id           | uuid        | auth.users 참조 (PK)               |
| role         | text        | 'host' \| 'admin' (기본값: 'host') |
| display_name | text        | 표시 이름                          |
| created_at   | timestamptz | 생성일                             |

#### events

| 컬럼             | 타입        | 설명                              |
| ---------------- | ----------- | --------------------------------- |
| id               | uuid        | PK                                |
| host_id          | uuid        | profiles.id 참조                  |
| title            | text        | 이벤트 제목                       |
| description      | text        | 이벤트 설명                       |
| location         | text        | 장소                              |
| event_date       | timestamptz | 이벤트 날짜/시간                  |
| max_participants | integer     | 최대 인원 (null = 무제한)         |
| status           | text        | 'open' \| 'closed' \| 'cancelled' |
| invite_token     | uuid        | 초대 링크 토큰                    |
| created_at       | timestamptz | 생성일                            |

#### participants

| 컬럼        | 타입        | 설명                                     |
| ----------- | ----------- | ---------------------------------------- |
| id          | uuid        | PK                                       |
| event_id    | uuid        | events.id 참조                           |
| user_id     | uuid        | auth.users 참조 (nullable, 회원 신청 시) |
| guest_token | text        | 비회원 식별 토큰 (nullable)              |
| name        | text        | 참여자 이름                              |
| contact     | text        | 연락처                                   |
| status      | text        | 'pending' \| 'approved' \| 'rejected'    |
| created_at  | timestamptz | 신청일                                   |

#### notices

| 컬럼       | 타입        | 설명             |
| ---------- | ----------- | ---------------- |
| id         | uuid        | PK               |
| event_id   | uuid        | events.id 참조   |
| author_id  | uuid        | profiles.id 참조 |
| title      | text        | 공지 제목        |
| content    | text        | 공지 내용        |
| is_pinned  | boolean     | 상단 고정 여부   |
| created_at | timestamptz | 작성일           |

#### settlements

| 컬럼              | 타입        | 설명                    |
| ----------------- | ----------- | ----------------------- |
| id                | uuid        | PK                      |
| event_id          | uuid        | events.id 참조 (UNIQUE) |
| total_amount      | integer     | 총 정산 금액 (원)       |
| per_person_amount | integer     | 1인당 금액 (자동 계산)  |
| bank_name         | text        | 은행명                  |
| account_number    | text        | 계좌번호                |
| account_holder    | text        | 예금주                  |
| status            | text        | 'open' \| 'closed'      |
| created_at        | timestamptz | 생성일                  |

#### settlement_payments

| 컬럼           | 타입        | 설명                                  |
| -------------- | ----------- | ------------------------------------- |
| id             | uuid        | PK                                    |
| settlement_id  | uuid        | settlements.id 참조                   |
| participant_id | uuid        | participants.id 참조                  |
| status         | text        | 'unpaid' \| 'reported' \| 'confirmed' |
| reported_at    | timestamptz | 납부 자기 신고 시각                   |
| confirmed_at   | timestamptz | 주최자 확인 시각                      |

---

## 7. 라우트 구조 계획

```
app/
├── page.tsx                          # 랜딩 페이지 (공개)
├── auth/
│   ├── login/page.tsx                # 로그인 (주최자)
│   ├── sign-up/page.tsx              # 회원가입 (주최자)
│   └── ...                           # 기존 인증 라우트 유지
├── (host)/                           # 주최자 영역 (인증 필요)
│   ├── dashboard/page.tsx            # 내 이벤트 목록
│   ├── events/
│   │   ├── new/page.tsx              # 이벤트 생성
│   │   └── [eventId]/
│   │       ├── page.tsx              # 이벤트 상세/관리
│   │       ├── participants/page.tsx # 참여자 관리
│   │       ├── notices/page.tsx      # 공지 관리
│   │       └── settlement/page.tsx   # 정산 관리
├── (participant)/                    # 참여자 영역 (비회원 접근 가능)
│   └── invite/[inviteToken]/
│       └── page.tsx                  # 초대 링크 페이지 (신청 + 공지 + 정산 조회)
└── (admin)/                          # 관리자 영역 (admin role 필요)
    └── admin/
        ├── page.tsx                  # 관리자 대시보드
        ├── events/page.tsx           # 전체 이벤트 관리
        └── users/page.tsx            # 회원 관리
```

---

## 8. 제외 범위 (MVP 이후)

다음 기능은 MVP 범위에서 제외하며 이후 버전에서 검토한다:

- 카풀 매칭 기능
- 실시간 알림 (채팅, 푸시)
- 외부 정산 앱 연동 (토스, 카카오페이)
- 반복 이벤트 (정기 모임) 자동화
- 캘린더 연동

---

## 9. 우선순위 요약

### P0 (MVP 필수)

- 이벤트 생성 + 초대 링크 생성
- 비회원 참여 신청 (이름 + 연락처)
- 참여자 승인/거절 + 목록 조회
- 공지 작성 및 조회
- 정산 생성 (1/N 자동 계산) + 납부 현황 조회

### P1 (MVP 이후 빠른 추가)

- 이벤트 수정 + 상태 관리
- 참여자 강제 삭제
- 공지 핀 고정 + 수정/삭제
- 납부 자기 신고 + 주최자 확인
- 계좌 정보 입력
- 관리자 대시보드 (통계, 이벤트/회원 관리)

### P2 (여유 있을 때)

- 초대 링크 재발급
- 정산 마감
- 회원 정지

---

## 10. 변경 이력

| 버전  | 날짜       | 변경 내용     | 작성자 |
| ----- | ---------- | ------------- | ------ |
| 1.0.0 | 2026-05-20 | 초기 PRD 작성 | -      |
