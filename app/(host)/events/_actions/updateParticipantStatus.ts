"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 참여자 상태 업데이트 Server Action (주최자 전용)
export async function updateParticipantStatus(
  participantId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  const hostId = data.claims.sub;

  // 참여자 정보 조회하여 해당 이벤트의 주최자인지 검증
  const { data: participant, error: fetchError } = await supabase
    .from("participants")
    .select("id, event_id, events!inner(host_id)")
    .eq("id", participantId)
    .single();

  if (fetchError || !participant) {
    return { error: "참여자를 찾을 수 없습니다" };
  }

  // 타입 안전하게 events 관계 접근
  const eventData = participant.events as unknown as { host_id: string };
  if (eventData.host_id !== hostId) {
    return { error: "권한이 없습니다" };
  }

  const { error } = await supabase
    .from("participants")
    .update({ status })
    .eq("id", participantId);

  if (error) {
    console.error("참여자 상태 업데이트 오류:", error);
    return { error: "상태 업데이트에 실패했습니다" };
  }

  revalidatePath(`/events/${participant.event_id}/participants`);
  return { success: true };
}
