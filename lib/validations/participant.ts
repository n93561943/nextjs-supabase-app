import { z } from "zod";

// 참여자 신청 Zod 스키마
export const participantSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  contact: z.string().min(1, "연락처를 입력해주세요"),
});

export type ParticipantFormValues = z.infer<typeof participantSchema>;
