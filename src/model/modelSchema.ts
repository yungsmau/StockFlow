import { z } from "zod";

export const modelSchema = z.object({
  initialStock: z
    .number()
    .min(1, "Минимум 1")
    .max(10_000_000, "Слишком большое значение"),

  threshold: z
    .number()
    .min(0, "Минимум 0")
    .max(10_000_000, "Слишком большое значение"),

  deliveryDays: z
    .number()
    .min(1, "Минимум 1 день")
    .max(365, "Максимум 365 дней"),

  unitCost: z
    .number()
    .min(0, "Минимум 0")
    .max(1_000_000, "Слишком большое значение"),
});

export type ModelData = z.infer<typeof modelSchema>;
