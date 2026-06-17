"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { participantSchema } from "@/lib/validations/participant";

// 참여 신청 Server Action
export async function submitApplication(
  eventId: string,
  inviteToken: string,
  formData: FormData
) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // guest_token 쿠키 확인 — 없으면 새로 생성
  let guestToken = cookieStore.get("guest_token")?.value;
  if (!guestToken) {
    guestToken = crypto.randomUUID();
  }

  // 이벤트 존재 및 상태 확인
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, status, max_participants")
    .eq("id", eventId)
    .eq("invite_token", inviteToken)
    .single();

  if (eventError || !event) {
    return { error: "이벤트를 찾을 수 없습니다" };
  }

  if (event.status === "closed" || event.status === "cancelled") {
    return { error: "신청이 마감된 이벤트입니다" };
  }

  // 동일 guest_token으로 이미 신청했는지 확인
  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("guest_token", guestToken)
    .maybeSingle();

  if (existing) {
    return { error: "이미 신청하셨습니다" };
  }

  // 폼 데이터 파싱
  const rawData = {
    name: formData.get("name") as string,
    contact: formData.get("contact") as string,
  };

  // Zod 검증
  const validated = participantSchema.safeParse(rawData);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    return {
      error: Object.values(errors).flat()[0] ?? "입력값을 확인해주세요",
      fieldErrors: errors,
    };
  }

  const { error } = await supabase.from("participants").insert({
    event_id: eventId,
    guest_token: guestToken,
    name: validated.data.name,
    contact: validated.data.contact,
    status: "pending",
  });

  if (error) {
    console.error("참여 신청 오류:", error);
    return { error: "신청에 실패했습니다" };
  }

  revalidatePath(`/invite/${inviteToken}`);
  return { success: true, guestToken };
}
