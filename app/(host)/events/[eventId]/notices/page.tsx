import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { NoticeForm } from "@/components/host/NoticeForm";
import { NoticeList } from "@/components/host/NoticeList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

// 공지 관리 페이지 (Server Component)
export default async function NoticesPage({
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

  // 공지 목록 조회 (최신순)
  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .eq("event_id", eventId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

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
          <h1 className="text-xl font-bold">공지 관리</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{event.title}</p>
        </div>

        {/* 공지 작성 폼 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">새 공지 작성</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <NoticeForm eventId={eventId} />
          </CardContent>
        </Card>

        {/* 공지 목록 */}
        <div>
          <h2 className="mb-3 font-semibold">
            공지 목록{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({notices?.length ?? 0}개)
            </span>
          </h2>
          <NoticeList notices={notices ?? []} eventId={eventId} isHost={true} />
        </div>
      </div>
    </div>
  );
}
