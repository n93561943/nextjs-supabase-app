"use client";

import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { removeParticipant } from "@/app/(host)/events/_actions/removeParticipant";
import { updateParticipantStatus } from "@/app/(host)/events/_actions/updateParticipantStatus";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database.types";

import { ParticipantStatusBadge } from "./ParticipantStatusBadge";

interface ParticipantListProps {
  participants: Tables<"participants">[];
  eventId: string;
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 개별 참여자 행 컴포넌트 (각 행이 별도의 pending 상태를 가짐)
function ParticipantRow({
  participant,
  eventId,
}: {
  participant: Tables<"participants">;
  eventId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleUpdate(status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await updateParticipantStatus(participant.id, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          status === "approved" ? "승인되었습니다" : "거절되었습니다"
        );
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeParticipant(participant.id, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("참여자가 삭제되었습니다");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{participant.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {participant.contact}
      </TableCell>
      <TableCell>{formatDate(participant.created_at)}</TableCell>
      <TableCell>
        <ParticipantStatusBadge status={participant.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {participant.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                disabled={isPending}
                onClick={() => handleUpdate("approved")}
              >
                <CheckIcon className="mr-1 h-3.5 w-3.5" />
                승인
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={() => handleUpdate("rejected")}
              >
                <XIcon className="mr-1 h-3.5 w-3.5" />
                거절
              </Button>
            </>
          )}
          {/* 강제 삭제 버튼 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={isPending}
                aria-label="참여자 삭제"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>참여자를 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-semibold">{participant.name}</span>님을
                  참여자 목록에서 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleRemove}
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

export function ParticipantList({
  participants,
  eventId,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <p>참여자가 없습니다</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>신청일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            eventId={eventId}
          />
        ))}
      </TableBody>
    </Table>
  );
}
