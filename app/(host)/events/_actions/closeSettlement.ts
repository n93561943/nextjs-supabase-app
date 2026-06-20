"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// 정산 마감 Server Action
export async function closeSettlement(
  settlementId: string,
  eventId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return { error: "로그인이 필요합니다" };
  }

  // 이벤트 호스트 검증 (settlements → events join)
  const { data: settlement } = await supabase
    .from("settlements")
    .select("id, events(host_id)")
    .eq("id", settlementId)
    .single();

  if (!settlement) {
    return { error: "정산 정보를 찾을 수 없습니다" };
  }

  // join 결과 타입 캐스팅
  const eventData = settlement.events as unknown as { host_id: string } | null;

  if (!eventData || eventData.host_id !== data.claims.sub) {
    return { error: "권한이 없습니다" };
  }

  // 정산 상태를 closed로 업데이트
  const { error: updateError } = await supabase
    .from("settlements")
    .update({ status: "closed" })
    .eq("id", settlementId);

  if (updateError) {
    console.error("정산 마감 오류:", updateError);
    return { error: "정산 마감에 실패했습니다" };
  }

  revalidatePath(`/events/${eventId}/settlement`);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
