// prisma/backfill-weekdays.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LABEL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function main() {
  // 1) Give existing Menu rows distinct weekdays & nicer names
  const menus = await prisma.menu.findMany({ orderBy: { id: 'asc' } });
  for (let i = 0; i < menus.length; i++) {
    const sd = i % 7; // simple spread across days
    await prisma.menu.update({
      where: { id: menus[i].id },
      data: { serviceDay: sd, name: `${LABEL[sd]} Menu` },
    });
  }

  // 2) Ensure all 7 weekdays exist
  for (let d = 0; d < 7; d++) {
    const existing = await prisma.menu.findFirst({ where: { serviceDay: d } });
    if (!existing) {
      await prisma.menu.create({
        data: { name: `${LABEL[d]} Menu`, serviceDay: d, isActive: true, displayOrder: d },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); return prisma.$disconnect(); });
