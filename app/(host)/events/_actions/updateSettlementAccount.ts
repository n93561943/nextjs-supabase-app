"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 계좌 정보 수정 Server Action
export async function updateSettlementAccount(
  settlementId: string,
  eventId: string,
  formData: FormData
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

  const bankName = (formData.get("bank_name") as string) || null;
  const accountNumber = (formData.get("account_number") as string) || null;
  const accountHolder = (formData.get("account_holder") as string) || null;

  const { error: updateError } = await supabase
    .from("settlements")
    .update({
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
    })
    .eq("id", settlementId);

  if (updateError) {
    console.error("계좌 정보 수정 오류:", updateError);
    return { error: "계좌 정보 수정에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/settlement`);
  return { success: true };
}
