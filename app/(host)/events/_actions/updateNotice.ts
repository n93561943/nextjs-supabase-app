"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { noticeSchema } from "@/lib/validations/notice";

// 공지 수정 Server Action
export async function updateNotice(
  noticeId: string,
  eventId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 공지 조회 및 주최자 검증
  const { data: notice, error: fetchError } = await supabase
    .from("notices")
    .select("events(host_id)")
    .eq("id", noticeId)
    .eq("event_id", eventId)
    .single();

  if (fetchError || !notice) {
    return { error: "공지를 찾을 수 없습니다" };
  }

  const event = notice.events as unknown as { host_id: string } | null;
  if (event?.host_id !== data.claims.sub) {
    return { error: "수정 권한이 없습니다" };
  }

  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
  };

  const validated = noticeSchema.safeParse(rawData);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    return {
      error: Object.values(errors).flat()[0] ?? "입력값을 확인해주세요",
      fieldErrors: errors,
    };
  }

  const { error: updateError } = await supabase
    .from("notices")
    .update({
      title: validated.data.title,
      content: validated.data.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noticeId);

  if (updateError) {
    console.error("공지 수정 오류:", updateError);
    return { error: "공지 수정에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/notices`);
  return { success: true };
}
