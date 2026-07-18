import { describe, it, expect } from "vitest";
import { authService } from "@/features/auth/services/auth.service";

describe("authService", () => {
  it("hashPassword cree un hash different du mot de passe", async () => {
    const password = "test123456";
    const hash = await authService.hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash).toHaveLength(60);
  });

  it("verifyPassword retourne true pour le bon mot de passe", async () => {
    const password = "test123456";
    const hash = await authService.hashPassword(password);
    const valid = await authService.verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("verifyPassword retourne false pour un mauvais mot de passe", async () => {
    const hash = await authService.hashPassword("correct");
    const valid = await authService.verifyPassword("wrong", hash);
    expect(valid).toBe(false);
  });

  it("generateToken cree un token de 64 caracteres hex", () => {
    const token = authService.generateToken();
    expect(token).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it("generateTokenHash est deterministe", () => {
    const token = "abc123";
    const hash1 = authService.generateTokenHash(token);
    const hash2 = authService.generateTokenHash(token);
    expect(hash1).toBe(hash2);
  });
});
