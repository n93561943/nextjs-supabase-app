import { CalendarIcon, ReceiptIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// 기능 소개 카드 데이터
const features = [
  {
    icon: <CalendarIcon className="h-6 w-6 text-primary" />,
    title: "이벤트 관리",
    description: "모임을 생성하고 초대 링크로 간편하게 공유하세요",
  },
  {
    icon: <UsersIcon className="h-6 w-6 text-primary" />,
    title: "참여자 관리",
    description: "신청 승인/거절 및 참여자 명단을 한눈에 관리하세요",
  },
  {
    icon: <ReceiptIcon className="h-6 w-6 text-primary" />,
    title: "정산 관리",
    description: "1인당 금액을 자동으로 계산하고 납부 현황을 추적하세요",
  },
];

// 로그인 상태에 따른 CTA 버튼 — Suspense 경계 내부에서 인증 확인
async function HeroActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  if (isLoggedIn) {
    return (
      <Button asChild size="lg">
        <Link href="/dashboard">대시보드로 이동</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg">
        <Link href="/auth/sign-up">시작하기</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/auth/login">로그인</Link>
      </Button>
    </>
  );
}

// 네비게이션 우측 버튼 — Suspense 경계 내부에서 인증 확인
async function NavActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  if (isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href="/dashboard">대시보드</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/auth/login">로그인</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up">시작하기</Link>
      </Button>
    </>
  );
}

// 랜딩 페이지 (Server Component)
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-bold tracking-tight">모임 매니저</span>
          <div className="flex items-center gap-2">
            <Suspense
              fallback={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">로그인</Link>
                </Button>
              }
            >
              <NavActions />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          모임을 더 쉽게
          <br />
          관리하세요
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          이벤트 생성부터 참여자 관리, 공지, 정산까지 한 곳에서
        </p>

        {/* CTA 버튼 */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Suspense
            fallback={
              <>
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">시작하기</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">로그인</Link>
                </Button>
              </>
            }
          >
            <HeroActions />
          </Suspense>
        </div>
      </section>

      {/* 기능 카드 섹션 */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader className="pb-2">
                <div className="mb-2">{feature.icon}</div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>모임 매니저 &copy; 2026</p>
      </footer>
    </main>
  );
}
