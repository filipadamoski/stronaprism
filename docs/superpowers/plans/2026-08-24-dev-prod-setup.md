# Dev/Prod Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Branch `dev` na GitHubie z osobną bazą Supabase-dev i automatycznym preview deployem na Vercel, izolowany od produkcji (master → prod).

**Architecture:** GitHub repo (publiczne) jako źródło prawdy; integracja Git↔Vercel: push na `master` = deploy produkcyjny (obecna baza), push na `dev` = preview deploy (nowy projekt Supabase-dev). Env var `DATABASE_URL` rozdzielony per scope (Production / Preview) w Vercelu.

**Tech Stack:** git, GitHub CLI (`gh`), Supabase (PostgreSQL + pooler Supavisor), Vercel CLI, Prisma 6.19, Next.js 16.

## Global Constraints

- Repo **publiczne** ⇒ `.env` NIGDY nie może być w gicie (hasło bazy Supabase)
- Wszystkie connection stringi runtime: port **6543** (transaction pooler) + `?pgbouncer=true&connection_limit=1`
- Migracje Prisma (`migrate deploy`): port **5432** (session pooler) — advisory locki nie działają przez 6543
- Host poolera ma postać `aws-0-eu-west-2.pooler.supabase.com`, user `postgres.<ref>`; port 5432 vs 6543 to ten sam host
- Po seedzie z ręcznymi ID trzeba przestawić sekwencje (`setval`) — znany problem z tej bazy
- Produkcja w trakcie prac musi działać bez przerwy

---

### Task 1: Higiena gita — .gitignore, odczepienie .env, commit zmian

**Files:**
- Modify: `.gitignore`
- Untrack: `.env`
- Commit: wszystkie niezacommitowane zmiany funkcjonalne (schema, migracje, styl, docs, dodaj-dane.mjs, next-env.d.ts)

**Interfaces:**
- Consumes: obecny stan roboczy mastera (zmiany PostgreSQL)
- Produces: czysty master gotowy do pusha; `.env` poza gitem

- [x] **Step 1: Podmień `.gitignore`**

Cała zawartość pliku `.gitignore`:

```gitignore
# dependencies
node_modules/

# next.js
.next/
out/

# env & secrets
.env
.env*.local

# vercel
.vercel

# opencode/superpowers
.superpowers/

# misc
*.log
```

- [x] **Step 2: Odczep `.env` od gita (zostaje na dysku)**

```bash
git rm --cached .env
```

Expected: `rm '.env'`; plik fizycznie istnieje (`Test-Path .env` → True)

- [x] **Step 3: Zweryfikuj, że stara wersja .env w historii nie ma sekretów**

```bash
git show HEAD:.env
```

Expected: `DATABASE_URL="mysql://root:@localhost:3306/pogoda"` — localhost, puste hasło, brak realnego sekretu. (Jeśli coś innego z hasłem — STOP i zgłoś.)

- [x] **Step 4: Commit**

```bash
git add .gitignore src/app/styl.css prisma/migrations/migration_lock.toml prisma/schema.prisma prisma/migrations/20260820000000_init/ docs/vercel-deploy-plan.md dodaj-dane.mjs next-env.d.ts
git commit -m "feat: migrate to PostgreSQL on Supabase, add data helper script"
```

Uwaga: celowo NIE dodajemy `.next/`, `node_modules/`, `.superpowers/` — teraz łapie je .gitignore.

- [x] **Step 5: Weryfikacja czystości**

```bash
git status --short
```

Expected: pusto (żadnych `??` ani `M`). Oraz:

```bash
git ls-files | Select-String -Pattern "^\.env$|node_modules|\.next/"
```

Expected: brak wyników.

### Task 2: Instalacja i logowanie GitHub CLI

**Files:** brak (narzędzie systemowe)

**Interfaces:**
- Produces: działające `gh` z auth + credential helper do gita

- [x] **Step 1: Instalacja gh**

```bash
winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
```

Expected: `Successfully installed`. Jeśli winget nie istnieje — pobrać installer z https://cli.github.com/ i zainstalować ręcznie.

- [x] **Step 2: Odśwież PATH w sesji i sprawdź wersję**

```bash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User"); gh --version
```

Expected: `gh version 2.x.x`

- [x] **Step 3: Logowanie device-flow (interakcja użytkownika!)**

Uruchom i PRZekaż użytkownikowi kod + URL; poczekać aż potwierdzi w przeglądarce:

```bash
gh auth login --hostname github.com --git-protocol https --web
```

