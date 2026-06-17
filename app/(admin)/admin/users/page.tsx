import { UserManageTable } from "@/components/admin/UserManageTable";
import { createClient } from "@/lib/supabase/server";

// 관리자 회원 목록 페이지 (Server Component)
export default async function AdminUsersPage() {
  const supabase = await createClient();

  // profiles 테이블 조회
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, role")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          전체 {profiles?.length ?? 0}명의 회원
        </p>
      </div>

      <UserManageTable users={profiles ?? []} />
    </div>
  );
}
