# Migracja na Vercel - Plan

## Podsumowanie
Przeniesienie projektu Next.js + Prisma (MySQL) na Vercel z PostgreSQL.

## Co trzeba zrobić

### 1. Przejście z MySQL na PostgreSQL
- Zmiana `provider = "mysql"` na `provider = "postgresql"` w `prisma/schema.prisma`
- Usunięcie starej migracji i stworzenie nowej
- Wygenerowanie nowego Prisma Clienta

### 2. Baza danych PostgreSQL
Darmowe opcje:
- **Neon** (neon.tech) - 0.5GB darmowe, idealne do tego projektu
- **Supabase** (supabase.com) - 500MB darmowe

Kroki:
1. Założyć konto na neon.tech lub supabase.com
2. Stworzyć nowy projekt
3. Skopiować connection string (DATABASE_URL)
4. Zaimportować dane z `pogoda.sql` lub uruchomić seed

### 3. Import danych
- Przygotować SQL kompatybilny z PostgreSQL (zmienić syntax)
- Lub użyć seed.ts (zmienić na PostgreSQL)
- Zaimportować dane do nowej bazy

### 4. Konfiguracja Vercel
1. Zainstalować Vercel CLI: `npm i -g vercel`
2. Zalogować się: `vercel login`
3. W katalogu projektu: `vercel`
4. Dodać env var `DATABASE_URL` z nowym connection stringiem
5. Deploy: `vercel --prod`

### 5. Pliki do zmiany
- `prisma/schema.prisma` - zmiana providera
- `prisma/seed.ts` - dostosowanie do PostgreSQL
- `.env` - nowy DATABASE_URL
- Nowa migracja PostgreSQL

## Kolejność działań
1. Zacząć od Neon/Supabase (najszybciej)
2. Zmienić Prisma schema
3. Wygenerować migrację
4. Uruchomić seed z danymi
5. Przetestować lokalnie
6. Deploy na Vercel
