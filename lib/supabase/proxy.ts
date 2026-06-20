import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 환경 변수 미설정 시 proxy 체크 스킵
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Fluid compute 환경에서 전역 변수에 저장 금지 — 요청마다 새로 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims()와 createServerClient 사이에 다른 코드를 넣지 말 것
  // 세션 동기화 문제로 사용자가 갑자기 로그아웃될 수 있음
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // /auth/* 경로는 정지 체크 및 리다이렉트 예외 처리
  const isAuthPath = request.nextUrl.pathname.startsWith("/auth");

  // 미인증 사용자 리다이렉트 (공개 경로 제외)
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !isAuthPath &&
    !request.nextUrl.pathname.startsWith("/invite")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 인증된 사용자의 정지 여부 확인 (/auth/* 경로는 제외)
  if (user && !isAuthPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", user.sub)
      .single();

    if (profile?.is_suspended === true) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("error", "suspended");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
