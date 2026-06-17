"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { submitApplication } from "@/app/(participant)/invite/_actions/submitApplication";
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
import {
  type ParticipantFormValues,
  participantSchema,
} from "@/lib/validations/participant";

interface ApplicationFormProps {
  eventId: string;
  inviteToken: string;
}

export function ApplicationForm({
  eventId,
  inviteToken,
}: ApplicationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "",
      contact: "",
    },
  });

  function onSubmit(values: ParticipantFormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("contact", values.contact);

    startTransition(async () => {
      const result = await submitApplication(eventId, inviteToken, formData);

      if (result.error) {
        setServerError(result.error);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              form.setError(field as keyof ParticipantFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }
        return;
      }

      setSubmitted(true);
    });
  }

  // 신청 완료 상태
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircleIcon className="mb-3 h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold">신청이 완료되었습니다</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          주최자 승인 후 최종 확정됩니다
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 서버 에러 메시지 */}
        {serverError && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름 *</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>연락처 *</FormLabel>
              <FormControl>
                <Input placeholder="010-1234-5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          참여 신청하기
        </Button>
      </form>
    </Form>
  );
}
