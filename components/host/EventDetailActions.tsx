"use client";

import { PencilIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateEventStatus } from "@/app/(host)/events/_actions/updateEventStatus";
import { EventForm } from "@/components/host/EventForm";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EventFormValues } from "@/lib/validations/event";

interface EventDetailActionsProps {
  eventId: string;
  event: {
    title: string;
    event_date: string | null;
    location: string | null;
    description: string | null;
    status: string | null;
  };
  editDefaultValues: Partial<EventFormValues>;
  statusBadge: {
    label: string;
    variant: "default" | "secondary" | "destructive";
  };
  renderMeta: React.ReactNode;
}

// 이벤트 상세 페이지의 수정/상태 관리 Client Component
export function EventDetailActions({
  eventId,
  event,
  editDefaultValues,
  statusBadge,
  renderMeta,
}: EventDetailActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: "open" | "closed" | "cancelled") {
    startTransition(async () => {
      const result = await updateEventStatus(eventId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        const messages = {
          open: "이벤트가 모집 중으로 변경되었습니다",
          closed: "이벤트가 마감되었습니다",
          cancelled: "이벤트가 취소되었습니다",
        };
        toast.success(messages[status]);
      }
    });
  }

  const currentStatus = event.status ?? "open";

  return (
    <div className="mb-6">
      {isEditing ? (
        /* 수정 폼 */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">이벤트 수정</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <EventForm
              mode="update"
              eventId={eventId}
              defaultValues={editDefaultValues}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        /* 이벤트 기본 정보 */
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="shrink-0"
            >
              <PencilIcon className="mr-1 h-4 w-4" />
              수정
            </Button>
          </div>
          {renderMeta}

          {/* 상태 변경 버튼 */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {currentStatus !== "open" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleStatusChange("open")}
              >
                모집 재개
              </Button>
            )}
            {currentStatus !== "closed" && currentStatus !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleStatusChange("closed")}
              >
                모집 마감
              </Button>
            )}
            {currentStatus !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={isPending}
                  >
                    이벤트 취소
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      이벤트를 취소하시겠습니까?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      이벤트를 취소하면 참여자들이 초대 링크에 접근할 수 없게
                      됩니다. 이 작업은 되돌릴 수 있습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>아니오</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleStatusChange("cancelled")}
                    >
                      취소하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
