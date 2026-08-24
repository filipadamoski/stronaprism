# Import pogody z Open-Meteo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skrypt `npm run import-pogoda` zastępuje wszystkie pomiary w bazie 120 prawdziwymi średnimi miesięcznymi temperaturami za 2025 (Open-Meteo Archive API).

**Architecture:** Jeden skrypt ES-module (`import-pogody.mjs`) w stylu istniejącego `dodaj-dane.mjs`: czysta funkcja agregująca (testowana przez `node:test`), klient API Open-Meteo, tryb `--dry-run` bez dostępu do bazy, bezpiecznik blokujący bazę produkcyjną bez flagi `--prod`. `.env` wskazuje bazę **dev** (`khcpwzfsjmfzrpqmgprl`, port 6543 + pgbouncer).

**Tech Stack:** Node 24 (wbudowane `node:test`), Prisma Client 6.19, Open-Meteo Archive API (bez klucza), Windows PowerShell.

## Global Constraints

- Repo **publiczne**: zero sekretów w kodzie (API bez klucza; współrzędne miast publiczne)
- `DATABASE_URL` zawsze z `.env`; skrypt nigdy nie wpisuje połączenia na sztywno
- Produkcja = Supabase ref `oqlvcggkderqefkvqpxr` — skrypt odmawia pracy na tej bazie bez flagi `--prod`
- Kolumna `Pomiary.temperatura` to `Int` — średnie zaokrąglamy `Math.round`
- Zakres danych wyłącznie `2025-01-01`..`2025-12-31`; każdy miesiąc musi mieć komplet dni, maks. 5 braków
- Styl kodu: bez komentarzy, top-level `await` dozwolony (ESM), logi przez `console.log`
- Praca na branchu `dev`; commity małe i częste

---

### Task 1: Czysta funkcja agregująca (TDD)

**Files:**
- Create: `import-pogody.mjs`
- Create: `test/import-pogody.test.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nic (pierwszy task)
- Produces: `monthlyAverages(dates: string[], temps: (number|null)[]) -> number[12]`; stałe eksportowe `ROK = '2025'`, `MIASTA` (mapa nazwa→{lat,lon}), `DNI_W_MIESIACU`

- [ ] **Step 1: Dodaj skrypt testowy do `package.json`**

W sekcji `"scripts"` dodać jedną linijkę (obok istniejących):

```json
    "test": "node --test test/",
```

- [ ] **Step 2: Napisz test (failing)**

Cała zawartość `test/import-pogody.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { monthlyAverages, ROK, MIASTA } from '../import-pogody.mjs'

