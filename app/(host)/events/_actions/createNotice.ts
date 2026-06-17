"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { noticeSchema } from "@/lib/validations/notice";

// 공지 생성 Server Action
export async function createNotice(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  const authorId = data.claims.sub;

  // 해당 이벤트의 주최자인지 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { error: "이벤트를 찾을 수 없습니다" };
  }

  if (event.host_id !== authorId) {
    return { error: "권한이 없습니다" };
  }

  // 폼 데이터 파싱
  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
  };

  // Zod 검증
  const validated = noticeSchema.safeParse(rawData);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    return {
      error: Object.values(errors).flat()[0] ?? "입력값을 확인해주세요",
      fieldErrors: errors,
    };
  }

  const { error } = await supabase.from("notices").insert({
    event_id: eventId,
    author_id: authorId,
    title: validated.data.title,
    content: validated.data.content,
  });

  if (error) {
    console.error("공지 생성 오류:", error);
    return { error: "공지 생성에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/notices`);
  return { success: true };
}
