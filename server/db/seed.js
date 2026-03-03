import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default settings if not exists
  await prisma.settings.upsert({
    where: { id: "app_settings" },
    update: {},
    create: {
      id: "app_settings",
      data: {
        companyName: "",
        abn: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        logo: "",
        defaultMargin: 18,
        defaultContingency: 5,
        defaultValidDays: 30,
        defaultPaymentTermsDays: 14,
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