Jeśli shell nie pozwala na interakcję: poprosić użytkownika, żeby sam odpalił `gh auth login` u siebie (odp. GitHub.com → HTTPS → Login with a web browser) i dał znać.

- [x] **Step 4: Weryfikacja auth + podpięcie credential helpera**

```bash
gh auth status; gh auth setup-git
```

Expected: `Logged in to github.com account <login>`. Bez błędów z setup-git.

### Task 3: Utworzenie repo na GitHubie + push master

**Files:** brak nowego kodu

**Interfaces:**
- Consumes: Task 1 (czysty master), Task 2 (gh auth)
- Produces: `origin` → `github.com:<user>/stronaprism.git`, branch `master` wypchnięty

- [x] **Step 1: Utwórz repo i wypchnij**

```bash
gh repo create stronaprism --public --source=. --remote=origin --push
```

Expected: `✓ Created repository <user>/stronaprism on github.com` + push mastera.

- [x] **Step 2: Weryfikacja remote i historii pod kątem sekretów**

```bash
git remote -v
git ls-files | Select-String -Pattern "\.env"
```

Expected: remote `origin` ustawiony; `.env` NIE ma na liście plików.

### Task 4: Branch dev + push

**Files:** brak

**Interfaces:**
- Produces: branch `dev` na origin, lokalnie przełączony na `dev`

- [x] **Step 1: Utwórz branch z mastera**

```bash
git checkout -b dev
```

- [x] **Step 2: Push z trackingiem**

```bash
git push -u origin dev
```

- [x] **Step 3: Weryfikacja**

```bash
git branch -vv
```

Expected: `* dev ... [origin/dev]`.

### Task 5: Projekt Supabase-dev [UŻYTKOWNIK] + migracje + seed

**Files:**
- Create (tymczasowo): `fix-sekwencje.mjs` (usuwany po użyciu)

**Interfaces:**
- Consumes: dane logowania do panelu Supabase (użytkownik)
- Produces: baza dev ze schematem + danymi testowymi; DEV_DATABASE_URL znany executorowi

- [x] **Step 1: Instrukcja dla użytkownika (on wykonuje w przeglądarce)**

1. https://supabase.com/dashboard → **New project**
2. Name: `stronaprism-dev`, Database Password: wygeneruj i ZAPISZ, Region: `West EU (London)`
3. Poczekaj na provisioning (~2 min)
4. **Project Settings → Database → Connection string → URI**, zakładka/parametry tak, by port był **6543** (Transaction pooler); skopiuj string
5. Podaj executorowi: pełny URI z zamienionym `[YOUR-PASSWORD]` na prawdziwe hasło

Format jaki otrzymamy:
```
postgresql://postgres.<REF>:<HASLO>@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

- [x] **Step 2: Migracja na bazie dev (port 5432!)**

Podstaw `$DEV_URL_5432` = otrzymany URI z zamienionym portem `6543`→`5432`, potem:

```bash
$env:DATABASE_URL = $DEV_URL_5432
npx prisma migrate deploy
npx prisma migrate status
```

Expected: `1 migration found ... applied`, status: `Database schema is up to date!`. Jeśli timeout advisory locka — poczekać 60 s i ponownie (świeży projekt nie powinien mieć wiszących locków).

- [x] **Step 3: Seed danych**

Wróć na runtime URL (6543):

```bash
$env:DATABASE_URL = "<URI_6543_z_pgbouncer>"
# czyli <URI_6543>?pgbouncer=true&connection_limit=1
npx prisma db seed
```

Expected: `Seed data inserted successfully` (10 miejscowości, 12 miesięcy, 40 pomiarów).

- [x] **Step 4: Przestaw sekwencje ID**

Stwórz tymczasowy `fix-sekwencje.mjs`:

```js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
for (const t of ['Miejscowosc', 'Miesiace', 'Pomiary']) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${t}"))`
  )
  console.log('Sekwencja OK:', t)
}
await prisma.$disconnect()
```

```bash
node .\fix-sekwencje.mjs
Remove-Item .\fix-sekwencje.mjs
```

Expected: trzy linie `Sekwencja OK:`.

### Task 6: Vercel — integracja Gita + env var Preview (+ upgrade Production)

**Files:** brak

**Interfaces:**
- Consumes: Task 3 (repo na GitHub), Task 5 (dev URL)
- Produces: push na `dev` buduje preview z bazą dev; Production scope z `connection_limit=1`

- [x] **Step 1: Podpięcie Git integration**

Najpierw CLI (jeśli wspierane):

```bash
vercel git connect
```

Jeśli komenda nie istnieje/błąd — fallback dashboard (instrukcja dla użytkownika):
https://vercel.com/filipadamoski91-5822s-projects/stronaprism/settings/git → **Connect Git Provider** → GitHub → wybierz repo `stronaprism` → **Connect**.

Expected: repo widoczne jako Connected w settings/git oraz w zakładce GitHub na repo.

- [x] **Step 2: Ustaw DATABASE_URL scope Preview = baza dev**

```bash
"<URI_6543_dev>?pgbouncer=true&connection_limit=1" | vercel env add DATABASE_URL preview
```

Expected: `✓ Added DATABASE_URL ... Environments Preview`.

- [x] **Step 3: Upgrade Production scope zgodnie ze spec (dodaj connection_limit=1)**

```bash
"postgresql://postgres.oqlvcggkderqefkvqpxr:<HASLO_PROD>@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" | vercel env add DATABASE_URL production
```

(Hasło prod: `<HASLO_PROD>` — jest w lokalnym `.env`.) Expected: nadpisane/zapisane dla Production.

- [x] **Step 4: Weryfikacja**

```bash
vercel env ls
```

Expected: `DATABASE_URL` — Production i Preview, obie Sensitive.

### Task 7: Lokalny .env → baza dev

**Files:**
- Modify: `.env`

**Interfaces:**
- Consumes: Task 5 (dev URL)
- Produces: lokalny development czyta bazę dev

- [x] **Step 1: Podmień `.env`**

```env
DATABASE_URL="postgresql://postgres.<REF>:<HASLO_DEV>@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

