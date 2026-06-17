import {
  ArrowLeftIcon,
  BellIcon,
  CalendarIcon,
  MapPinIcon,
  ReceiptIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EventDetailActions } from "@/components/host/EventDetailActions";
import { InviteLinkCopy } from "@/components/host/InviteLinkCopy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// 이벤트 상태 배지
const statusInfo: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  open: { label: "모집중", variant: "default" },
  closed: { label: "마감", variant: "secondary" },
  cancelled: { label: "취소됨", variant: "destructive" },
};

// datetime-local input용 날짜 변환 헬퍼
function toDatetimeLocal(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  // YYYY-MM-DDTHH:mm 형식
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 이벤트 상세 페이지 (Server Component)
export default async function EventDetailPage({
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

  // 이벤트 정보 조회
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    notFound();
  }

  // 본인 이벤트인지 확인
  if (event.host_id !== authData.claims.sub) {
    redirect("/dashboard");
  }

  // 참여자 수 조회
  const { count: participantCount } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  // 공지 수 조회
  const { count: noticeCount } = await supabase
    .from("notices")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  // 정산 상태 조회
  const { data: settlement } = await supabase
    .from("settlements")
    .select("status")
    .eq("event_id", eventId)
    .maybeSingle();

  const statusBadge = statusInfo[event.status ?? "open"] ?? statusInfo["open"]!;

  // 수정 폼용 defaultValues
  const editDefaultValues = {
    title: event.title,
    event_date: toDatetimeLocal(event.event_date),
    location: event.location ?? "",
    description: event.description ?? "",
    max_participants: event.max_participants ?? undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 뒤로가기 */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            대시보드로
          </Button>
        </Link>

        {/* 이벤트 기본 정보 + 수정/상태 관리 (Client Component) */}
        <EventDetailActions
          eventId={eventId}
          event={{
            title: event.title,
            event_date: event.event_date,
            location: event.location,
            description: event.description,
            status: event.status,
          }}
          editDefaultValues={editDefaultValues}
          statusBadge={statusBadge}
          renderMeta={
            <>
              {event.event_date && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatDate(event.event_date)}
                </p>
              )}
              {event.location && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {event.location}
                </p>
              )}
              {event.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                  {event.description}
                </p>
              )}
            </>
          }
        />

        {/* 초대 링크 */}
        <div className="mb-6">
          <InviteLinkCopy inviteToken={event.invite_token} />
        </div>

        <Separator className="mb-6" />

        {/* 요약 카드 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{participantCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">신청자</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{noticeCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">공지</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {settlement
                  ? settlement.status === "closed"
                    ? "완료"
                    : "진행중"
                  : "미생성"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">정산</p>
            </CardContent>
          </Card>
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="space-y-2">
          <Card className="transition-shadow hover:shadow-md">
            <Link href={`/events/${eventId}/participants`}>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersIcon className="h-4 w-4" />
                  참여자 관리
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {participantCount ?? 0}명
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Link>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <Link href={`/events/${eventId}/notices`}>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellIcon className="h-4 w-4" />
                  공지 관리
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {noticeCount ?? 0}개
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Link>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <Link href={`/events/${eventId}/settlement`}>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ReceiptIcon className="h-4 w-4" />
                  정산 관리
                  {settlement && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {settlement.status === "closed" ? "완료" : "진행중"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
