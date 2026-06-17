"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations/event";

// 이벤트 생성 Server Action
export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  const hostId = data.claims.sub;

  // 폼 데이터 파싱
  const rawData = {
    title: formData.get("title") as string,
    event_date: (formData.get("event_date") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    max_participants: (formData.get("max_participants") as string) || undefined,
  };

  // Zod 검증
  const validated = eventSchema.safeParse(rawData);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    return {
      error: Object.values(errors).flat()[0] ?? "입력값을 확인해주세요",
      fieldErrors: errors,
    };
  }

  const { title, event_date, location, description, max_participants } =
    validated.data;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      title,
      event_date: event_date || null,
      location: location || null,
      description: description || null,
      max_participants: max_participants ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("이벤트 생성 오류:", error);
    return { error: "이벤트 생성에 실패했습니다" };
  }

  redirect(`/events/${event.id}`);
}
