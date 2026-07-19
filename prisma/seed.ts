import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("[Seed] Demarrage du seed...");

  // Créer les rôles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "BUYER" },
      update: {},
      create: {
        name: "BUYER",
        description: "Acheteur - peut parcourir et acheter des épreuves",
      },
    }),
    prisma.role.upsert({
      where: { name: "TEACHER" },
      update: {},
      create: {
        name: "TEACHER",
        description: "Enseignant - peut publier et vendre des épreuves",
      },
    }),
    prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: {
        name: "ADMIN",
        description: "Administrateur - gère la plateforme, les utilisateurs et les paramètres",
      },
    }),
  ]);

  console.log(`[Seed] ${roles.length} roles crees`);

  // Créer l'admin par défaut
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@exam-marketplace.com" },
    update: {},
    create: {
      email: "admin@exam-marketplace.com",
      firstName: "Admin",
      lastName: "Système",
      passwordHash: adminPasswordHash,
      emailVerified: new Date(),
    },
  });

  // Assigner le rôle admin
  const adminRole = roles.find((r) => r.name === "ADMIN")!;
  await prisma.userRoleOnRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log(`[Seed] Admin cree : admin@exam-marketplace.com / admin123`);

  // Créer quelques catégories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "concours-fonction-publique" },
      update: {},
      create: {
        name: "Concours de la Fonction Publique",
        slug: "concours-fonction-publique",
        description: "Épreuves des concours administratifs",
      },
    }),
    prisma.category.upsert({
      where: { slug: "concours-enseignement" },
      update: {},
      create: {
        name: "Concours d'Enseignement",
        slug: "concours-enseignement",
        description: "Épreuves des concours de l'éducation nationale",
      },
    }),
    prisma.category.upsert({
      where: { slug: "examens-certifications" },
      update: {},
      create: {
        name: "Examens et Certifications",
        slug: "examens-certifications",
        description: "Examens professionnels et certifications",
      },
    }),
  ]);

  console.log(`[Seed] ${categories.length} categories crees`);

  // Créer des paramètres par défaut
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: "commission_rate" },
      update: {},
      create: { key: "commission_rate", value: "0.15" },
    }),
    prisma.setting.upsert({
      where: { key: "platform_name" },
      update: {},
      create: { key: "platform_name", value: "Exam Marketplace" },
    }),
    prisma.setting.upsert({
      where: { key: "max_downloads_per_purchase" },
      update: {},
      create: { key: "max_downloads_per_purchase", value: "5" },
    }),
  ]);

  console.log(`[Seed] ${settings.length} parametres crees`);
  console.log("[Seed] Seed termine avec succes.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[Seed] Erreur lors du seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });
