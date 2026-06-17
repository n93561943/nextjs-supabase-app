"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createNotice } from "@/app/(host)/events/_actions/createNotice";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type NoticeFormValues, noticeSchema } from "@/lib/validations/notice";

interface NoticeFormProps {
  eventId: string;
}

export function NoticeForm({ eventId }: NoticeFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  function onSubmit(values: NoticeFormValues) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);

    startTransition(async () => {
      const result = await createNotice(eventId, formData);
      if (result.error) {
        toast.error(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              form.setError(field as keyof NoticeFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }
      } else {
        toast.success("공지가 등록되었습니다");
        form.reset();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 *</FormLabel>
              <FormControl>
                <Input placeholder="공지 제목을 입력해주세요" {...field} />
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
              <FormLabel>내용 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="공지 내용을 입력해주세요"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="mr-2 h-4 w-4" />
          )}
          공지 등록
        </Button>
      </form>
    </Form>
  );
}
