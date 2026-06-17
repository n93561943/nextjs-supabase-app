import { CalendarIcon, DollarSignIcon, UsersIcon } from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { createClient } from "@/lib/supabase/server";

// 관리자 대시보드 페이지 (Server Component)
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 전체 이벤트 수
  const { count: eventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true });

  // 가입 회원 수
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // 전체 정산 총액
  const { data: settlements } = await supabase
    .from("settlements")
    .select("total_amount");

  const totalSettlementAmount = (settlements ?? []).reduce(
    (sum, s) => sum + (s.total_amount ?? 0),
    0
  );

  // 정산 건수
  const settlementCount = settlements?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          서비스 전체 현황을 확인합니다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="전체 이벤트"
          value={eventCount ?? 0}
          description="생성된 모든 이벤트 수"
          icon={<CalendarIcon className="h-4 w-4" />}
        />
        <StatsCard
          title="가입 회원"
          value={userCount ?? 0}
          description="등록된 호스트 계정 수"
          icon={<UsersIcon className="h-4 w-4" />}
        />
        <StatsCard
          title="전체 정산 총액"
          value={`${totalSettlementAmount.toLocaleString("ko-KR")}원`}
          description={`정산 ${settlementCount}건 합계`}
          icon={<DollarSignIcon className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
