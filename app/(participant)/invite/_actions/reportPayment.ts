"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

// 납부 자기 신고 Server Action (참여자용)
export async function reportPayment(eventId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const guestToken = cookieStore.get("guest_token")?.value;
  if (!guestToken) {
    return { error: "참여자 정보를 찾을 수 없습니다" };
  }

  // guest_token으로 참여자 조회
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("guest_token", guestToken)
    .single();

  if (participantError || !participant) {
    return { error: "참여자 정보를 찾을 수 없습니다" };
  }

  // 해당 참여자의 정산 납부 내역 조회
  const { data: payment, error: paymentError } = await supabase
    .from("settlement_payments")
    .select("id, status")
    .eq("participant_id", participant.id)
    .single();

  if (paymentError || !payment) {
    return { error: "납부 내역을 찾을 수 없습니다" };
  }

  if (payment.status === "confirmed") {
    return { error: "이미 납부 확인이 완료되었습니다" };
  }

  if (payment.status === "reported") {
    return { error: "이미 납부 신고를 하셨습니다" };
  }

  const { error: updateError } = await supabase
    .from("settlement_payments")
    .update({
      status: "reported",
      reported_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error("납부 신고 오류:", updateError);
    return { error: "납부 신고에 실패했습니다" };
  }

  revalidatePath(`/invite`);
  return { success: true };
}
