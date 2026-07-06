import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/shared/password";

const prisma = new PrismaClient();

// 12 fixed roles — Business Specification ch25.1 (final, approved list).
const ROLE_NAMES = [
  "מנהל מערכת",
  "מנהל ייצור",
  "מנהל מטבח",
  "טבח",
  "מחסנאי",
  "מנהל מחסן",
  "מנהל אריזה",
  "עובד אריזה",
  "משלוחים",
  "מנהלת אבטחת איכות",
  "מבקרת אבטחת איכות",
  "מנהל רכש",
];

// 11 fixed departments — Business Specification ch25.1 (final, approved list).
const DEPARTMENT_NAMES = [
  "מחסנים",
  "מטבח קר",
  "מטבח חם",
  "מטבח חלבי",
  "כריכים",
  "אבטחת איכות",
  "אריזה קרה",
  "אריזה יבשים",
  "משלוחים חם",
  "משלוחים קר",
  "רכש",
];

async function main() {
  console.log("Seeding roles...");
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding departments...");
  for (const name of DEPARTMENT_NAMES) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding default site...");
  const site = await prisma.site.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "אתר ראשי", status: "active" },
  });

  console.log("Seeding initial users...");
  const systemAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "מנהל מערכת" } });
  const kitchenManagerRole = await prisma.role.findUniqueOrThrow({ where: { name: "מנהל מטבח" } });
  const hotKitchenDept = await prisma.department.findUniqueOrThrow({ where: { name: "מטבח חם" } });

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashPassword("ChangeMe123!"), // placeholder — force reset in real deployment
      fullName: "מנהל/ת מערכת",
      status: "active",
      siteId: null, // מנהל מערכת is cross-site by design (ERD §2.1)
      roles: { create: [{ roleId: systemAdminRole.id }] },
    },
  });

  await prisma.user.upsert({
    where: { username: "hot.kitchen.mgr" },
    update: {},
    create: {
      username: "hot.kitchen.mgr",
      passwordHash: hashPassword("ChangeMe123!"),
      fullName: "מנהל/ת מטבח חם",
      status: "active",
      siteId: site.id,
      roles: { create: [{ roleId: kitchenManagerRole.id }] },
      departments: { create: [{ departmentId: hotKitchenDept.id }] },
    },
  });

  console.log("Seed complete: 12 roles, 11 departments, 1 site, 2 users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