const DNI = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function pelnyRok() {
  const daty = []
  DNI.forEach((n, i) => {
    for (let d = 1; d <= n; d++) daty.push(`${ROK}-${String(i + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  })
  return daty
}

test('pełny rok: średnia miesięczna z zaokrągleniem', () => {
  const daty = pelnyRok()
  const temps = daty.map(() => 10)
  temps[0] = 1.4
  temps[1] = 2.6
  for (let d = 2; d < 31; d++) temps[d] = 2
  temps[31] = 10.5
  for (let d = 32; d < 59; d++) temps[d] = 11
  const wynik = monthlyAverages(daty, temps)
  assert.equal(wynik.length, 12)
  assert.equal(wynik[0], 2)
  assert.equal(wynik[1], 11)
  assert.equal(wynik[7], 10)
})

test('do 5 braków w miesiącu jest tolerowane', () => {
  const daty = pelnyRok()
  const temps = daty.map((d) => (d.startsWith(`${ROK}-03`) && Number(d.slice(8)) <= 5 ? null : 5))
  const wynik = monthlyAverages(daty, temps)
  assert.equal(wynik[2], 5)
})

test('więcej niż 5 braków w miesiącu rzuca błąd', () => {
  const daty = pelnyRok()
  const temps = daty.map((d) => (d.startsWith(`${ROK}-03`) && Number(d.slice(8)) <= 6 ? null : 5))
  assert.throws(() => monthlyAverages(daty, temps), /braków/)
})

test('niepełny miesiąc rzuca błąd', () => {
  const daty = pelnyRok().slice(0, 300)
  const temps = daty.map(() => 1)
  assert.throws(() => monthlyAverages(daty, temps), /niepełny/)
})

test('data spoza roku rzuca błąd', () => {
  const daty = pelnyRok()
  daty[100] = '2024-04-10'
  const temps = daty.map(() => 1)
  assert.throws(() => monthlyAverages(daty, temps), /spoza roku/)
})

test('niezgodne długości tablic rzucają błąd', () => {
  assert.throws(() => monthlyAverages(['2025-01-01'], []), /nie zgadzają/)
})

test('mapa miast pokrywa 10 miast z bazy', () => {
  assert.equal(Object.keys(MIASTA).length, 10)
})
```

- [ ] **Step 3: Uruchom test, sprawdź że FAIL**

Run: `npm test`
Expected: FAIL — `Cannot find module '../import-pogody.mjs'`

- [ ] **Step 4: Minimalna implementacja**

Cała zawartość `import-pogody.mjs` (na tym etapie tylko czysta część):

```js
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
```

- [ ] **Step 5: Uruchom testy, sprawdź PASS**

Run: `npm test`
Expected: `pass 7`

- [ ] **Step 6: Commit**

```bash
git add import-pogody.mjs test/import-pogody.test.mjs package.json
git commit -m "feat: monthly average core with node:test coverage"
```

### Task 2: Pobieranie z Open-Meteo + tryb dry-run

**Files:**
- Modify: `import-pogody.mjs` (doklejka na końcu pliku + import na górze)
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `monthlyAverages`, `MIASTA`, `ROK` z Task 1
- Produces: CLI `node import-pogody.mjs --dry-run` (10 linii raportu + podsumowanie, zero zapisów do bazy); wewnętrznie `zbierzWiersze()` → `{nazwa: string, temperatura: int, id_miesiac: 1|..|12}[]`

- [ ] **Step 1: Doklej import Prismy na górze pliku**

Po pierwszej linii `export const ROK = '2025'` struktura nagłówka ma być:

```js
import { pathToFileURL } from 'node:url'
import { PrismaClient } from '@prisma/client'

export const ROK = '2025'
```

- [ ] **Step 2: Doklej na końcu pliku klient API i orkiestrację**

```js
async function pobierzMiasto(miasto, { lat, lon }) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ROK}-01-01&end_date=${ROK}-12-31&daily=temperature_2m&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${miasto}: HTTP ${res.status} od Open-Meteo`)
  }
  const json = await res.json()
  const { time, temperature_2m } = json.daily ?? {}
  if (!Array.isArray(time) || !Array.isArray(temperature_2m)) {
    throw new Error(`${miasto}: odpowiedź bez daily.temperature_2m`)
  }
  return { dates: time, temps: temperature_2m }
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
  await prisma.miejscowosc.update({
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
```

- [ ] **Step 3: Dodaj skrypt npm**

W `package.json` w `"scripts"`:

```json
    "import-pogoda": "node import-pogody.mjs",
```

- [ ] **Step 4: Dry-run — weryfikacja bez bazy**

Run: `npm run import-pogoda -- --dry-run`
Expected: dziesięć linii typu `Warszawa: 0, 1, 6, 12, 18, 21, 23, 22, 18, 12, 6, 1` (wartości przykładowe) + ostatnia linia `DRY-RUN: policzono 120 wierszy, baza nietknięta`. Exit code 0.

- [ ] **Step 5: Baza nietknięta**

Run:
```powershell
Set-Content .\licz.mjs -Value "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); console.log('pomiary:', await p.pomiary.count()); await p.`$disconnect()"
node .\licz.mjs; Remove-Item .\licz.mjs
```
Expected: `pomiary: 40`

- [ ] **Step 6: Testy nadal przechodzą**

Run: `npm test`
Expected: `pass 7` (guard `bezposrednio` nie odpala main przy imporcie)

- [ ] **Step 7: Commit**

```bash
git add import-pogody.mjs package.json
git commit -m "feat: open-meteo fetch with dry-run mode"
```

### Task 3: Bezpiecznik produkcyjny

**Files:**
- Modify: `import-pogody.mjs` (funkcja `main`)

**Interfaces:**
- Consumes: `main()` z Task 2
- Produces: odmowa uruchomienia na bazie zawierającej ref `oqlvcggkderqefkvqpxr` bez flagi `--prod` (exit 1 przed jakimkolwiek zapytaniem HTTP/DB)

- [ ] **Step 1: Dopisz stałą refa produkcji**

Pod linią `export const MIASTA = { ... }` (po zamknięciu obiektu):

```js
const REF_PRODUKCJI = 'oqlvcggkderqefkvqpxr'
```

- [ ] **Step 2: Guard na wejściu `main`**

Pierwsze linie `async function main()` mają wyglądać:

```js
async function main() {
  if ((process.env.DATABASE_URL ?? '').includes(REF_PRODUKCJI) && !process.argv.includes('--prod')) {
    console.error(`STOP: DATABASE_URL wskazuje baze produkcyjna (${REF_PRODUKCJI}). Dla swiadomego nadpisania uruchom z --prod.`)
    process.exit(1)
  }
  const wiersze = await zbierzWiersze()
```

(reszta funkcji bez zmian)

- [ ] **Step 3: Test odmowy na prodzie**

Run:
```powershell
$env:DATABASE_URL = 'postgresql://postgres.oqlvcggkderqefkvqpxr:fake@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'
node import-pogody.mjs --dry-run
"exit=$LASTEXITCODE"
Remove-Item Env:\DATABASE_URL
```
Expected: komunikat `STOP: DATABASE_URL wskazuje baze produkcyjna...`, brak linii z miastami, `exit=1`

- [ ] **Step 4: Normalny dry-run dalej działa**

Run: `npm run import-pogoda -- --dry-run`
Expected: jak w Task 2 Step 4 (`.env` wraca jako źródło DATABASE_URL)

- [ ] **Step 5: Commit**

```bash
git add import-pogody.mjs
git commit -m "feat: production database guard"
```

### Task 4: Import na bazie dev + akceptacja

**Files:**
- Modify: `docs/superpowers/specs/2026-08-24-import-pogody-design.md` (kryteria)

**Interfaces:**
- Consumes: pełny skrypt z Tasks 1–3, `.env` → baza dev
- Produces: baza dev z 120 prawdziwymi pomiarami; potwierdzone kryteria akceptacji spec

- [ ] **Step 1: Prawdziwy import na dev**

Run: `npm run import-pogoda`
Expected: dziesięć linii miast + `Wstawiono 120 pomiarów.`

- [ ] **Step 2: Weryfikacja bazy**

Run:
```powershell
Set-Content .\weryfikuj.mjs -Value @'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
console.log('razem:', await p.pomiary.count())
console.log('Bratyslava kraj:', (await p.miejscowosc.findFirst({ where: { nazwa: 'Bratysława' } })).kraj)
const poMiastach = await p.miejscowosc.findMany({ include: { _count: { select: { pomiary: true } } } })
console.log(poMiastach.map((m) => `${m.nazwa}:${m._count.pomiary}`).join(' | '))
await p.$disconnect()
'@
node .\weryfikuj.mjs; Remove-Item .\weryfikuj.mjs
```
Expected: `razem: 120`; `Bratyslava kraj: Słowacja`; każde miasto `:12`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: kompilacja OK, route `/` dynamic

- [ ] **Step 4: Preview pokazuje prawdziwe dane**

Push na dev (jeśli są niezacommitowane zmiany — commit najpierw), poczekać na deploy `Ready` (`vercel ls stronaprism`), potem:

Run:
```powershell
node -e "fetch('https://stronaprism-git-dev-filipadamoski91-5822s-projects.vercel.app/?id_miesiaca=1').then(r=>r.text()).then(t=>{console.log('styczen ujemne:', /-\d+<!-- -->°C/.test(t))})"
node -e "fetch('https://stronaprism-git-dev-filipadamoski91-5822s-projects.vercel.app/?id_miesiaca=7').then(r=>r.text()).then(t=>{const m=[...t.matchAll(/(\d+)<!-- -->°C/g)].map(x=>+x[1]); console.log('lipiec min/max:', Math.min(...m), Math.max(...m))})"
```
Expected: `styczen ujemne: true` (choć jedno miasto z temp. < 0°C); lipiec w zakresie ~15–25 dla polskich miast

- [ ] **Step 5: Produkcja bez zmian**

Run:
```powershell
node -e "fetch('https://stronaprism.vercel.app/?id_miesiaca=8').then(r=>r.text()).then(t=>{console.log('prod Zakopane 27 stopni dalej:', t.includes('27<!-- -->°C'))})"
```
Expected: `true` (produkcja jeszcze ze starymi danymi — import na prod to osobna świadoma decyzja)

- [ ] **Step 6: Odhacz kryteria w spec i commit**

W `docs/superpowers/specs/2026-08-24-import-pogody-design.md` zamienić wszystkie `- [ ]` na `- [x]`, następnie:

```bash
git add docs/superpowers/specs/2026-08-24-import-pogody-design.md
git commit -m "docs: weather import acceptance criteria met"
git push origin dev
```
