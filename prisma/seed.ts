import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Branches ────────────────────────────────────────────────────────────
  const branch1 = await prisma.branch.upsert({
    where: { id: "seed-branch-001" },
    update: { name: "Mukai Branch", address: "PO BOX 4901 Eldoret Mukai", phone: "0722560051/0763560052", paybill: "315469", pin: "P0S1656847U" },
    create: { id: "seed-branch-001", name: "Mukai Branch", address: "PO BOX 4901 Eldoret Mukai", phone: "0722560051/0763560052", paybill: "315469", pin: "P0S1656847U" },
  });
  const branch2 = await prisma.branch.upsert({
    where: { id: "seed-branch-002" },
    update: { name: "Zulu Arcade Branch", address: "PO BOX 30100 ELD Zulu Arcade", phone: "0712891212/0722560051", paybill: "858018", pin: "P0S1656847U" },
    create: { id: "seed-branch-002", name: "Zulu Arcade Branch", address: "PO BOX 30100 ELD Zulu Arcade", phone: "0712891212/0722560051", paybill: "858018", pin: "P0S1656847U" },
  });
  console.log(`✓ Branches: ${branch1.name}, ${branch2.name}`);

  // ── Admin user (no branch — sees all) ──────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@jsh.co.ke" },
    update: {},
    create: { name: "JSH Admin", email: "admin@jsh.co.ke", passwordHash, role: Role.ADMIN, branchId: null },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryNames = [
    "Engine Parts", "Electrical", "Brakes", "Tyres & Tubes",
    "Oils & Lubricants", "Body Parts", "Transmission", "Filters",
  ];
  for (const name of categoryNames) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✓ ${categoryNames.length} categories seeded`);

  // ── Supplier ────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-001" },
    update: {},
    create: {
      id: "seed-supplier-001",
      name: "Mombasa Auto Spares Ltd",
      phone: "0712000001",
      email: "orders@mombasaautospares.co.ke",
      address: "Mombasa Road, Industrial Area, Nairobi",
      notes: "Primary supplier — net 30 payment terms",
    },
  });
  console.log(`✓ Supplier: ${supplier.name}`);

  // ── Items + BranchStock ─────────────────────────────────────────────────
  const itemSeeds = [
    { sku: "ENG-001", name: "Piston Ring Set — Honda CG125",    category: "Engine Parts",       retailPrice: 850,   wholesalePrice: 700,  specialPrice: 620,  b1Qty: 48,  b2Qty: 20, threshold: 10 },
    { sku: "ENG-002", name: "Cylinder Head Gasket — Yamaha FZ", category: "Engine Parts",       retailPrice: 650,   wholesalePrice: 520,  specialPrice: 470,  b1Qty: 30,  b2Qty: 15, threshold: 8  },
    { sku: "BRA-001", name: "Brake Pad Set — Front (Universal)",category: "Brakes",             retailPrice: 420,   wholesalePrice: 330,  specialPrice: 290,  b1Qty: 60,  b2Qty: 40, threshold: 15 },
    { sku: "ELE-001", name: "CDI Unit — Honda CB150",           category: "Electrical",         retailPrice: 1200,  wholesalePrice: 980,  specialPrice: null, b1Qty: 12,  b2Qty: 8,  threshold: 4  },
    { sku: "OIL-001", name: "Engine Oil 20W-50 — 1 Litre",     category: "Oils & Lubricants",  retailPrice: 380,   wholesalePrice: 300,  specialPrice: null, b1Qty: 120, b2Qty: 60, threshold: 20 },
  ];

  for (const seed of itemSeeds) {
    const item = await prisma.item.upsert({
      where: { sku: seed.sku },
      update: {},
      create: {
        sku: seed.sku,
        name: seed.name,
        category: seed.category,
        retailPrice: seed.retailPrice,
        wholesalePrice: seed.wholesalePrice,
        specialPrice: seed.specialPrice,
        supplierId: supplier.id,
      },
    });

    await prisma.branchStock.upsert({
      where: { itemId_branchId: { itemId: item.id, branchId: branch1.id } },
      update: {},
      create: { itemId: item.id, branchId: branch1.id, stockQty: seed.b1Qty, lowStockThreshold: seed.threshold },
    });
    await prisma.branchStock.upsert({
      where: { itemId_branchId: { itemId: item.id, branchId: branch2.id } },
      update: {},
      create: { itemId: item.id, branchId: branch2.id, stockQty: seed.b2Qty, lowStockThreshold: seed.threshold },
    });

    console.log(`✓ Item [${item.sku}]: ${item.name} (B1: ${seed.b1Qty}, B2: ${seed.b2Qty})`);
  }

  console.log("\nSeed completed successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
