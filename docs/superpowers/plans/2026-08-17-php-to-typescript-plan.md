# PHP → Next.js + Prisma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert PHP weather app to Next.js + TypeScript + Prisma ORM with MySQL

**Architecture:** Server Components in Next.js App Router, Prisma ORM for database access, existing CSS preserved, data seeded from pogoda.sql

**Tech Stack:** Next.js 14+, TypeScript, Prisma, MySQL, React

## Global Constraints

- Node.js 18+ required
- MySQL server must be running locally
- DATABASE_URL in .env pointing to local MySQL
- All Polish variable names preserved (nazwa, kraj, temperatura, etc.)
- Weather icon logic: >30°C = słońce.png, <26°C = deszcz.png, else = słońcechmura.png

---

## File Structure

```
stronaprism/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script with data
├── public/
│   ├── słońce.png             # Sun icon (copied)
│   ├── deszcz.png             # Rain icon (copied)
│   └── słońcechmura.png       # Sun-cloud icon (copied)
├── src/
│   └── app/
│       ├── layout.tsx         # Root layout (header/footer)
│       ├── page.tsx           # Main page (table + averages)
│       └── styl.css           # Existing CSS (copied)
├── .env                       # DATABASE_URL
├── package.json
├── tsconfig.json
└── next.config.js
```

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: None (initial setup)
- Produces: Running Next.js dev server

- [ ] **Step 1: Initialize project with npm**

```bash
cd "C:\Users\Filip Adamoski\Desktop\stronaprism"
npm init -y
```

- [ ] **Step 2: Install Next.js and React dependencies**

