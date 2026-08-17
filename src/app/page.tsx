import { prisma } from '@/lib/prisma'

function getWeatherIcon(temperatura: number): string {
  if (temperatura > 30) return 'słońce.png'
  if (temperatura < 26) return 'deszcz.png'
  return 'słońcechmura.png'
}

export default async function Home({
  searchParams,
}: {
  searchParams: { id_miesiaca?: string }
}) {
  const idMiesiaca = Number(searchParams.id_miesiaca) || 7

  const pomiary = await prisma.pomiary.findMany({
    where: { id_miesiac: idMiesiaca },
    include: { miejscowosc: true },
  })

  const srednia = await prisma.pomiary.aggregate({
    where: { id_miesiac: idMiesiaca },
    _avg: { temperatura: true },
  })

  const miesiace = [
    { id: 1, nazwa: 'Styczeń' },
    { id: 2, nazwa: 'Luty' },
    { id: 3, nazwa: 'Marzec' },
    { id: 4, nazwa: 'Kwiecień' },
    { id: 5, nazwa: 'Maj' },
    { id: 6, nazwa: 'Czerwiec' },
    { id: 7, nazwa: 'Lipiec' },
    { id: 8, nazwa: 'Sierpień' },
    { id: 9, nazwa: 'Wrzesień' },
    { id: 10, nazwa: 'Październik' },
    { id: 11, nazwa: 'Listopad' },
    { id: 12, nazwa: 'Grudzień' },
  ]

  return (
    <>
      <header className="naglowek1">
        <img src="/słońce.png" alt="Słonecznie" />
      </header>

      <header className="naglowek2">
        <h1>Pogoda w Europie</h1>
      </header>

      <main>
        <section className="lewa">
          <h2>Temperatury w wybranym miesiącu</h2>
          <table>
            <thead>
              <tr>
                <th>Miasto</th>
                <th>Kraj</th>
                <th>Temperatura</th>
                <th>Pogoda</th>
              </tr>
            </thead>
            <tbody>
              {pomiary.map((pomiar) => (
                <tr key={pomiar.id}>
                  <td>{pomiar.miejscowosc.nazwa}</td>
                  <td>{pomiar.miejscowosc.kraj}</td>
                  <td>{pomiar.temperatura}°C</td>
                  <td>
                    <img src={`/${getWeatherIcon(pomiar.temperatura)}`} alt="Pogoda" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="prawa">
          <h2>Średnie temperatury w roku</h2>
          {miesiace.map((miesiac) => (
            <a
              key={miesiac.id}
              href={`/?id_miesiaca=${miesiac.id}`}
              style={{
                backgroundColor: idMiesiaca === miesiac.id ? '#388E3C' : undefined,
                color: idMiesiaca === miesiac.id ? '#DCE775' : undefined,
              }}
            >
              {miesiac.nazwa}
            </a>
          ))}
          <p>Średnia temperatura dla wybranego miesiąca wynosi</p>
          {srednia._avg.temperatura && (
            <h3>{srednia._avg.temperatura.toFixed(2)} stopni</h3>
          )}
        </section>
      </main>

      <footer>
        <p>Numer zdającego: 00000000</p>
      </footer>
    </>
  )
}
