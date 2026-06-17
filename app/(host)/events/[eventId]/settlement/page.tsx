import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PaymentStatusList } from "@/components/host/PaymentStatusList";
import { SettlementForm } from "@/components/host/SettlementForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

// 정산 관리 페이지 (Server Component)
export default async function SettlementPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims) {
    redirect("/auth/login");
  }

  // 이벤트 주최자 검증
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, host_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  if (event.host_id !== authData.claims.sub) {
    redirect("/dashboard");
  }

  // 정산 조회
  const { data: settlement } = await supabase
    .from("settlements")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  // 승인된 참여자 수 조회 (정산 생성 폼의 1인당 미리보기용)
  const { count: approvedCount } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "approved");

  // 정산이 있는 경우 납부 현황 조회
  let payments: Array<
    Tables<"settlement_payments"> & {
      participants: Pick<Tables<"participants">, "name" | "contact"> | null;
    }
  > = [];
  if (settlement) {
    const { data: paymentsData } = await supabase
      .from("settlement_payments")
      .select("*, participants(name, contact)")
      .eq("settlement_id", settlement.id)
      .order("created_at", { ascending: true });

    payments = (paymentsData ?? []) as typeof payments;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 헤더 */}
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="sm" className="-ml-2 mb-6">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            이벤트로 돌아가기
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold">정산 관리</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{event.title}</p>
        </div>

        {settlement ? (
          /* 정산이 이미 생성된 경우 — 납부 현황 표시 */
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                총 금액: {settlement.total_amount.toLocaleString("ko-KR")}원
              </p>
              <p className="text-muted-foreground">
                1인당:{" "}
                {settlement.per_person_amount?.toLocaleString("ko-KR") ?? "-"}원
              </p>
            </div>
            <PaymentStatusList
              payments={payments}
              settlement={settlement}
              eventId={eventId}
            />
          </div>
        ) : (
          /* 정산 미생성 — 생성 폼 표시 */
          <Card>
            <CardHeader>
              <CardTitle className="text-base">정산 생성</CardTitle>
              <CardDescription>
                승인된 참여자 ({approvedCount ?? 0}명) 기준으로 1인당 금액이
                계산됩니다
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <SettlementForm
                eventId={eventId}
                approvedCount={approvedCount ?? 0}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
