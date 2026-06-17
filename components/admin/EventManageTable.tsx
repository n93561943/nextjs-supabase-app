"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { forceDeleteEvent } from "@/app/(admin)/admin/_actions/forceDeleteEvent";
import { forceUpdateEventStatus } from "@/app/(admin)/admin/_actions/forceUpdateEventStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EventRow {
  id: string;
  title: string;
  status: string | null;
  created_at: string | null;
  host_display_name: string | null;
  participant_count: number;
}

interface EventManageTableProps {
  events: EventRow[];
}

// 상태 배지
function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "open":
      return <Badge>모집중</Badge>;
    case "closed":
      return <Badge variant="secondary">마감</Badge>;
    case "cancelled":
      return <Badge variant="destructive">취소됨</Badge>;
    default:
      return <Badge variant="secondary">{status ?? "-"}</Badge>;
  }
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 개별 이벤트 행
function EventRow({ event }: { event: EventRow }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await forceUpdateEventStatus(
        event.id,
        status as "open" | "closed" | "cancelled"
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("상태가 변경되었습니다");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await forceDeleteEvent(event.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("이벤트가 삭제되었습니다");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="max-w-[200px] truncate font-medium">
        {event.title}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {event.host_display_name ?? "-"}
      </TableCell>
      <TableCell>
        <StatusBadge status={event.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {event.participant_count}명
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(event.created_at)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {/* 상태 변경 드롭다운 */}
          <Select
            defaultValue={event.status ?? "open"}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">모집중</SelectItem>
              <SelectItem value="closed">마감</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>

          {/* 강제 삭제 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                disabled={isPending}
              >
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>이벤트를 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-semibold">{event.title}</span>와 관련된
                  모든 데이터(참여자, 공지, 정산)가 영구적으로 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function EventManageTable({ events }: EventManageTableProps) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>이벤트가 없습니다</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>주최자</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>참여자</TableHead>
          <TableHead>생성일</TableHead>
          <TableHead>관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </TableBody>
    </Table>
  );
}
