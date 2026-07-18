import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/features/auth/schemas/auth.schema";

describe("loginSchema", () => {
  it("valide des identifiants corrects", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = loginSchema.safeParse({ email: "invalid", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe vide", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("valide des donnees correctes", () => {
    const result = registerSchema.safeParse({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@test.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejette des mots de passe differents", () => {
    const result = registerSchema.safeParse({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@test.com",
      password: "12345678",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court", () => {
    const result = registerSchema.safeParse({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@test.com",
      password: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });
});
