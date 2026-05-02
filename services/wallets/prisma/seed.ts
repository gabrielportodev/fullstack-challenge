import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env['DATABASE_URL']
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured for seeding')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
})

async function main() {
  const users = [
    { id: 'e0a7f1a0-1a1a-1a1a-1a1a-1a1a1a1a1a1a', username: 'player', balance: 1000000n }, // R$ 10.000,00
    { id: 'e0a7f1a0-2b2b-2b2b-2b2b-2b2b2b2b2b2b', username: 'gabriel', balance: 1000000n },
    { id: 'e0a7f1a0-3c3c-3c3c-3c3c-3c3c3c3c3c3c', username: 'joao', balance: 1000000n },
    { id: 'e0a7f1a0-4d4d-4d4d-4d4d-4d4d4d4d4d4d', username: 'pedro', balance: 0n } // saldo zero para teste de compensação
  ]

  for (const user of users) {
    console.log(`Seeding wallet for ${user.username} (${user.id})...`)

    await prisma.wallet.upsert({
      where: { playerId: user.id },
      update: { balanceCents: user.balance },
      create: {
        playerId: user.id,
        balanceCents: user.balance
      }
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
