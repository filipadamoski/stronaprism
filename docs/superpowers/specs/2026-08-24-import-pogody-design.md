# Design: Import prawdziwych danych pogodowych z Open-Meteo (2025)

Data: 2026-08-24
Status: zaakceptowany przez uĹĽytkownika
Branch roboczy: `dev` (preview na Vercelu do weryfikacji)

## Cel

ZastÄ…pienie wymyĹ›lonych pomiarĂłw prawdziwymi Ĺ›rednimi miesiÄ™cznymi temperaturami
za rok 2025 dla 10 istniejÄ…cych miast â€” baza dev: 120 realnych pomiarĂłw.

## Zakres

- Nowy skrypt `import-pogody.mjs` + komenda `npm run import-pogoda`
- Dane: dzienne temperatury z Open-Meteo Archive API uĹ›rednione per miesiÄ…c,
  zaokrÄ…glone do liczby caĹ‚kowitej (kolumna `temperatura` to Int)
- Stare pomiary usuwane; wstawiane wyĹ‚Ä…cznie nowe
- Poprawka danych referencyjnych: BratysĹ‚awa `kraj` â€žNiemcy" â†’ â€žSĹ‚owacja"

Poza zakresem: zmiany schematu bazy, pola dodatkowe (wiatr/opady â€” projekt #2),
wykresy (#3), panel admina (#4).

## Decyzje (Q&A z uĹĽytkownikiem)

1. Rodzaj danych: **Ĺ›rednie historyczne miesiÄ™czne** (nie aktualna pogoda)
2. Stare dane: **zamienione** (nie dosypywane obok)
3. Okres: **rok 2025** (peĹ‚ny, zakoĹ„czony)
4. Uruchamianie: **skrypt rÄ™czny** lokalnie (nie endpoint/cron)

## Architektura

```
Open-Meteo Archive API â”€â”€â–¶ import-pogody.mjs â”€â”€â–¶ Supabase DEV (przez DATABASE_URL z .env)
        (10 zapytaĹ„:            â”‚  avg mies. â†’ round
         1 miasto = 1 req)      â””â”€â”€â–¶ deleteMany(Pomiary) + createMany(120)
```

- Mapa `nazwa â†’ {lat, lon}` wpisana w skrypcie (brak zmian schematu)
- Klucz miasta: dokĹ‚adna nazwa z tabeli Miejscowosc; brak wpisu = bĹ‚Ä…d skryptu (fail-fast)
- Miasta bez danych API lub z lukami > 5 dni w miesiÄ…cu: przerwij z komunikatem

## SzczegĂłĹ‚y techniczne

- API: `https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=2025-01-01&end_date=2025-12-31&daily=temperature_2m&timezone=auto`
- Ĺšrednia miesiÄ™czna: mean z `daily.temperature_2m` danego miesiÄ…ca; `Math.round`
- Wstawianie: `pomiary.createMany({ data: [...] })`; ID autoincrement (bez setval)
- OpĂłĹşnienie ~300 ms miÄ™dzy requestami (kultura wobec darmowego API)
- Log postÄ™pu: miasto âś“ + 12 wartoĹ›ci; na koĹ„cu suma wstawionych wierszy

## BezpieczeĹ„stwo / ryzyka

- Skrypt dziaĹ‚a na bazie wskazanej przez `.env` (obecnie dev) â€” destrukcyjny
  (`deleteMany`) Ĺ›wiadomie NIE uruchamiamy na prodzie bez decyzji uĹĽytkownika
- Repo publiczne: brak sekretĂłw w kodzie (API bez klucza, wspĂłĹ‚rzÄ™dne publiczne)

## Kryteria akceptacji

- [x] `npm run import-pogoda` koĹ„czy siÄ™ sukcesem i raportuje 120 wstawionych pomiarĂłw
- [x] Baza dev zawiera 120 pomiarĂłw, po 12 na kaĹĽde miasto
- [x] Preview pokazuje realne wartoĹ›ci (np. Warszawa VII â‰ 20â€“22Â°C, Zakopane I < 0Â°C)
- [x] Produkcja (stronaprism.vercel.app) bez zmian po imporcie na dev
- [x] `npm run build` przechodzi; kraj BratysĹ‚awy = SĹ‚owacja
