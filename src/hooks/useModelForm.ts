import { useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { modelSchema, ModelData } from "../model/modelSchema";

export function useModelForm(initialValues: ModelData) {
  const [values, setValues] = useState<ModelData>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ModelData, string>>
  >({});

  useDeepCompareEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

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

    const tempValues = { ...values, [key]: parsed };
    const result = modelSchema.safeParse(tempValues);

    if (!result.success) {
      const newErrors: Partial<Record<keyof ModelData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ModelData;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setValues(tempValues);
    setErrors({});
  };

  const commit = (callback: (data: ModelData) => void) => {
    const result = modelSchema.safeParse(values);
    if (result.success) {
      callback(values);
    } else {
      const newErrors: Partial<Record<keyof ModelData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ModelData;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
    }
  };

  return {
    values,
    errors,
    updateField,
    commit,
  };
}
