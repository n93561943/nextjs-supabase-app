import { Badge } from "@/components/ui/badge";

interface ParticipantStatusBadgeProps {
  status: string | null;
}

// 참여자 상태별 배지
export function ParticipantStatusBadge({
  status,
}: ParticipantStatusBadgeProps) {
  switch (status) {
    case "approved":
      return (
        <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
          승인됨
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">거절됨</Badge>;
    case "pending":
    default:
      return <Badge variant="secondary">대기중</Badge>;
  }
}
