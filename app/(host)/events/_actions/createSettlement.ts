"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { settlementSchema } from "@/lib/validations/settlement";

// 정산 생성 Server Action
export async function createSettlement(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  const hostId = data.claims.sub;

  // 해당 이벤트의 주최자인지 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { error: "이벤트를 찾을 수 없습니다" };
  }

  if (event.host_id !== hostId) {
    return { error: "권한이 없습니다" };
  }

  // 이미 정산이 있는지 확인
  const { data: existing } = await supabase
    .from("settlements")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    return { error: "이미 정산이 생성되어 있습니다" };
  }

  // 폼 데이터 파싱
  const rawData = {
    total_amount: formData.get("total_amount") as string,
    bank_name: (formData.get("bank_name") as string) || undefined,
    account_number: (formData.get("account_number") as string) || undefined,
    account_holder: (formData.get("account_holder") as string) || undefined,
  };

  // Zod 검증
  const validated = settlementSchema.safeParse(rawData);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    return {
      error: Object.values(errors).flat()[0] ?? "입력값을 확인해주세요",
      fieldErrors: errors,
    };
  }

  // 승인된 참여자 수 조회
  const { data: approvedParticipants, error: participantsError } =
    await supabase
      .from("participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("status", "approved");

  if (participantsError) {
    return { error: "참여자 조회에 실패했습니다" };
  }

  const approvedCount = approvedParticipants?.length ?? 0;
  const perPersonAmount =
    approvedCount > 0
      ? Math.round(validated.data.total_amount / approvedCount)
      : validated.data.total_amount;

  // 정산 insert
  const { data: settlement, error: settlementError } = await supabase
    .from("settlements")
    .insert({
      event_id: eventId,
      total_amount: validated.data.total_amount,
      per_person_amount: perPersonAmount,
      bank_name: validated.data.bank_name || null,
      account_number: validated.data.account_number || null,
      account_holder: validated.data.account_holder || null,
      status: "open",
    })
    .select("id")
    .single();

  if (settlementError) {
    console.error("정산 생성 오류:", settlementError);
    return { error: "정산 생성에 실패했습니다" };
  }

  // 승인된 참여자 전원에 대해 settlement_payments 자동 생성
  if (approvedParticipants && approvedParticipants.length > 0) {
    const payments = approvedParticipants.map((p) => ({
      settlement_id: settlement.id,
      participant_id: p.id,
      status: "unpaid" as const,
    }));

    const { error: paymentsError } = await supabase
      .from("settlement_payments")
      .insert(payments);

    if (paymentsError) {
      console.error("납부 내역 생성 오류:", paymentsError);
      // 정산은 생성되었으나 납부 내역 생성 실패 — 경고만 반환
      revalidatePath(`/events/${eventId}/settlement`);
      return { warning: "정산은 생성됐으나 납부 내역 생성에 실패했습니다" };
    }
  }

  revalidatePath(`/events/${eventId}/settlement`);
  return { success: true };
}
