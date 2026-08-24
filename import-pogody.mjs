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
