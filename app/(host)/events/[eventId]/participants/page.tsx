import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ParticipantList } from "@/components/host/ParticipantList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

// 참여자 관리 페이지 (Server Component)
// URL searchParams의 tab으로 필터 상태 관리
export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "pending";

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

  // 참여자 전체 조회
  const { data: allParticipants } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const participants = allParticipants ?? [];

  // 상태별 필터링
  const pending = participants.filter((p) => p.status === "pending");
  const approved = participants.filter((p) => p.status === "approved");
  const rejected = participants.filter((p) => p.status === "rejected");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* 헤더 */}
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="sm" className="-ml-2 mb-6">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            이벤트로 돌아가기
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold">참여자 관리</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{event.title}</p>
        </div>

        {/* 상태별 탭 — URL searchParams로 상태 관리 */}
        <Tabs defaultValue={activeTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" asChild>
              <Link href={`/events/${eventId}/participants?tab=pending`}>
                대기 ({pending.length})
              </Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href={`/events/${eventId}/participants?tab=approved`}>
                승인 ({approved.length})
              </Link>
            </TabsTrigger>
            <TabsTrigger value="rejected" asChild>
              <Link href={`/events/${eventId}/participants?tab=rejected`}>
                거절 ({rejected.length})
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ParticipantList participants={pending} eventId={eventId} />
          </TabsContent>
          <TabsContent value="approved">
            <ParticipantList participants={approved} eventId={eventId} />
          </TabsContent>
          <TabsContent value="rejected">
            <ParticipantList participants={rejected} eventId={eventId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
