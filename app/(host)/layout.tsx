import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

// 인증 검증 컴포넌트 — Suspense 경계 내부에서 실행되어야 함
async function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
