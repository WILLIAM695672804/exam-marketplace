"use server";

export async function sendContactMessage(
  _prevState: { success: boolean } | null,
  _formData: FormData
): Promise<{ success: boolean }> {
  // En production : envoyer un email via Resend
  // const { resend } = await import("@/lib/resend");
  // await resend.emails.send({...});
  return { success: true };
}
