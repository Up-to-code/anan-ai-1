import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "الاسم مطلوب")
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(100, "الاسم طويل جداً")
      .trim(),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("البريد الإلكتروني غير صحيح")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, "كلمة المرور مطلوبة")
      .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      .max(100, "كلمة المرور طويلة جداً"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

export const signupPayloadSchema = signupSchema.omit({ confirmPassword: true });
