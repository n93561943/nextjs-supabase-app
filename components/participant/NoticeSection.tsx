import { BellIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

interface NoticeSectionProps {
  eventId: string;
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

// 참여자용 공지 섹션 (Server Component)
export async function NoticeSection({ eventId }: NoticeSectionProps) {
  const supabase = await createClient();

  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, content, created_at, is_pinned")
    .eq("event_id", eventId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!notices || notices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 font-semibold">
        <BellIcon className="h-4 w-4" />
        공지사항
      </h3>
      <div className="space-y-3">
        {notices.map((notice) => (
          <Card key={notice.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium">
                  {notice.title}
                </CardTitle>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {formatDate(notice.created_at)}
                </span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3">
              <p className="whitespace-pre-wrap text-sm text-foreground/80">
                {notice.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
