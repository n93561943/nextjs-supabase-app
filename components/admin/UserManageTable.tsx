"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { suspendUser } from "@/app/(admin)/admin/_actions/suspendUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserRow {
  id: string;
  display_name: string | null;
  created_at: string;
  role: string | null;
  is_suspended: boolean | null;
}

interface UserManageTableProps {
  users: UserRow[];
}

// 역할 배지
function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") {
    return (
      <Badge className="border-purple-200 bg-purple-100 text-purple-800 hover:bg-purple-100">
        관리자
      </Badge>
    );
  }
  return <Badge variant="secondary">호스트</Badge>;
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 개별 사용자 행 컴포넌트 (useTransition을 행 단위로 분리)
function UserRow({ user }: { user: UserRow }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleSuspend() {
    const nextSuspend = !user.is_suspended;
    startTransition(async () => {
      const result = await suspendUser(user.id, nextSuspend);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          nextSuspend ? "회원이 정지되었습니다" : "정지가 해제되었습니다"
        );
      }
    });
  }

  return (
    <TableRow className={user.is_suspended ? "bg-muted/40 opacity-60" : ""}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {user.display_name ?? "(미설정)"}
          {user.is_suspended && (
            <Badge variant="destructive" className="text-xs">
              정지
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(user.created_at)}
      </TableCell>
      <TableCell>
        {/* 관리자 계정은 정지 버튼 미표시 */}
        {user.role !== "admin" && (
          <Button
            size="sm"
            variant={user.is_suspended ? "outline" : "ghost"}
            className={
              user.is_suspended
                ? "h-7 text-xs text-green-600 hover:bg-green-50"
                : "h-7 text-xs text-destructive hover:bg-destructive/10"
            }
            disabled={isPending}
            onClick={handleToggleSuspend}
          >
            {user.is_suspended ? "정지 해제" : "정지"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function UserManageTable({ users }: UserManageTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>회원이 없습니다</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead>관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}
