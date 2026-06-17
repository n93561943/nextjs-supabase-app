import { z } from "zod";

// 정산 생성 Zod 스키마
export const settlementSchema = z.object({
  total_amount: z.coerce.number().min(1, "1원 이상이어야 합니다"),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_holder: z.string().optional(),
});

export type SettlementFormValues = z.infer<typeof settlementSchema>;
