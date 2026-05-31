import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@jsh.co.ke" },
    update: {},
    create: { name: "JSH Admin", email: "admin@jsh.co.ke", passwordHash, role: Role.ADMIN },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryNames = [
    "Engine Parts",
    "Electrical",
    "Brakes",
    "Tyres & Tubes",
    "Oils & Lubricants",
    "Body Parts",
    "Transmission",
    "Filters",
  ];
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${categoryNames.length} categories seeded`);

  // ── Supplier ────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-001" },
    update: {},
    create: {
      id: "seed-supplier-001",
      name: "Mombasa Auto Spares Ltd",
      phone: "+254712000001",
      email: "orders@mombasaautospares.co.ke",
      address: "Mombasa Road, Industrial Area, Nairobi",
      notes: "Primary supplier — net 30 payment terms",
    },
  });
  console.log(`✓ Supplier: ${supplier.name}`);

  // ── Items ───────────────────────────────────────────────────────────────
  const items = [
    {
      sku: "ENG-001",
      name: "Piston Ring Set — Honda CG125",
      category: "Engine Parts",
      description: "Standard bore piston ring set for Honda CG125 engines",
      retailPrice: 850,
      wholesalePrice: 700,
      specialPrice: 620,
      stockQty: 48,
      lowStockThreshold: 10,
      supplierId: supplier.id,
    },
    {
      sku: "ENG-002",
      name: "Cylinder Head Gasket — Yamaha FZ",
      category: "Engine Parts",
      description: "OEM-spec cylinder head gasket for Yamaha FZ series",
      retailPrice: 650,
      wholesalePrice: 520,
      specialPrice: 470,
      stockQty: 30,
      lowStockThreshold: 8,
      supplierId: supplier.id,
    },
    {
      sku: "BRA-001",
      name: "Brake Pad Set — Front (Universal)",
      category: "Brakes",
      description: "Semi-metallic front brake pads, fits most 125–200cc bikes",
      retailPrice: 420,
      wholesalePrice: 330,
      specialPrice: 290,
      stockQty: 60,
      lowStockThreshold: 15,
      supplierId: supplier.id,
    },
    {
      sku: "ELE-001",
      name: "CDI Unit — Honda CB150",
      category: "Electrical",
      description: "Digital CDI ignition unit for Honda CB150",
      retailPrice: 1_200,
      wholesalePrice: 980,
      specialPrice: null,
      stockQty: 12,
      lowStockThreshold: 4,
      supplierId: supplier.id,
    },
    {
      sku: "OIL-001",
      name: "Engine Oil 20W-50 — 1 Litre",
      category: "Oils & Lubricants",
      description: "Mineral engine oil, suitable for all 4-stroke motorcycle engines",
      retailPrice: 380,
      wholesalePrice: 300,
      specialPrice: null,
      stockQty: 120,
      lowStockThreshold: 20,
      supplierId: supplier.id,
    },
  ];

  for (const item of items) {
    const created = await prisma.item.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
    console.log(`✓ Item [${created.sku}]: ${created.name}`);
  }

  console.log("\nSeed completed successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
