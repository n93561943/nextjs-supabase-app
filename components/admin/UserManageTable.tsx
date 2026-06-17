import { Badge } from "@/components/ui/badge";
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.display_name ?? "(미설정)"}
            </TableCell>
            <TableCell>
              <RoleBadge role={user.role} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(user.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
