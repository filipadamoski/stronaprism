# Design: Import prawdziwych danych pogodowych z Open-Meteo (2025)

Data: 2026-08-24
Status: zaakceptowany przez użytkownika
Branch roboczy: `dev` (preview na Vercelu do weryfikacji)

## Cel

Zastąpienie wymyślonych pomiarów prawdziwymi średnimi miesięcznymi temperaturami
za rok 2025 dla 10 istniejących miast — baza dev: 120 realnych pomiarów.

## Zakres

- Nowy skrypt `import-pogody.mjs` + komenda `npm run import-pogoda`
- Dane: dzienne temperatury z Open-Meteo Archive API uśrednione per miesiąc,
  zaokrąglone do liczby całkowitej (kolumna `temperatura` to Int)
- Stare pomiary usuwane; wstawiane wyłącznie nowe
- Poprawka danych referencyjnych: Bratysława `kraj` „Niemcy" → „Słowacja"

Poza zakresem: zmiany schematu bazy, pola dodatkowe (wiatr/opady — projekt #2),
wykresy (#3), panel admina (#4).

## Decyzje (Q&A z użytkownikiem)

1. Rodzaj danych: **średnie historyczne miesięczne** (nie aktualna pogoda)
2. Stare dane: **zamienione** (nie dosypywane obok)
3. Okres: **rok 2025** (pełny, zakończony)
4. Uruchamianie: **skrypt ręczny** lokalnie (nie endpoint/cron)

## Architektura

```
Open-Meteo Archive API ──▶ import-pogody.mjs ──▶ Supabase DEV (przez DATABASE_URL z .env)
        (10 zapytań:            │  avg mies. → round
         1 miasto = 1 req)      └──▶ deleteMany(Pomiary) + createMany(120)
```

- Mapa `nazwa → {lat, lon}` wpisana w skrypcie (brak zmian schematu)
- Klucz miasta: dokładna nazwa z tabeli Miejscowosc; brak wpisu = błąd skryptu (fail-fast)
- Miasta bez danych API lub z lukami > 5 dni w miesiącu: przerwij z komunikatem

## Szczegóły techniczne

- API: `https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=2025-01-01&end_date=2025-12-31&daily=temperature_2m&timezone=auto`
- Średnia miesięczna: mean z `daily.temperature_2m` danego miesiąca; `Math.round`
- Wstawianie: `pomiary.createMany({ data: [...] })`; ID autoincrement (bez setval)
- Opóźnienie ~300 ms między requestami (kultura wobec darmowego API)
- Log postępu: miasto ✓ + 12 wartości; na końcu suma wstawionych wierszy

## Bezpieczeństwo / ryzyka

- Skrypt działa na bazie wskazanej przez `.env` (obecnie dev) — destrukcyjny
  (`deleteMany`) świadomie NIE uruchamiamy na prodzie bez decyzji użytkownika
- Repo publiczne: brak sekretów w kodzie (API bez klucza, współrzędne publiczne)

## Kryteria akceptacji

- [ ] `npm run import-pogoda` kończy się sukcesem i raportuje 120 wstawionych pomiarów
- [ ] Baza dev zawiera 120 pomiarów, po 12 na każde miasto
- [ ] Preview pokazuje realne wartości (np. Warszawa VII ≈ 20–22°C, Zakopane I < 0°C)
- [ ] Produkcja (stronaprism.vercel.app) bez zmian po imporcie na dev
- [ ] `npm run build` przechodzi; kraj Bratysławy = Słowacja
