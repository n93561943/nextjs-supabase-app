"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 회원 정지/해제 토글 Server Action
export async function suspendUser(
  userId: string,
  suspend: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 관리자 권한 검증
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .single();

  if (profile?.role !== "admin") {
    return { error: "관리자 권한이 필요합니다" };
  }

  // 자기 자신은 정지 불가
  if (userId === data.claims.sub) {
    return { error: "자기 자신을 정지할 수 없습니다" };
  }

  // is_suspended 토글
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_suspended: suspend })
    .eq("id", userId);

  if (updateError) {
    console.error("회원 정지 처리 오류:", updateError);
    return { error: "처리에 실패했습니다" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