```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/react-dom
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

- [ ] **Step 5: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 6: Create src/app directory structure**

```bash
mkdir -p src/app
```

- [ ] **Step 7: Create minimal layout.tsx**

```tsx
export const metadata = {
  title: 'Pogoda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create minimal page.tsx**

```tsx
export default function Home() {
  return <div>Pogoda w Europie</div>
}
```

- [ ] **Step 9: Test dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000, shows "Pogoda w Europie"

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project"
```

---

### Task 2: Configure Prisma with MySQL Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`
- Modify: `package.json` (add prisma dependencies)

**Interfaces:**
- Consumes: Running MySQL server
- Produces: Prisma client ready for queries

- [ ] **Step 1: Install Prisma dependencies**

```bash
npm install prisma --save-dev
npm install @prisma/client
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 3: Create prisma/schema.prisma**

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

- [ ] **Step 4: Create .env file**

```
DATABASE_URL="mysql://root:@localhost:3306/pogoda"
```

Note: Adjust password if MySQL has one set.

- [ ] **Step 5: Run Prisma migration**

```bash
npx prisma migrate dev --name init
```

Expected: Tables created in MySQL database

- [ ] **Step 6: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 7: Commit**

```bash
git add prisma .env
git commit -m "feat: add Prisma schema with MySQL"
```

---

### Task 3: Create Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

**Interfaces:**
- Consumes: Prisma schema from Task 2
- Produces: Populated database with test data

- [ ] **Step 1: Install ts-node for seed script**

```bash
npm install -D ts-node
```

- [ ] **Step 2: Add seed config to package.json**

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Create prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed miejscowosc
  await prisma.miejscowosc.createMany({
    data: [
      { id: 1, nazwa: 'Berlin', kraj: 'Niemcy' },
      { id: 2, nazwa: 'Gdańsk', kraj: 'Polska' },
      { id: 3, nazwa: 'Hamburg', kraj: 'Niemcy' },
      { id: 4, nazwa: 'Frankfurt', kraj: 'Niemcy' },
      { id: 5, nazwa: 'Warszawa', kraj: 'Polska' },
      { id: 6, nazwa: 'Zakopane', kraj: 'Polska' },
      { id: 7, nazwa: 'Praga', kraj: 'Czechy' },
      { id: 8, nazwa: 'Brno', kraj: 'Czechy' },
      { id: 9, nazwa: 'Ostrawa', kraj: 'Czechy' },
      { id: 10, nazwa: 'Bratysława', kraj: 'Niemcy' },
    ],
  })

  // Seed miesiace
  await prisma.miesiace.createMany({
    data: [
      { id: 1, nazwa: 'styczeń', pora: 'zima' },
      { id: 2, nazwa: 'luty', pora: 'zima' },
      { id: 3, nazwa: 'marzec', pora: 'wiosna' },
      { id: 4, nazwa: 'kwiecień', pora: 'wiosna' },
      { id: 5, nazwa: 'maj', pora: 'wiosna' },
      { id: 6, nazwa: 'czerwiec', pora: 'lato' },
      { id: 7, nazwa: 'lipiec', pora: 'lato' },
      { id: 8, nazwa: 'sierpień', pora: 'lato' },
      { id: 9, nazwa: 'wrzesień', pora: 'jesień' },
      { id: 10, nazwa: 'październik', pora: 'jesień' },
      { id: 11, nazwa: 'listopad', pora: 'jesień' },
      { id: 12, nazwa: 'grudzień', pora: 'zima' },
    ],
  })

  // Seed pomiary
  await prisma.pomiary.createMany({
    data: [
      { id: 1, temperatura: 12, id_miejscowosc: 5, id_miesiac: 2 },
      { id: 2, temperatura: 15, id_miejscowosc: 5, id_miesiac: 1 },
      { id: 3, temperatura: 7, id_miejscowosc: 6, id_miesiac: 2 },
      { id: 4, temperatura: 20, id_miejscowosc: 8, id_miesiac: 5 },
      { id: 5, temperatura: 15, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 6, temperatura: 17, id_miejscowosc: 3, id_miesiac: 11 },
      { id: 7, temperatura: -5, id_miejscowosc: 5, id_miesiac: 1 },
      { id: 8, temperatura: -8, id_miejscowosc: 6, id_miesiac: 12 },
      { id: 9, temperatura: -10, id_miejscowosc: 6, id_miesiac: 1 },
      { id: 10, temperatura: -12, id_miejscowosc: 1, id_miesiac: 2 },
      { id: 11, temperatura: 25, id_miejscowosc: 5, id_miesiac: 7 },
      { id: 12, temperatura: 30, id_miejscowosc: 9, id_miesiac: 7 },
      { id: 13, temperatura: 33, id_miejscowosc: 2, id_miesiac: 7 },
      { id: 14, temperatura: 15, id_miejscowosc: 9, id_miesiac: 9 },
      { id: 16, temperatura: 24, id_miejscowosc: 9, id_miesiac: 6 },
      { id: 17, temperatura: -4, id_miejscowosc: 8, id_miesiac: 4 },
      { id: 18, temperatura: 17, id_miejscowosc: 6, id_miesiac: 6 },
      { id: 19, temperatura: 23, id_miejscowosc: 10, id_miesiac: 5 },
      { id: 20, temperatura: 16, id_miejscowosc: 2, id_miesiac: 4 },
      { id: 21, temperatura: 21, id_miejscowosc: 8, id_miesiac: 7 },
      { id: 22, temperatura: 2, id_miejscowosc: 6, id_miesiac: 1 },
      { id: 23, temperatura: 7, id_miejscowosc: 8, id_miesiac: 2 },
      { id: 24, temperatura: 13, id_miejscowosc: 10, id_miesiac: 3 },
      { id: 25, temperatura: 14, id_miejscowosc: 10, id_miesiac: 4 },
      { id: 26, temperatura: 19, id_miejscowosc: 9, id_miesiac: 5 },
      { id: 27, temperatura: 22, id_miejscowosc: 8, id_miesiac: 6 },
      { id: 28, temperatura: 32, id_miejscowosc: 7, id_miesiac: 7 },
      { id: 29, temperatura: 27, id_miejscowosc: 6, id_miesiac: 8 },
      { id: 30, temperatura: 19, id_miejscowosc: 5, id_miesiac: 9 },
      { id: 31, temperatura: 11, id_miejscowosc: 4, id_miesiac: 10 },
      { id: 32, temperatura: 4, id_miejscowosc: 3, id_miesiac: 11 },
      { id: 33, temperatura: -8, id_miejscowosc: 2, id_miesiac: 12 },
      { id: 34, temperatura: 35, id_miejscowosc: 3, id_miesiac: 7 },
      { id: 35, temperatura: 12, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 36, temperatura: 33, id_miejscowosc: 3, id_miesiac: 8 },
      { id: 37, temperatura: 15, id_miejscowosc: 3, id_miesiac: 4 },
      { id: 38, temperatura: 17, id_miejscowosc: 3, id_miesiac: 8 },
      { id: 39, temperatura: 22, id_miejscowosc: 9, id_miesiac: 4 },
      { id: 40, temperatura: 15, id_miejscowosc: 10, id_miesiac: 8 },
      { id: 41, temperatura: 15, id_miejscowosc: 7, id_miesiac: 4 },
    ],
  })

  console.log('Seed data inserted successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 4: Run seed script**

```bash
npx prisma db seed
```

Expected: "Seed data inserted successfully"

- [ ] **Step 5: Verify data in database**

```bash
npx prisma studio
```

Expected: Tables populated with data

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add Prisma seed script with test data"
```

---

### Task 4: Copy Static Assets

**Files:**
- Create: `public/słońce.png`
- Create: `public/deszcz.png`
- Create: `public/słońcechmura.png`
- Create: `src/app/styl.css`

**Interfaces:**
- Consumes: Existing assets from root directory
- Produces: Assets available in Next.js public/app directories

- [ ] **Step 1: Create public directory**

```bash
mkdir public
```

- [ ] **Step 2: Copy weather icons**

```bash
cp "słońce.png" public/
cp "deszcz.png" public/
cp "słońcechmura.png" public/
```

- [ ] **Step 3: Copy CSS to src/app**

```bash
cp styl.css src/app/styl.css
```

- [ ] **Step 4: Import CSS in layout.tsx**

Modify `src/app/layout.tsx`:

```tsx
import './styl.css'

export const metadata = {
  title: 'Pogoda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add public/ src/app/styl.css src/app/layout.tsx
git commit -m "feat: copy static assets and CSS"
```

---

### Task 5: Create Main Page Component

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Prisma client, database with seeded data
- Produces: Rendered weather page with table and averages

- [ ] **Step 1: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create weather icon helper function**

Add to `src/app/page.tsx`:

```typescript
function getWeatherIcon(temperatura: number): string {
  if (temperatura > 30) return 'słońce.png'
  if (temperatura < 26) return 'deszcz.png'
  return 'słońcechmura.png'
}
```

- [ ] **Step 3: Create main page component**

```tsx
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
```

- [ ] **Step 4: Test the page**

```bash
npm run dev
```

Expected: Page loads with July temperatures by default, clicking months changes the view

- [ ] **Step 5: Test month selection**

Navigate to `http://localhost:3000/?id_miesiaca=1` - should show January data

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/lib/prisma.ts
git commit -m "feat: implement main page with weather table and averages"
```

---

### Task 6: Final Testing and Verification

**Files:**
- No new files (verification only)

**Interfaces:**
- Consumes: Complete application from Tasks 1-5
- Produces: Verified working application

- [ ] **Step 1: Test all months**

Navigate through each month link (1-12) and verify:
- Table shows correct cities for that month
- Average temperature displays correctly
- Weather icons match temperature logic

- [ ] **Step 2: Test default state**

Navigate to `http://localhost:3000` - should show July data (id_miesiaca=7)

- [ ] **Step 3: Verify CSS styling**

Check that:
- Green headers display correctly
- Table has dashed border
- Links change color on hover
- Footer shows at bottom

- [ ] **Step 4: Run build to check for errors**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete PHP to Next.js conversion"
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| 1 | Initialize Next.js | package.json, tsconfig.json, next.config.js, layout.tsx, page.tsx |
| 2 | Configure Prisma | schema.prisma, .env, package.json |
| 3 | Seed database | seed.ts, package.json |
| 4 | Copy assets | public/*.png, styl.css, layout.tsx |
| 5 | Create main page | page.tsx, prisma.ts |
| 6 | Final testing | None (verification) |

Total estimated time: 30-45 minutes
