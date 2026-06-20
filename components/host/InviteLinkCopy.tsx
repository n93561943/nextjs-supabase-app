"use client";

import { CheckIcon, CopyIcon, LinkIcon, RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { regenerateInviteToken } from "@/app/(host)/events/_actions/regenerateInviteToken";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteLinkCopyProps {
  inviteToken: string;
  eventId: string;
}

// 초대 링크 복사 및 재발급 컴포넌트
export function InviteLinkCopy({ inviteToken, eventId }: InviteLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState(inviteToken);
  const [isPending, startTransition] = useTransition();

  const invitePath = `/invite/${currentToken}`;

  async function handleCopy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${invitePath}`
        : invitePath;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 지원하지 않는 환경 폴백
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateInviteToken(eventId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setCurrentToken(result.newToken);
        toast.success("초대 링크가 재발급되었습니다");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <LinkIcon className="h-3.5 w-3.5" />
        초대 링크
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={invitePath}
          className="font-mono text-xs text-muted-foreground"
        />
        <Button
          type="button"
          variant={copied ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckIcon className="mr-1.5 h-4 w-4" />
              복사됨
            </>
          ) : (
            <>
              <CopyIcon className="mr-1.5 h-4 w-4" />
              복사
            </>
          )}
        </Button>

        {/* 링크 재발급 버튼 — AlertDialog로 경고 표시 */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={isPending}
              aria-label="초대 링크 재발급"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>초대 링크를 재발급할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                기존 링크가 즉시 무효화됩니다. 이미 공유된 링크로는 더 이상
                접근할 수 없게 됩니다. 계속하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRegenerate}
                disabled={isPending}
              >
                재발급
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
