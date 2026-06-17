"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 참여자 강제 삭제 Server Action
export async function removeParticipant(
  participantId: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 본인 이벤트의 참여자인지 확인
  const { data: participant, error: fetchError } = await supabase
    .from("participants")
    .select("id, event_id, events(host_id)")
    .eq("id", participantId)
    .eq("event_id", eventId)
    .single();

  if (fetchError || !participant) {
    return { error: "참여자를 찾을 수 없습니다" };
  }

  const event = participant.events as unknown as { host_id: string } | null;
  if (event?.host_id !== data.claims.sub) {
    return { error: "삭제 권한이 없습니다" };
  }

  // settlement_payments 먼저 삭제 (FK 제약 때문)
  await supabase
    .from("settlement_payments")
    .delete()
    .eq("participant_id", participantId);

  // 참여자 삭제
  const { error: deleteError } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId);

  if (deleteError) {
    console.error("참여자 삭제 오류:", deleteError);
    return { error: "참여자 삭제에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/participants`);
  return { success: true };
}
