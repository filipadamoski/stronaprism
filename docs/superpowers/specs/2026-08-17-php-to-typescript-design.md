# Design: Konwersja PHP → Next.js + Prisma

## Podsumowanie

Konwersja prostej aplikacji pogodowej z PHP + MySQL na Next.js + TypeScript + Prisma ORM. Aplikacja wyświetla temperatury w europejskich miastach i pozwala obliczać średnie temperatury dla wybranych miesięcy.

## Wybory technologiczne

| Komponent | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| Framework | Next.js (App Router) | Full-stack, SSR, popularny w szkołach |
| ORM | Prisma | Type-safe, prosty w użyciu |
| Baza danych | MySQL | Zachowanie kompatybilności z obecną bazą |
| Frontend | React + istniejący CSS | Zachowanie wyglądu aplikacji |
| Język | TypeScript | Type safety |

## Schema bazy danych (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Miejscowosc {
  id      Int       @id @default(autoincrement())
  nazwa   String
  kraj    String
  pomiary Pomiary[]
}

model Miesiace {
  id      Int       @id @default(autoincrement())
  nazwa   String
  pora    String
  pomiary Pomiary[]
}

model Pomiary {
  id              Int          @id @default(autoincrement())
  temperatura     Int
  id_miejscowosc  Int
  id_miesiac      Int
  miejscowosc     Miejscowosc  @relation(fields: [id_miejscowosc], references: [id])
  miesiace        Miesiace     @relation(fields: [id_miesiac], references: [id])
}
```

Relacje:
- `Pomiary.miejscowosc` → `Miejscowosc` (via `id_miejscowosc`)
- `Pomiary.miesiace` → `Miesiace` (via `id_miesiac`)

## Struktura projektu

```
stronaprism/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── słońce.png
│   ├── deszcz.png
│   └── słońcechmura.png
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── styl.css
├── .env
├── package.json
├── tsconfig.json
└── next.config.js
```

## Logika aplikacji

### Strona główna (`page.tsx`)

Server Component pobierający dane z Prisma:

1. **Tabela temperatur (lipiec)**:
   - Domyślnie wyświetla temperatury dla `id_miesiac = 7`
   - Pobiera dane z joinem: `pomiary` + `miejscowosc`
   - Warunkowe wyświetlanie ikon pogodowych:
     - `temperatura > 30` → `słońce.png`
     - `temperatura < 26` → `deszcz.png`
     - inaczej → `słońcechmura.png`

2. **Średnie temperatury**:
   - Linki do miesięcy (1-12)
   - Parametr `?id_miesiaca=X` w URL
   - Agregacja `AVG(temperatura)` dla wybranego miesiąca

### Funkcje Prisma

```typescript
// Pobierz pomiary dla miesiąca
const pomiary = await prisma.pomiary.findMany({
  where: { id_miesiac: idMiesiaca },
  include: { miejscowosc: true }
});

// Oblicz średnią
const srednia = await prisma.pomiary.aggregate({
  where: { id_miesiac: idMiesiaca },
  _avg: { temperatura: true }
});
```

## Seedowanie danych

Script `prisma/seed.ts` załadowanie danych z `pogoda.sql`:

1. `miejscowosc` - 10 rekordów (miasta europejskie)
2. `miesiace` - 12 rekordów (miesiące z porami roku)
3. `pomiary` - 41 rekordów (pomiary temperatur)

Dane przekonwertowane na format Prisma `createMany`.

## CSS

Zachowanie obecnego pliku `styl.css` bez zmian. Skopiowanie do `src/app/styl.css`.

## Ikony pogodowe

Pliki PNG skopiowane do `public/`:
- `słońce.png`
- `deszcz.png`
- `słońcechmura.png`

## Kolejność implementacji

1. Inicjalizacja projektu Next.js
2. Konfiguracja Prisma + schema
3. Seedowanie danych
4. Komponent layout (header/footer)
5. Komponent główny (tabela + średnie)
6. Testowanie

## Zagadnienia bezpieczeństwa

- Użycie parametrów Prisma (brak SQL injection)
- Zmienne środowiskowe dla konfiguracji bazy
- Brak wrażliwych danych w kodzie

## Zakres

- Konwersja logiki PHP na TypeScript
- Zachowanie funkcjonalności 1:1
- Zachowanie wyglądu CSS
- Przenieść dane z SQL do Prisma seed
