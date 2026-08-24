# Design: Setup dev/prod (GitHub + Supabase + Vercel)

Data: 2026-08-24
Status: zaakceptowany przez użytkownika (ustnie)

## Cel

Rozdzielenie rozwoju od produkcji: branch `dev` na GitHubie z osobną bazą danych
i osobnym adresem podglądowym na Vercel, tak żeby eksperymenty nigdy nie psuły
produkcji (stronaprism.vercel.app).

## Stan wyjściowy (kontekst)

- Kod tylko lokalnie (`Desktop\stronaprism`, branch `master`) — brak remote GitHub
- Niezacommitowane zmiany: migracja MySQL→PostgreSQL, `.env`, plan deployu
- Produkcja działa ręcznie: `vercel --prod`, projekt Vercel `stronaprism` polinkowany (`.vercel/`)
- Baza produkcyjna: Supabase projekt `oqlvcggkderqefkvqpxr` (eu-west-2),
  tabele Miejscowosc/Miesiace/Pomiary, dane zasiane
- `gh` CLI nieinstalowany

## Decyzje (Q&A z użytkownikiem)

1. Repo GitHub: **nowe, publiczne**, nazwa `stronaprism`
2. Baza dev: **nowy, osobny darmowy projekt Supabase** (`stronaprism-dev`)
3. Deploy: **integracja Git↔Vercel** (push = automatyczny deploy)
4. Model branchy: **master + dev** (bez feature branches/PR)

## Architektura

```
GitHub (publiczne repo stronaprism)
├── master  ──push──▶  Vercel PRODUKCJA (stronaprism.vercel.app) ──▶  Supabase prod (oqlvcggkderqefkvqpxr)
└── dev     ──push──▶  Vercel PREVIEW (adres git-dev)            ──▶  Supabase DEV  (stronaprism-dev)
```

## Przepływ pracy

1. Rozwój: `git checkout dev` → zmiany → `git push origin dev`
   → Vercel automatycznie buduje preview z bazą dev.
2. Weryfikacja na adresie preview.
3. Akceptacja: `git checkout master` → `git merge dev` → `git push origin master`
   → automatyczny deploy produkcyjny.
4. Zmiany schematu bazy (Prisma): najpierw migracja na bazie dev (test),
   potem świadomie na bazie prod (`npx prisma migrate deploy`) — ręcznie,
   jako bezpiecznik przed destrukcyjnymi zmianami.

## Środowiska Vercel

| Scope | DATABASE_URL |
|---|---|
| Production | obecny string Supabase prod (port 6543 + `pgbouncer=true&connection_limit=1`) |
| Preview | connection string projektu `stronaprism-dev` (+ te same parametry poolera) |

Uwaga: lokalny `.env` służy do developmentu lokalnego — wskazuje na bazę dev po jej utworzeniu.

## Bezpieczeństwo

- Repo publiczne ⇒ obowiązkowo przed pierwszym pushem:
  - `.env` w `.gitignore` (hasła bazy nigdy nie trafiają na GitHub)
  - `.gitignore` obejmuje też: `node_modules/`, `.next/`, `.vercel`
- Sekrety żyją wyłącznie: lokalnie w `.env` oraz w panelach Vercel/Supabase
- Do bazy dev nie trafiają żadne prawdziwe dane wrażliwe (dane są testowe pogodowe)

## Plan wykonania

1. Porządek w gicie: uzupełnić/dopiąć `.gitignore`, commit zmian na master
2. Zainstalować `gh` CLI, logowanie device-flow (interakcja użytkownika)
3. Utworzyć publiczne repo `stronaprism`, push master
4. Utworzyć branch `dev`, push
5. [UŻYTKOWNIK] Założyć projekt `stronaprism-dev` w panelu Supabase (region eu-west-2),
   przekazać connection string (port 6543)
6. Na bazie dev: `prisma migrate deploy` + seed danych testowych
7. Vercel: podpiąć GitHub do projektu, ustawić env var Preview = dev connection string
8. Lokalny `.env` → baza dev
9. Test końcowy: push na `dev` → sprawdzić preview (200 + dane), produkcja nietknięta

## Kryteria akceptacji

- [ ] Repo publiczne na GitHubie zawiera master i dev; `.env` NIE jest w historii
- [ ] Push na dev generuje preview URL z działającą stroną czytającą bazę dev
- [ ] Push na master nadal aktualizuje produkcję bez zmiany procedury
- [ ] Modyfikacja danych w bazie dev NIE zmienia zawartości strony produkcyjnej
- [ ] Lokalny `npm run dev` korzysta z bazy dev
