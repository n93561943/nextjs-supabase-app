"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 관리자 이벤트 강제 삭제 Server Action
export async function forceDeleteEvent(eventId: string) {
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

  // 연관 데이터 삭제 순서: settlement_payments → settlements → participants → notices → events
  // 정산 결제 내역 삭제
  const { data: settlements } = await supabase
    .from("settlements")
    .select("id")
    .eq("event_id", eventId);

  for (const settlement of settlements ?? []) {
    await supabase
      .from("settlement_payments")
      .delete()
      .eq("settlement_id", settlement.id);
  }

  await supabase.from("settlements").delete().eq("event_id", eventId);
  await supabase.from("participants").delete().eq("event_id", eventId);
  await supabase.from("notices").delete().eq("event_id", eventId);

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) {
    console.error("관리자 이벤트 삭제 오류:", deleteError);
    return { error: "이벤트 삭제에 실패했습니다" };
  }

  revalidatePath("/admin/events");
  return { success: true };
}
