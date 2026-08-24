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
  assert.throws(() => monthlyAverages(daty, temps), /niepełne/)
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
