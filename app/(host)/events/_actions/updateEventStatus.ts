"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 이벤트 상태 변경 Server Action
export async function updateEventStatus(
  eventId: string,
  status: "open" | "closed" | "cancelled"
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 본인 이벤트인지 확인
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    return { error: "이벤트를 찾을 수 없습니다" };
  }

  if (event.host_id !== data.claims.sub) {
    return { error: "수정 권한이 없습니다" };
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (updateError) {
    console.error("이벤트 상태 변경 오류:", updateError);
    return { error: "상태 변경에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
