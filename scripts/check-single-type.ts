import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const singleTypes = await prisma.singleType.findMany();
  
  console.log('\n=== All Single Types ===\n');
  
  for (const st of singleTypes) {
    console.log(`Name: ${st.name}`);
    console.log(`Display Name: ${st.displayName}`);
    console.log(`Fields type: ${typeof st.fields}`);
    console.log(`Fields value:`, JSON.stringify(st.fields, null, 2));
    
    if (st.fields && typeof st.fields === 'object' && 'fields' in st.fields) {
      const fields = (st.fields as any).fields;
      console.log(`\nField details:`);
      fields.forEach((field: any, index: number) => {
        console.log(`  ${index + 1}. ${field.name} (${field.type}) - ${field.displayName}`);
        if (field.type === 'media') {
          console.log(`     Multiple: ${field.multiple}`);
        }
      });
    }
    console.log('\n---\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
