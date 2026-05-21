import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const component = await prisma.component.findUnique({
    where: { name: 'banner' }
  });
  
  if (component) {
    console.log('\n=== Banner Component ===\n');
    console.log(`Name: ${component.name}`);
    console.log(`Display Name: ${component.displayName}`);
    console.log(`Category: ${component.category}`);
    console.log(`Fields:`, JSON.stringify(component.fields, null, 2));
  } else {
    console.log('Banner component not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
