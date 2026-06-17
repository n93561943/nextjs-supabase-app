"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 공지 핀 고정/해제 토글 Server Action
export async function toggleNoticePin(noticeId: string, eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 공지 조회 및 주최자 검증
  const { data: notice, error: fetchError } = await supabase
    .from("notices")
    .select("is_pinned, events(host_id)")
    .eq("id", noticeId)
    .eq("event_id", eventId)
    .single();

  if (fetchError || !notice) {
    return { error: "공지를 찾을 수 없습니다" };
  }

  const event = notice.events as unknown as { host_id: string } | null;
  if (event?.host_id !== data.claims.sub) {
    return { error: "권한이 없습니다" };
  }

  const { error: updateError } = await supabase
    .from("notices")
    .update({ is_pinned: !notice.is_pinned })
    .eq("id", noticeId);

  if (updateError) {
    console.error("공지 핀 토글 오류:", updateError);
    return { error: "핀 설정에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/notices`);
  return { success: true, isPinned: !notice.is_pinned };
}
