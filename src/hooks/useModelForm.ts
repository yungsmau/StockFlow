import { useState } from "react";
import { modelSchema, ModelData } from "../model/modelSchema";
import { ZodNumber } from "zod";

export function useModelForm(initialValues: ModelData) {
  const [values, setValues] = useState<ModelData>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ModelData, string>>
  >({});

  const updateField = (key: keyof ModelData, raw: string) => {
    if (raw.trim() === "") {
      setErrors((prev) => ({ ...prev, [key]: "Поле не может быть пустым" }));
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setErrors((prev) => ({ ...prev, [key]: "Введите число" }));
      return;
    }

    const fieldSchema = modelSchema.shape[key] as ZodNumber;
    const result = fieldSchema.safeParse(parsed);

    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [key]: result.error.issues[0].message,
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setValues((prev) => ({ ...prev, [key]: parsed }));
  };

  // НОВЫЙ метод для коммита
  const commit = (callback: (data: ModelData) => void) => {
    callback(values);
  };

  return {
    values,
    errors,
    updateField,
    commit,
  };
}
