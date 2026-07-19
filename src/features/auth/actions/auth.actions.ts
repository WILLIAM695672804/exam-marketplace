"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { authService } from "../services/auth.service";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";

export type AuthResult = { success: true } | { success: false; error: string };

export async function loginAction(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const result = await authService.authenticate(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const result = await authService.register(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  redirect("/connexion");
}

export async function forgotPasswordAction(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: "Email invalide." };
  }

  const result = await authService.initiatePasswordReset(parsed.data.email);

  if (result.token && result.email) {
    const { mailService } = await import("@/server/emails/mail.service");
    await mailService.sendPasswordReset(result.email, result.token);
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const result = await authService.resetPassword(parsed.data.token, parsed.data.password);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
