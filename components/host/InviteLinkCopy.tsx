"use client";

import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteLinkCopyProps {
  inviteToken: string;
}

// 초대 링크 복사 컴포넌트
export function InviteLinkCopy({ inviteToken }: InviteLinkCopyProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteToken}`
      : `/invite/${inviteToken}`;

  async function handleCopy() {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/invite/${inviteToken}`
          : `/invite/${inviteToken}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // 2초 후 원래 상태로 복원
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 지원하지 않는 환경 처리
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          value={`/invite/${inviteToken}`}
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
      </div>
    </div>
  );
}
