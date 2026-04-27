require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Step 1: Seed only SUPER_ADMIN role ──────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where:  { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Owner — full system access" },
  });
  console.log("✅ SUPER_ADMIN role seeded (id:", superAdminRole.id, ")");

  // ─── Step 2: Seed super admin user ───────────────────────────────────────────
  const username = process.env.SUPER_ADMIN_USERNAME || "superadmin";
  const email    = process.env.SUPER_ADMIN_EMAIL    || "admin@beanscones.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    console.log("⚠️  Super admin already exists — skipping");
  } else {
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        userType: "SUPER_ADMIN_STAFF",
        status:   "ACTIVE",
        superAdminStaff: {
          create: {
            staffCode:      "SA001",
            firstName:      "Super",
            lastName:       "Admin",
            designation:    "SUPER_ADMIN",
            hireDate:       new Date(),
            employmentType: "FULL_TIME",
            role:           { connect: { id: superAdminRole.id } },
          },
        },
      },
    });

    console.log("✅ Super admin created");
    console.log(`   Username : ${username}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : ${password}`);
  }

  console.log("🎉 Seeding complete");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
