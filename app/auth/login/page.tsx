import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

// searchParams를 비동기로 처리하는 내부 컴포넌트
async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : undefined;

  // 정지된 계정 에러 메시지
  const suspendedMessage =
    errorCode === "suspended"
      ? "계정이 정지되었습니다. 관리자에게 문의해주세요."
      : undefined;

  return (
    <div className="w-full max-w-sm">
      {suspendedMessage && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {suspendedMessage}
        </div>
      )}
      <LoginForm />
    </div>
  );
}

// 로그인 페이지 — Suspense로 감싸서 cacheComponents 환경에서 동작
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Suspense
        fallback={
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        }
      >
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
