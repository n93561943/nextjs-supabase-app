import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { EventForm } from "@/components/host/EventForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 이벤트 생성 페이지
export default function EventNewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 뒤로가기 */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            대시보드로
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>새 이벤트 만들기</CardTitle>
            <CardDescription>
              이벤트 정보를 입력하면 초대 링크가 자동으로 생성됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