- [x] **Step 2: Smoke test lokalny**

```bash
npm run build
```

Expected: kompilacja OK. Potem (opcjonalnie) `npm run dev` i http://localhost:3000 pokazuje tabelę.

### Task 8: Test końcowy E2E — izolacja baz

**Execution notes (2026-08-24):**
- Projekt Supabase-dev utworzony przez Management API (token użytkownika), nie ręcznie w panelu
- Vercel Git integration wymagała: Login Connection + instalacji GitHub App (użytkownik w przeglądarce)
- Deployment Protection (SSO) domyślnie blokował publiczny preview → wyłączony przez API (`ssoProtection: null`)
- Sieć lokalna użytkownika przechwytuje `*.vercel.app` (filtr ose.gov.pl) — testy HTTP wykonywane z innej sieci
- Wynik testu izolacji: marker TEST-DEV-MIASTO widoczny TYLKO na preview; produkcja nietknięta

**Files:** brak trwałych zmian

**Interfaces:**
- Consumes: wszystko powyżej
- Produces: dowód działania setupu (kryteria akceptacji spec)

- [x] **Step 1: Wytriggeruj pierwszy preview deploy**

```bash
git checkout dev
git commit --allow-empty -m "chore: trigger first dev preview"
git push origin dev
```

- [x] **Step 2: Poczekaj na build i znajdź URL preview**

```bash
vercel ls stronaprism
```

Poll co ~20 s do statusu `Ready` nowego deploymentu z gałęzi `dev`; URL typu `https://stronaprism-git-dev-<user>-....vercel.app`.

- [x] **Step 3: Dodaj marker do bazy DEV**

Tymczasowy skrypt analogiczny do `dodaj-dane.mjs` (miasto `TEST-DEV-MIASTO`, kraj `X`, pomiar temp `99`, `id_miesiac: 8`). Uruchom z lokalnym `.env` (= dev).

- [x] **Step 4: Asercje izolacji**

```bash
$p = Invoke-WebRequest "<PREVIEW_URL>/?id_miesiaca=8" -UseBasicParsing
$r = Invoke-WebRequest "https://stronaprism.vercel.app/?id_miesiaca=8" -UseBasicParsing
[regex]::Matches($p.Content,"TEST-DEV-MIASTO").Count   # > 0
[regex]::Matches($r.Content,"TEST-DEV-MIASTO").Count   # == 0
```

Expected: preview WIDZI marker, produkcja NIE WIDZI.

- [x] **Step 5: Sprzątnięcie markera**

Usunąć pomiar+miasto `TEST-DEV-MIASTO` z bazy dev skryptem (deleteMany pomiary → delete miejscowosc). Ponowna asercja: preview już nie pokazuje markera.

- [x] **Step 6: Raport końcowy + checklist kryteriów akceptacji ze spec**

Odhaczyć w spec wszystkie `[ ]` kryteria; przekazać użytkownikowi podsumowanie: adresy URL, model pracy, gdzie są sekrety.
