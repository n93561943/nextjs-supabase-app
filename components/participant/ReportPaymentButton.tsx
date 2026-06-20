"use client";

import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { reportPayment } from "@/app/(participant)/invite/_actions/reportPayment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReportPaymentButtonProps {
  eventId: string;
  paymentStatus: string | null;
  settlementStatus: "open" | "closed";
}

// 납부 신고 버튼 (참여자용 Client Component)
export function ReportPaymentButton({
  eventId,
  paymentStatus,
  settlementStatus,
}: ReportPaymentButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleReport() {
    startTransition(async () => {
      const result = await reportPayment(eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("납부 신고가 완료되었습니다");
      }
    });
  }

  // 납부 확인 완료
  if (paymentStatus === "confirmed") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-sm text-green-600">
        <CheckCircleIcon className="h-4 w-4" />
        <span>납부 확인 완료</span>
      </div>
    );
  }

  // 납부 신고 완료 (주최자 확인 대기 중)
  if (paymentStatus === "reported") {
    return (
      <div className="text-center">
        <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100">
          납부 신고 완료 — 주최자 확인 대기 중
        </Badge>
      </div>
    );
  }

  // 정산 마감 상태
  if (settlementStatus === "closed") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">정산이 마감되었습니다</p>
      </div>
    );
  }

  return (
    <Button className="w-full" onClick={handleReport} disabled={isPending}>
      {isPending ? (
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircleIcon className="mr-2 h-4 w-4" />
      )}
      납부했어요
    </Button>
  );
}
