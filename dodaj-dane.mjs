import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const krakow = await prisma.miejscowosc.create({
  data: { nazwa: 'Kraków', kraj: 'Polska' },
})
console.log('Dodano miejscowosc:', krakow)

const pomiar = await prisma.pomiary.create({
  data: {
    temperatura: 22,
    id_miejscowosc: krakow.id,
    id_miesiac: 8, // sierpień
  },
})
console.log('Dodano pomiar:', pomiar)

await prisma.$disconnect()
