export function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      // Prisma v7 Decimal
      if (
        value !== null &&
        typeof value === "object" &&
        "constructor" in value &&
        (value as { constructor: { name: string } }).constructor.name === "Decimal"
      ) {
        return (value as { toString: () => string }).toString();
      }
      return value;
    })
  );
}
