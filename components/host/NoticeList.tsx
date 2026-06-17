"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BellIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteNotice } from "@/app/(host)/events/_actions/deleteNotice";
import { toggleNoticePin } from "@/app/(host)/events/_actions/toggleNoticePin";
import { updateNotice } from "@/app/(host)/events/_actions/updateNotice";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type NoticeFormValues, noticeSchema } from "@/lib/validations/notice";
import type { Tables } from "@/types/database.types";

interface NoticeListProps {
  notices: Tables<"notices">[];
  eventId: string;
  isHost?: boolean;
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 개별 공지 카드 컴포넌트
function NoticeCard({
  notice,
  eventId,
  isHost,
}: {
  notice: Tables<"notices">;
  eventId: string;
  isHost: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice.title,
      content: notice.content,
    },
  });

  function handlePin() {
    startTransition(async () => {
      const result = await toggleNoticePin(notice.id, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.isPinned ? "공지가 핀 고정되었습니다" : "핀이 해제되었습니다"
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNotice(notice.id, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("공지가 삭제되었습니다");
      }
    });
  }

  function onEditSubmit(values: NoticeFormValues) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);

    startTransition(async () => {
      const result = await updateNotice(notice.id, eventId, formData);
      if (result.error) {
        if (result.fieldErrors) {
          const { fieldErrors } = result;
          (Object.keys(fieldErrors) as (keyof NoticeFormValues)[]).forEach(
            (field) => {
              const messages = fieldErrors[field];
              if (messages?.[0]) {
                form.setError(field, { type: "server", message: messages[0] });
              }
            }
          );
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success("공지가 수정되었습니다");
        setIsEditing(false);
      }
    });
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            공지 수정
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-3">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending}>
                  저장
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  취소
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={notice.is_pinned ? "border-primary/40" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {notice.is_pinned && (
              <PinIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            <CardTitle className="truncate text-base">{notice.title}</CardTitle>
            {notice.is_pinned && (
              <Badge variant="outline" className="shrink-0 text-xs">
                고정
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">
              {formatDate(notice.created_at)}
            </span>
            {isHost && (
              <>
                {/* 핀 토글 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  disabled={isPending}
                  onClick={handlePin}
                  title={notice.is_pinned ? "핀 해제" : "핀 고정"}
                >
                  {notice.is_pinned ? (
                    <PinOffIcon className="h-3.5 w-3.5" />
                  ) : (
                    <PinIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
                {/* 수정 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                  onClick={() => setIsEditing(true)}
                  title="수정"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                {/* 삭제 */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      title="삭제"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        공지를 삭제하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다.
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
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <p className="whitespace-pre-wrap text-sm text-foreground/80">
          {notice.content}
        </p>
      </CardContent>
    </Card>
  );
}

export function NoticeList({
  notices,
  eventId,
  isHost = false,
}: NoticeListProps) {
  if (notices.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <BellIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
        <p>등록된 공지가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <NoticeCard
          key={notice.id}
          notice={notice}
          eventId={eventId}
          isHost={isHost}
        />
      ))}
    </div>
  );
}
