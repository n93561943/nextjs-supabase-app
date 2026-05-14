# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
npm run dev      # 개발 서버 시작 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 시작
npm run lint     # ESLint 실행
```

테스트 프레임워크는 현재 설정되어 있지 않습니다.

## 환경 변수

`.env.local` 파일에 아래 두 값이 필요합니다:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`lib/utils.ts`의 `hasEnvVars`로 환경 변수 설정 여부를 체크합니다. 미설정 시 proxy 세션 갱신이 스킵됩니다.

## 아키텍처 개요

Next.js 15 App Router + Supabase 인증 스타터킷입니다.

### Supabase 클라이언트 패턴

세 가지 환경별 클라이언트가 있습니다:

- `lib/supabase/client.ts` - 클라이언트 컴포넌트용 (`createBrowserClient`)
- `lib/supabase/server.ts` - 서버 컴포넌트 / Route Handler용 (`createServerClient` + cookies)
- `lib/supabase/proxy.ts` - proxy(`proxy.ts`)에서 세션 갱신용

> **중요**: 서버 클라이언트는 전역 변수에 저장하면 안 됩니다. Fluid compute 환경에서 각 요청/함수 호출마다 새로 생성해야 합니다.

### 인증 흐름

- `proxy.ts`가 Next.js proxy 역할을 하며 모든 요청에서 `updateSession`을 호출해 세션 쿠키를 갱신합니다
- proxy에서 미인증 사용자를 `/auth/login`으로 리다이렉트합니다 (`/`, `/login`, `/auth/*` 경로 제외)
- `app/auth/confirm/route.ts` — 이메일 OTP 검증 처리
- `app/protected/` — 인증된 사용자만 접근 가능한 예시 페이지

### 라우트 구조

```
app/
├── page.tsx                    # 홈 (공개)
├── auth/
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── sign-up-success/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   ├── error/page.tsx
│   └── confirm/route.ts        # OTP 검증 Route Handler
└── protected/
    ├── layout.tsx
    └── page.tsx                # 인증 필요
```

### DB 타입

`types/database.types.ts`에 Supabase 스키마 타입이 정의되어 있습니다. 현재 `profiles` 테이블이 있으며, Supabase CLI로 재생성할 수 있습니다:

```bash
npx supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts
```

## 코드 컨벤션

### 경로 별칭

상대 경로 대신 항상 `@/` 별칭을 사용합니다:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
```

### 컴포넌트 분류

- `components/ui/` — shadcn/ui 기반 순수 UI 컴포넌트 (비즈니스 로직 없음)
- `components/` 루트 — 인증 폼 등 비즈니스 컴포넌트
- `components/tutorial/` — 튜토리얼용 컴포넌트 (실제 앱 개발 시 제거 가능)

### shadcn/ui 설정

- 스타일: `new-york`, 베이스 색상: `neutral`, CSS 변수 사용
- 컴포넌트 추가: `npx shadcn@latest add [컴포넌트명]`
- 아이콘: `lucide-react`

### Server vs Client 컴포넌트

Server Component를 기본으로 사용하고, 상호작용이 필요한 경우에만 `'use client'`를 추가합니다. Supabase 인증 상태 확인은 `supabase.auth.getClaims()`를 사용합니다 (`getUser()` 대신).

### 폼 처리

폼은 React Hook Form + Zod + Server Actions 조합으로 구현합니다. 자세한 패턴은 `docs/guides/forms-react-hook-form.md`를 참고하세요.

## 가이드 문서

`docs/guides/`에 상세 개발 가이드가 있습니다:

- `project-structure.md` — 폴더 구조 및 네이밍 컨벤션
- `component-patterns.md` — 컴포넌트 설계 패턴
- `forms-react-hook-form.md` — 폼 처리 패턴
- `styling-guide.md` — 스타일링 가이드
- `nextjs-15.md` — Next.js 15 특이사항
