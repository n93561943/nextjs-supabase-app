import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/database.types";

interface EventCardProps {
  event: Tables<"events">;
}

// 이벤트 상태별 배지 스타일
const statusLabel: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  open: { label: "모집중", variant: "default" },
  closed: { label: "마감", variant: "secondary" },
  cancelled: { label: "취소됨", variant: "destructive" },
};

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

export function EventCard({ event }: EventCardProps) {
  const statusInfo =
    statusLabel[event.status ?? "open"] ?? statusLabel["open"]!;
  const formattedDate = formatDate(event.event_date);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">
              {event.title}
            </CardTitle>
            <Badge variant={statusInfo.variant} className="shrink-0">
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          {event.max_participants && (
            <div className="flex items-center gap-1.5">
              <UsersIcon className="h-3.5 w-3.5" />
              <span>최대 {event.max_participants}명</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
