"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 납부 확인 Server Action (주최자용)
export async function confirmPayment(paymentId: string, eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 이벤트 주최자 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event || event.host_id !== data.claims.sub) {
    return { error: "권한이 없습니다" };
  }

  const { error: updateError } = await supabase
    .from("settlement_payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updateError) {
    console.error("납부 확인 오류:", updateError);
    return { error: "납부 확인에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/settlement`);
  return { success: true };
}

// 전체 납부 일괄 확인 Server Action (주최자용)
export async function confirmAllPayments(
  settlementId: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 이벤트 주최자 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event || event.host_id !== data.claims.sub) {
    return { error: "권한이 없습니다" };
  }

  // reported 상태인 납부 내역 모두 confirmed로 변경
  const { error: updateError } = await supabase
    .from("settlement_payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("settlement_id", settlementId)
    .eq("status", "reported");

  if (updateError) {
    console.error("전체 납부 확인 오류:", updateError);
    return { error: "전체 납부 확인에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/settlement`);
  return { success: true };
}
