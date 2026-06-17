"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEvent } from "@/app/(host)/events/_actions/createEvent";
import { updateEvent } from "@/app/(host)/events/_actions/updateEvent";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type EventFormValues, eventSchema } from "@/lib/validations/event";

interface EventFormProps {
  mode?: "create" | "update";
  eventId?: string;
  defaultValues?: Partial<EventFormValues>;
  onSuccess?: () => void;
}

export function EventForm({
  mode = "create",
  eventId,
  defaultValues,
  onSuccess,
}: EventFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      event_date: defaultValues?.event_date ?? "",
      location: defaultValues?.location ?? "",
      description: defaultValues?.description ?? "",
      max_participants: defaultValues?.max_participants,
    },
  });

  function onSubmit(values: EventFormValues) {
    const formData = new FormData();
    formData.append("title", values.title);
    if (values.event_date) formData.append("event_date", values.event_date);
    if (values.location) formData.append("location", values.location);
    if (values.description) formData.append("description", values.description);
    if (values.max_participants !== undefined) {
      formData.append("max_participants", String(values.max_participants));
    }

    startTransition(async () => {
      if (mode === "update" && eventId) {
        const result = await updateEvent(eventId, formData);
        if (result?.error) {
          if (result.fieldErrors) {
            const { fieldErrors } = result;
            (Object.keys(fieldErrors) as (keyof EventFormValues)[]).forEach(
              (field) => {
                const messages = fieldErrors[field];
                if (messages?.[0]) {
                  form.setError(field, {
                    type: "server",
                    message: messages[0],
                  });
                }
              }
            );
          } else {
            toast.error(result.error);
          }
        } else {
          toast.success("이벤트가 수정되었습니다");
          onSuccess?.();
        }
      } else {
        const result = await createEvent(formData);
        // createEvent는 성공 시 redirect, 실패 시 fieldErrors 반환
        if (result?.fieldErrors) {
          const { fieldErrors } = result;
          (Object.keys(fieldErrors) as (keyof EventFormValues)[]).forEach(
            (field) => {
              const messages = fieldErrors[field];
              if (messages?.[0]) {
                form.setError(field, { type: "server", message: messages[0] });
              }
            }
          );
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 제목 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이벤트 제목 *</FormLabel>
              <FormControl>
                <Input placeholder="예) 2024 신년 모임" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 날짜/시간 */}
        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>날짜 및 시간</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 장소 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장소</FormLabel>
              <FormControl>
                <Input placeholder="예) 강남역 2번 출구 카페" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 설명 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="모임에 대한 설명을 입력해주세요"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 최대 인원 */}
        <FormField
          control={form.control}
          name="max_participants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>최대 인원</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="예) 20"
                  value={(field.value as number | undefined) ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FormControl>
              <FormDescription>비워두면 인원 제한 없음</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "update" ? "이벤트 수정" : "이벤트 생성"}
          </Button>
          {mode === "update" && onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={isPending}
            >
              취소
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
