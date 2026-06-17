import { z } from "zod";

// 공지 생성 Zod 스키마
export const noticeSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
});

export type NoticeFormValues = z.infer<typeof noticeSchema>;
