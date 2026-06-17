import { EventManageTable } from "@/components/admin/EventManageTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";

// 관리자 이벤트 목록 페이지 (Server Component)
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; status?: string }>;
}) {
  const { title, status } = await searchParams;
  const supabase = await createClient();

  // 이벤트 목록 조회 (주최자 display_name, 참여자 수 포함)
  let query = supabase
    .from("events")
    .select(
      `
      id,
      title,
      status,
      created_at,
      host_id,
      profiles(display_name)
    `
    )
    .order("created_at", { ascending: false });

  if (title) {
    query = query.ilike("title", `%${title}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: events } = await query;

  // 이벤트별 참여자 수 조회
  const eventIds = (events ?? []).map((e) => e.id);
  const participantCounts: Record<string, number> = {};

  if (eventIds.length > 0) {
    const { data: counts } = await supabase
      .from("participants")
      .select("event_id")
      .in("event_id", eventIds);

    for (const row of counts ?? []) {
      participantCounts[row.event_id] =
        (participantCounts[row.event_id] ?? 0) + 1;
    }
  }

  // 테이블용 데이터 가공
  const tableEvents = (events ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    created_at: event.created_at,
    host_display_name:
      (event.profiles as unknown as { display_name: string | null } | null)
        ?.display_name ?? null,
    participant_count: participantCounts[event.id] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">이벤트 관리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          전체 {tableEvents.length}개의 이벤트
        </p>
      </div>

      {/* 검색/필터 — URL searchParams 기반 (form submit) */}
      <form className="mb-6 flex gap-2" method="get">
        <Input
          name="title"
          placeholder="이벤트 제목 검색"
          defaultValue={title ?? ""}
          className="max-w-xs"
        />
        <Select name="status" defaultValue={status ?? "all"}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="open">모집중</SelectItem>
            <SelectItem value="closed">마감</SelectItem>
            <SelectItem value="cancelled">취소됨</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          검색
        </button>
      </form>

      {/* 이벤트 테이블 */}
      <EventManageTable events={tableEvents} />
    </div>
  );
}
