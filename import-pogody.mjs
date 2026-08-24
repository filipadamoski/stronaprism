import { pathToFileURL } from 'node:url'
import { PrismaClient } from '@prisma/client'

export const ROK = '2025'

export const DNI_W_MIESIACU = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const MIASTA = {
  'Berlin': { lat: 52.52, lon: 13.405 },
  'Gdańsk': { lat: 54.352, lon: 18.6466 },
  'Hamburg': { lat: 53.5511, lon: 9.9937 },
  'Frankfurt': { lat: 50.1109, lon: 8.6821 },
  'Warszawa': { lat: 52.2297, lon: 21.0122 },
  'Zakopane': { lat: 49.2992, lon: 19.9496 },
  'Praga': { lat: 50.0755, lon: 14.4378 },
  'Brno': { lat: 49.1951, lon: 16.6068 },
  'Ostrawa': { lat: 49.8209, lon: 18.2625 },
  'Bratysława': { lat: 48.1486, lon: 17.1077 },
}

const REF_PRODUKCJI = 'oqlvcggkderqefkvqpxr'

export function monthlyAverages(dates, temps) {
  if (dates.length !== temps.length) {
    throw new Error('Długości dat i temperatur się nie zgadzają')
  }
  const acc = Array.from({ length: 12 }, () => ({ suma: 0, dni: 0, braki: 0 }))
  for (let i = 0; i < dates.length; i++) {
    if (!dates[i].startsWith(`${ROK}-`)) {
      throw new Error(`Data spoza roku ${ROK}: ${dates[i]}`)
    }
    const m = Number(dates[i].slice(5, 7)) - 1
    const t = temps[i]
    if (t === null || t === undefined || !Number.isFinite(t)) {
      acc[m].braki++
    } else {
      acc[m].suma += t
      acc[m].dni++
    }
  }
  return acc.map((a, idx) => {
    const oczekiwane = DNI_W_MIESIACU[idx]
    if (a.dni + a.braki !== oczekiwane) {
      throw new Error(`Miesiąc ${idx + 1}: dane niepełne (${a.dni + a.braki}/${oczekiwane} dni)`)
    }
    if (a.braki > 5) {
      throw new Error(`Miesiąc ${idx + 1}: za dużo braków danych (${a.braki} dni)`)
    }
    return Math.round(a.suma / a.dni)
  })
}

async function pobierzMiasto(miasto, { lat, lon }) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ROK}-01-01&end_date=${ROK}-12-31&daily=temperature_2m_mean&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${miasto}: HTTP ${res.status} od Open-Meteo`)
  }
  const json = await res.json()
  const { time, temperature_2m_mean } = json.daily ?? {}
  if (!Array.isArray(time) || !Array.isArray(temperature_2m_mean)) {
    throw new Error(`${miasto}: odpowiedź bez daily.temperature_2m_mean`)
  }
  return { dates: time, temps: temperature_2m_mean }
}

async function zbierzWiersze() {
  const wiersze = []
  for (const [nazwa, koord] of Object.entries(MIASTA)) {
    const { dates, temps } = await pobierzMiasto(nazwa, koord)
    const srednie = monthlyAverages(dates, temps)
    srednie.forEach((temperatura, i) => wiersze.push({ nazwa, temperatura, id_miesiac: i + 1 }))
    console.log(`${nazwa}: ${srednie.join(', ')}`)
    await new Promise((r) => setTimeout(r, 300))
  }
  return wiersze
}

async function main() {
  if ((process.env.DATABASE_URL ?? '').includes(REF_PRODUKCJI) && !process.argv.includes('--prod')) {
    console.error(`STOP: DATABASE_URL wskazuje baze produkcyjna (${REF_PRODUKCJI}). Dla swiadomego nadpisania uruchom z --prod.`)
    process.exit(1)
  }
  const wiersze = await zbierzWiersze()
  if (process.argv.includes('--dry-run')) {
    console.log(`DRY-RUN: policzono ${wiersze.length} wierszy, baza nietknięta`)
    return
  }
  const prisma = new PrismaClient()
  const miasta = await prisma.miejscowosc.findMany()
  const idPoNazwie = new Map(miasta.map((m) => [m.nazwa, m.id]))
  for (const nazwa of Object.keys(MIASTA)) {
    if (!idPoNazwie.has(nazwa)) {
      throw new Error(`Brak miasta w bazie: ${nazwa}`)
    }
  }
  await prisma.pomiary.deleteMany({})
  await prisma.miejscowosc.updateMany({
    where: { nazwa: 'Bratysława' },
    data: { kraj: 'Słowacja' },
  })
  const dane = wiersze.map((w) => ({
    temperatura: w.temperatura,
    id_miejscowosc: idPoNazwie.get(w.nazwa),
    id_miesiac: w.id_miesiac,
  }))
  const r = await prisma.pomiary.createMany({ data: dane })
  console.log(`Wstawiono ${r.count} pomiarów.`)
  await prisma.$disconnect()
}

const bezposrednio = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (bezposrednio) {
  await main()
}
