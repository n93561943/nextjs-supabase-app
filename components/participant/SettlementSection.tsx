import { BanknoteIcon } from "lucide-react";
import { cookies } from "next/headers";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

import { ReportPaymentButton } from "./ReportPaymentButton";

interface SettlementSectionProps {
  eventId: string;
}

// 금액 포맷 헬퍼
function formatAmount(amount: number | null) {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

// 참여자용 정산 섹션 (Server Component)
export async function SettlementSection({ eventId }: SettlementSectionProps) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const guestToken = cookieStore.get("guest_token")?.value;

  const { data: settlement } = await supabase
    .from("settlements")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  // 정산이 없으면 섹션 미표시
  if (!settlement) {
    return null;
  }

  const hasAccountInfo = settlement.bank_name || settlement.account_number;

  // 현재 참여자의 납부 상태 조회 (guest_token이 있는 경우)
  let paymentStatus: string | null = null;
  if (guestToken) {
    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (participant) {
      const { data: payment } = await supabase
        .from("settlement_payments")
        .select("status")
        .eq("participant_id", participant.id)
        .maybeSingle();

      paymentStatus = payment?.status ?? null;
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 font-semibold">
        <BanknoteIcon className="h-4 w-4" />
        정산 안내
      </h3>
      <Card>
        <CardContent className="space-y-3 pt-4">
          {/* 1인당 금액 */}
          <div className="py-2 text-center">
            <p className="text-xs text-muted-foreground">1인당 납부 금액</p>
            <p className="mt-1 text-2xl font-bold">
              {formatAmount(settlement.per_person_amount)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              총 {formatAmount(settlement.total_amount)}
            </p>
          </div>

          {/* 계좌 정보 */}
          {hasAccountInfo && (
            <>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  입금 계좌
                </p>
                {settlement.bank_name && (
                  <p>
                    <span className="text-muted-foreground">은행: </span>
                    {settlement.bank_name}
                  </p>
                )}
                {settlement.account_number && (
                  <p className="font-mono">
                    <span className="font-sans text-muted-foreground">
                      계좌:{" "}
                    </span>
                    {settlement.account_number}
                  </p>
                )}
                {settlement.account_holder && (
                  <p>
                    <span className="text-muted-foreground">예금주: </span>
                    {settlement.account_holder}
                  </p>
                )}
              </div>
            </>
          )}

          {/* 납부 신고 버튼 (참여자에게만 표시) */}
          {guestToken && paymentStatus !== null && (
            <>
              <Separator />
              <ReportPaymentButton
                eventId={eventId}
                paymentStatus={paymentStatus}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
