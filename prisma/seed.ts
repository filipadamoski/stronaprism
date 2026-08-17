import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed miejscowosc
  await prisma.miejscowosc.createMany({
    data: [
      { id: 1, nazwa: 'Berlin', kraj: 'Niemcy' },
      { id: 2, nazwa: 'Gdańsk', kraj: 'Polska' },
      { id: 3, nazwa: 'Hamburg', kraj: 'Niemcy' },
      { id: 4, nazwa: 'Frankfurt', kraj: 'Niemcy' },
      { id: 5, nazwa: 'Warszawa', kraj: 'Polska' },
      { id: 6, nazwa: 'Zakopane', kraj: 'Polska' },
      { id: 7, nazwa: 'Praga', kraj: 'Czechy' },
      { id: 8, nazwa: 'Brno', kraj: 'Czechy' },
      { id: 9, nazwa: 'Ostrawa', kraj: 'Czechy' },
      { id: 10, nazwa: 'Bratysława', kraj: 'Niemcy' },
    ],
  })

  // Seed miesiace
  await prisma.miesiace.createMany({
    data: [
      { id: 1, nazwa: 'styczeń', pora: 'zima' },
      { id: 2, nazwa: 'luty', pora: 'zima' },
      { id: 3, nazwa: 'marzec', pora: 'wiosna' },
      { id: 4, nazwa: 'kwiecień', pora: 'wiosna' },
      { id: 5, nazwa: 'maj', pora: 'wiosna' },
      { id: 6, nazwa: 'czerwiec', pora: 'lato' },
      { id: 7, nazwa: 'lipiec', pora: 'lato' },
      { id: 8, nazwa: 'sierpień', pora: 'lato' },
      { id: 9, nazwa: 'wrzesień', pora: 'jesień' },
      { id: 10, nazwa: 'październik', pora: 'jesień' },
      { id: 11, nazwa: 'listopad', pora: 'jesień' },
      { id: 12, nazwa: 'grudzień', pora: 'zima' },
    ],
  })

  // Seed pomiary
  await prisma.pomiary.createMany({
    data: [
      { id: 1, temperatura: 12, id_miejscowosc: 5, id_miesiac: 2 },
      { id: 2, temperatura: 15, id_miejscowosc: 5, id_miesiac: 1 },
      { id: 3, temperatura: 7, id_miejscowosc: 6, id_miesiac: 2 },
      { id: 4, temperatura: 20, id_miejscowosc: 8, id_miesiac: 5 },
      { id: 5, temperatura: 15, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 6, temperatura: 17, id_miejscowosc: 3, id_miesiac: 11 },
      { id: 7, temperatura: -5, id_miejscowosc: 5, id_miesiac: 1 },
      { id: 8, temperatura: -8, id_miejscowosc: 6, id_miesiac: 12 },
      { id: 9, temperatura: -10, id_miejscowosc: 6, id_miesiac: 1 },
      { id: 10, temperatura: -12, id_miejscowosc: 1, id_miesiac: 2 },
      { id: 11, temperatura: 25, id_miejscowosc: 5, id_miesiac: 7 },
      { id: 12, temperatura: 30, id_miejscowosc: 9, id_miesiac: 7 },
      { id: 13, temperatura: 33, id_miejscowosc: 2, id_miesiac: 7 },
      { id: 14, temperatura: 15, id_miejscowosc: 9, id_miesiac: 9 },
      { id: 16, temperatura: 24, id_miejscowosc: 9, id_miesiac: 6 },
      { id: 17, temperatura: -4, id_miejscowosc: 8, id_miesiac: 4 },
      { id: 18, temperatura: 17, id_miejscowosc: 6, id_miesiac: 6 },
      { id: 19, temperatura: 23, id_miejscowosc: 10, id_miesiac: 5 },
      { id: 20, temperatura: 16, id_miejscowosc: 2, id_miesiac: 4 },
      { id: 21, temperatura: 21, id_miejscowosc: 8, id_miesiac: 7 },
      { id: 22, temperatura: 2, id_miejscowosc: 6, id_miesiac: 1 },
      { id: 23, temperatura: 7, id_miejscowosc: 8, id_miesiac: 2 },
      { id: 24, temperatura: 13, id_miejscowosc: 10, id_miesiac: 3 },
      { id: 25, temperatura: 14, id_miejscowosc: 10, id_miesiac: 4 },
      { id: 26, temperatura: 19, id_miejscowosc: 9, id_miesiac: 5 },
      { id: 27, temperatura: 22, id_miejscowosc: 8, id_miesiac: 6 },
      { id: 28, temperatura: 32, id_miejscowosc: 7, id_miesiac: 7 },
      { id: 29, temperatura: 27, id_miejscowosc: 6, id_miesiac: 8 },
      { id: 30, temperatura: 19, id_miejscowosc: 5, id_miesiac: 9 },
      { id: 31, temperatura: 11, id_miejscowosc: 4, id_miesiac: 10 },
      { id: 32, temperatura: 4, id_miejscowosc: 3, id_miesiac: 11 },
      { id: 33, temperatura: -8, id_miejscowosc: 2, id_miesiac: 12 },
      { id: 34, temperatura: 35, id_miejscowosc: 3, id_miesiac: 7 },
      { id: 35, temperatura: 12, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 36, temperatura: 33, id_miejscowosc: 3, id_miesiac: 8 },
      { id: 37, temperatura: 15, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 38, temperatura: 17, id_miejscowosc: 3, id_miesiac: 8 },
      { id: 39, temperatura: 22, id_miejscowosc: 9, id_miesiac: 4 },
      { id: 40, temperatura: 15, id_miejscowosc: 10, id_miesiac: 8 },
      { id: 41, temperatura: 15, id_miejscowosc: 7, id_miesiac: 4 },
    ],
  })

  console.log('Seed data inserted successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
