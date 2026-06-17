import { z } from "zod";

// 이벤트 생성/수정 Zod 스키마
export const eventSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  event_date: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  max_participants: z.coerce
    .number()
    .int("정수를 입력해주세요")
    .min(1, "1명 이상이어야 합니다")
    .optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
