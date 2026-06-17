"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 관리자 이벤트 강제 상태 변경 Server Action
export async function forceUpdateEventStatus(
  eventId: string,
  status: "open" | "closed" | "cancelled"
) {
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

  const { error: updateError } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (updateError) {
    console.error("관리자 이벤트 상태 변경 오류:", updateError);
    return { error: "상태 변경에 실패했습니다" };
  }

  revalidatePath("/admin/events");
  return { success: true };
}
