// One-off: replace demo CSGs (Bodija, UI Campus - both 0 members) with the real ones.
import { prisma } from '../src/config/database';

const CSG_NAMES = [
  'Kuola CSG',
  'Oluyole CSG',
  'Tipper Garage/Taska CSG',
  'New Garage CSG',
  'Lead City CSG',
  'Oluyole Extension CSG',
  'Sango CSG',
  'Ringroad/Challenge/Fele CSG',
  'Elebu CSG',
];

async function main() {
  const demo = await prisma.csg.findMany({
    where: { name: { in: ['Bodija CSG', 'UI Campus CSG'] } },
  });
  for (const c of demo) {
    const memberCount = await prisma.csgMembership.count({ where: { csgId: c.id } });
    if (memberCount === 0) {
      await prisma.csg.delete({ where: { id: c.id } });
      console.log(`Deleted demo CSG "${c.name}" (id ${c.id}, 0 members)`);
    } else {
      console.log(`Skipped "${c.name}" - has ${memberCount} member(s), not deleting`);
    }
  }

  for (const name of CSG_NAMES) {
    const existing = await prisma.csg.findFirst({ where: { name } });
    if (existing) {
      console.log(`Already exists: ${name}`);
      continue;
    }
    const created = await prisma.csg.create({ data: { name, isActive: true } });
    console.log(`Created: ${created.name} (id ${created.id})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
