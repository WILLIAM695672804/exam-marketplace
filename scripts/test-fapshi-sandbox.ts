/**
 * Script de test — Intégration Fapshi Sandbox
 * Exécution : npx tsx scripts/test-fapshi-sandbox.ts
 */
import { FapshiAdapter } from "../src/features/payments/adapters/fapshi/fapshi.adapter";
import { paymentConfig, validatePaymentConfig } from "../src/config/payment.config";

const SEP = "=".repeat(60);

async function test(adapter: FapshiAdapter, phone: string, label: string) {
  console.log(`\n${SEP}`);
  console.log(`📋 ${label}`);
  console.log(`   phone  : ${phone}`);
  console.log(
    `   medium : auto-détecté (${phone.replace(/\D/g, "").slice(-9).startsWith("69") ? "orange money" : "mobile money"})`
  );
  console.log(SEP);

  try {
    const response = await adapter.initiatePayment({
      amount: 100,
      currency: "XAF",
      reference: `TEST-${Date.now()}`,
      email: "test@exammarketplace.com",
      phone,
      name: "Test User",
      metadata: {
        orderId: "test-order",
        userId: "test-user",
        idempotencyKey: `idem-${Date.now()}`,
      },
    });
    console.log("   ✅ SUCCESS");
    console.log(`   transId  : ${response.providerTxId}`);
    console.log(`   reference: ${response.providerRef}`);
    console.log(`   status   : ${response.status}`);
    return response;
  } catch (error) {
    const err = error as { httpStatus?: number; code?: string; message?: string };
    console.log(`   ❌ HTTP ${err.httpStatus} — ${err.code}`);
    console.log(`   ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(SEP);
  console.log("TEST INTÉGRATION FAPSHI SANDBOX — PAYLOAD ENRICHI");
  console.log(SEP);
  console.log(`   Provider: ${paymentConfig.provider}`);
  console.log(`   Env     : ${paymentConfig.environment}`);

  const validation = validatePaymentConfig();
  console.log(
    `   Config  : ${validation.valid ? "✅ valide" : "⚠️ " + validation.missingVars.join(", ")}`
  );

  const adapter = new FapshiAdapter({
    apiUser: paymentConfig.fapshi.apiUser,
    apiKey: paymentConfig.fapshi.apiKey,
    baseUrl: "https://sandbox.fapshi.com",
    timeoutMs: paymentConfig.fapshi.timeoutMs,
  });

  // Tests SUCCESS
  await test(adapter, "690000000", "Orange SUCCESS attendu (690000000)");
  await test(adapter, "670000000", "MTN SUCCESS attendu (670000000)");

  // Tests ÉCHEC
  await test(adapter, "690000001", "Orange ÉCHEC attendu (690000001)");
  await test(adapter, "670000001", "MTN ÉCHEC attendu (670000001)");

  console.log(`\n${SEP}`);
  console.log(
    "RÉSUMÉ : Payload envoyé = { amount, currency, reference, email, phone, medium, name, externalId, message, meta }"
  );
  console.log(SEP);
}

main().catch(console.error);
