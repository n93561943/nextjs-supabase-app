"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 초대 링크 토큰 재발급 Server Action
export async function regenerateInviteToken(
  eventId: string
): Promise<{ success: true; newToken: string } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 호스트 본인 이벤트인지 검증
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { error: "이벤트를 찾을 수 없습니다" };
  }

  if (event.host_id !== data.claims.sub) {
    return { error: "권한이 없습니다" };
  }

  // 새 UUID 생성 및 업데이트
  const newToken = crypto.randomUUID();
  const { error: updateError } = await supabase
    .from("events")
    .update({ invite_token: newToken })
    .eq("id", eventId);

  if (updateError) {
    console.error("초대 토큰 재발급 오류:", updateError);
    return { error: "초대 링크 재발급에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, newToken };
}
