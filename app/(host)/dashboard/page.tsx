import { CalendarPlusIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EventCard } from "@/components/host/EventCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// 주최자 대시보드 페이지 (Server Component)
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const hostId = data.claims.sub;

  // 본인이 주최한 이벤트 목록 조회 (최신순)
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("이벤트 목록 조회 오류:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <LayoutDashboardIcon className="h-5 w-5" />
            대시보드
          </h1>
          <Link href="/events/new">
            <Button size="sm">
              <CalendarPlusIcon className="mr-1.5 h-4 w-4" />
              이벤트 만들기
            </Button>
          </Link>
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {!events || events.length === 0 ? (
          /* 빈 상태 UI */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarPlusIcon className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">아직 만든 이벤트가 없어요</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              첫 번째 이벤트를 만들고 참여자를 초대해보세요
            </p>
            <Link href="/events/new" className="mt-6">
              <Button>
                <CalendarPlusIcon className="mr-1.5 h-4 w-4" />첫 이벤트 만들기
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                총 {events.length}개의 이벤트
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
