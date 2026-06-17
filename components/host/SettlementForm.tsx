"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createSettlement } from "@/app/(host)/events/_actions/createSettlement";
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
import {
  type SettlementFormValues,
  settlementSchema,
} from "@/lib/validations/settlement";

interface SettlementFormProps {
  eventId: string;
  approvedCount: number;
}

// 금액 포맷 헬퍼
function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

export function SettlementForm({
  eventId,
  approvedCount,
}: SettlementFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      total_amount: 0 as number,
      bank_name: "",
      account_number: "",
      account_holder: "",
    },
  });

  // 총 금액 실시간 감지로 1인당 금액 미리보기
  const totalAmount = useWatch({
    control: form.control,
    name: "total_amount",
  }) as number;
  const perPersonPreview =
    approvedCount > 0 && totalAmount > 0
      ? Math.round(Number(totalAmount) / approvedCount)
      : null;

  function onSubmit(values: SettlementFormValues) {
    const formData = new FormData();
    formData.append("total_amount", String(values.total_amount));
    if (values.bank_name) formData.append("bank_name", values.bank_name);
    if (values.account_number)
      formData.append("account_number", values.account_number);
    if (values.account_holder)
      formData.append("account_holder", values.account_holder);

    startTransition(async () => {
      const result = await createSettlement(eventId, formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("정산이 생성되었습니다");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 총 금액 */}
        <FormField
          control={form.control}
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>총 금액 (원) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="예) 150000"
                  value={
                    (field.value as number) === 0 ? "" : (field.value as number)
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              {/* 1인당 금액 미리보기 */}
              {perPersonPreview !== null && (
                <FormDescription>
                  {approvedCount}명 기준 1인당{" "}
                  <span className="font-semibold text-foreground">
                    {formatAmount(perPersonPreview)}원
                  </span>
                </FormDescription>
              )}
              {approvedCount === 0 && (
                <FormDescription className="text-amber-600">
                  승인된 참여자가 없어 1인당 금액을 계산할 수 없습니다
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 은행명 */}
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>은행명</FormLabel>
              <FormControl>
                <Input placeholder="예) 카카오뱅크" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 계좌번호 */}
        <FormField
          control={form.control}
          name="account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>계좌번호</FormLabel>
              <FormControl>
                <Input placeholder="예) 1234-56-789012" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 예금주 */}
        <FormField
          control={form.control}
          name="account_holder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>예금주</FormLabel>
              <FormControl>
                <Input placeholder="예) 홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          정산 생성
        </Button>
      </form>
    </Form>
  );
}
