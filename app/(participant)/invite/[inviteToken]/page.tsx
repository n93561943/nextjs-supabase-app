import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { Suspense } from "react";

import { ApplicationForm } from "@/components/participant/ApplicationForm";
import { NoticeSection } from "@/components/participant/NoticeSection";
import { SettlementSection } from "@/components/participant/SettlementSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 실제 데이터 패칭 및 렌더링 — Suspense 경계 내부에서 실행
// params Promise를 직접 받아서 Suspense 내부에서 await
async function InviteContent({
  params,
}: {
  params: Promise<{ inviteToken: string }>;
}) {
  const { inviteToken } = await params;
  const supabase = await createClient();

  // invite_token으로 이벤트 조회
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("invite_token", inviteToken)
    .single();

  // 이벤트가 없거나 취소된 경우
  if (error || !event || event.status === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md py-12 text-center">
          <p className="mb-4 text-4xl">🔍</p>
          <h1 className="text-xl font-bold">이벤트를 찾을 수 없습니다</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            링크가 잘못되었거나 취소된 이벤트입니다
          </p>
        </div>
      </div>
    );
  }

  // 현재 승인된 참여자 수 조회
  const { count: approvedCount } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "approved");

  const isClosed = event.status === "closed";
  const isFull =
    event.max_participants !== null &&
    (approvedCount ?? 0) >= event.max_participants;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md space-y-6 px-4 py-8">
        {/* 이벤트 정보 카드 */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start gap-2">
              <CardTitle className="text-xl leading-tight">
                {event.title}
              </CardTitle>
              {isClosed && (
                <Badge variant="secondary" className="shrink-0">
                  마감
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {event.event_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span>{formatDate(event.event_date)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinIcon className="h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.max_participants && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UsersIcon className="h-4 w-4 shrink-0" />
                <span>
                  {approvedCount ?? 0} / {event.max_participants}명 참여중
                </span>
              </div>
            )}
            {event.description && (
              <>
                <Separator className="my-2" />
                <p className="whitespace-pre-wrap text-foreground/80">
                  {event.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 신청 폼 또는 마감 안내 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isClosed || isFull ? "신청 마감" : "참여 신청"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="py-4 text-center text-muted-foreground">
                <p className="text-sm">이 이벤트는 신청이 마감되었습니다</p>
              </div>
            ) : isFull ? (
              <div className="py-4 text-center text-muted-foreground">
                <p className="text-sm">모집 인원이 가득 찼습니다</p>
              </div>
            ) : (
              <ApplicationForm eventId={event.id} inviteToken={inviteToken} />
            )}
          </CardContent>
        </Card>

        {/* 공지사항 섹션 */}
        <NoticeSection eventId={event.id} />

        {/* 정산 안내 섹션 */}
        <SettlementSection eventId={event.id} />
      </div>
    </div>
  );
}

// 참여자용 초대 페이지 (Server Component, 모바일 우선)
// params를 Suspense 내부로 전달하여 cacheComponents 환경에서 동적 렌더링 허용
export default function InvitePage({
  params,
}: {
  params: Promise<{ inviteToken: string }>;
}) {
  return (
    <Suspense>
      <InviteContent params={params} />
    </Suspense>
  );
}
