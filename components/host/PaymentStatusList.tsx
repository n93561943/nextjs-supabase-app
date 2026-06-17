"use client";

import { CheckIcon, CheckSquareIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  confirmAllPayments,
  confirmPayment,
} from "@/app/(host)/events/_actions/confirmPayment";
import { updateSettlementAccount } from "@/app/(host)/events/_actions/updateSettlementAccount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database.types";

interface PaymentWithParticipant extends Tables<"settlement_payments"> {
  participants: Pick<Tables<"participants">, "name" | "contact"> | null;
}

interface PaymentStatusListProps {
  payments: PaymentWithParticipant[];
  settlement: Tables<"settlements">;
  eventId: string;
}

// 납부 상태 배지
function PaymentBadge({ status }: { status: string | null }) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
          확인완료
        </Badge>
      );
    case "reported":
      return (
        <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100">
          납부신고
        </Badge>
      );
    case "unpaid":
    default:
      return <Badge variant="secondary">미납</Badge>;
  }
}

// 금액 포맷 헬퍼
function formatAmount(amount: number | null) {
  if (amount === null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 계좌 정보 수정 폼 컴포넌트
function AccountEditForm({
  settlement,
  eventId,
  onClose,
}: {
  settlement: Tables<"settlements">;
  eventId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettlementAccount(
        settlement.id,
        eventId,
        formData
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("계좌 정보가 수정되었습니다");
        onClose();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="bank_name">은행명</Label>
        <Input
          id="bank_name"
          name="bank_name"
          placeholder="예) 카카오뱅크"
          defaultValue={settlement.bank_name ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account_number">계좌번호</Label>
        <Input
          id="account_number"
          name="account_number"
          placeholder="예) 1234-56-789012"
          defaultValue={settlement.account_number ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account_holder">예금주</Label>
        <Input
          id="account_holder"
          name="account_holder"
          placeholder="예) 홍길동"
          defaultValue={settlement.account_holder ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

export function PaymentStatusList({
  payments,
  settlement,
  eventId,
}: PaymentStatusListProps) {
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 상태별 통계
  const unpaidCount = payments.filter((p) => p.status === "unpaid").length;
  const reportedCount = payments.filter((p) => p.status === "reported").length;
  const confirmedCount = payments.filter(
    (p) => p.status === "confirmed"
  ).length;

  function handleConfirm(paymentId: string) {
    startTransition(async () => {
      const result = await confirmPayment(paymentId, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("납부가 확인되었습니다");
      }
    });
  }

  function handleConfirmAll() {
    startTransition(async () => {
      const result = await confirmAllPayments(settlement.id, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("전체 납부가 확인되었습니다");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* 납부 현황 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{unpaidCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">미납</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{reportedCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">납부신고</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">확인완료</p>
        </div>
      </div>

      {/* 전체 확인 버튼 */}
      {reportedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={handleConfirmAll}
        >
          <CheckSquareIcon className="mr-2 h-4 w-4" />
          납부신고 전체 확인 ({reportedCount}건)
        </Button>
      )}

      {/* 계좌 정보 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">입금 계좌</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsEditingAccount(!isEditingAccount)}
            >
              {isEditingAccount ? "취소" : "수정"}
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-3">
          {isEditingAccount ? (
            <AccountEditForm
              settlement={settlement}
              eventId={eventId}
              onClose={() => setIsEditingAccount(false)}
            />
          ) : (
            <div className="space-y-1 text-sm">
              {settlement.bank_name ||
              settlement.account_number ||
              settlement.account_holder ? (
                <>
                  {settlement.bank_name && (
                    <p className="text-muted-foreground">
                      은행: {settlement.bank_name}
                    </p>
                  )}
                  {settlement.account_number && (
                    <p className="text-muted-foreground">
                      계좌번호: {settlement.account_number}
                    </p>
                  )}
                  {settlement.account_holder && (
                    <p className="text-muted-foreground">
                      예금주: {settlement.account_holder}
                    </p>
                  )}
                  <p className="mt-2 font-medium">
                    1인당 금액: {formatAmount(settlement.per_person_amount)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  계좌 정보가 없습니다. 수정 버튼을 눌러 입력하세요.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 참여자별 납부 목록 */}
      {payments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>납부 내역이 없습니다</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>신고일</TableHead>
              <TableHead>확인일</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.participants?.name ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.participants?.contact ?? "-"}
                </TableCell>
                <TableCell>
                  <PaymentBadge status={payment.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(payment.reported_at)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(payment.confirmed_at)}
                </TableCell>
                <TableCell>
                  {payment.status === "reported" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-green-600 text-xs text-green-600 hover:bg-green-50"
                      disabled={isPending}
                      onClick={() => handleConfirm(payment.id)}
                    >
                      <CheckIcon className="mr-1 h-3 w-3" />
                      확인
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
