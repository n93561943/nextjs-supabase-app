"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations/event";

// 이벤트 수정 Server Action
export async function updateEvent(eventId: string, formData: FormData) {
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

  const rawData = {
    title: formData.get("title") as string,
    event_date: (formData.get("event_date") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    max_participants: (formData.get("max_participants") as string) || undefined,
  };

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

  const { error: updateError } = await supabase
    .from("events")
    .update({
      title,
      event_date: event_date || null,
      location: location || null,
      description: description || null,
      max_participants: max_participants ?? null,
    })
    .eq("id", eventId);

  if (updateError) {
    console.error("이벤트 수정 오류:", updateError);
    return { error: "이벤트 수정에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
