import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';

const rows = JSON.parse(readFileSync(new URL('../src/features/prescriptions/data/medications.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/features/prescriptions/medicationCatalog.ts', import.meta.url), 'utf8');
const runtime = ts.transpile(source.replace("import rows from './data/medications.json';", ''), { module: ts.ModuleKind.ESNext });
const context = { rows };
runInNewContext(runtime.replace(/^export /gm, '') + '\nthis.api = { searchMedicationCatalog, mergeMedicationResults, getMedicationDefaults };', context);
const { searchMedicationCatalog: search, mergeMedicationResults: merge, getMedicationDefaults: defaults } = context.api;

test('all 442 source rows are retained across 387 unique entries', () => {
  assert.equal(rows.length, 387);
  const sourceRows = rows.flatMap(row => row.sourceRows);
  assert.equal(new Set(sourceRows).size, 442);
  assert.equal(Math.min(...sourceRows), 2);
  assert.equal(Math.max(...sourceRows), 443);
});

test('search retains dosage forms and distinct regimens', () => {
  assert.equal(search('  avazir  ').filter(item => item.name === 'AVAZIR').length, 2);
  assert.equal(search('avazir ointment')[0].catalog.form, 'Eye Ointment');
  assert.equal(search('TRAVONORM').length, 2);
  assert.equal(search('benox').filter(item => item.name === 'BENOX').length, 1);
});

test('daily and hourly defaults preserve source instructions and optional duration', () => {
  const daily = defaults(search('ACANTHAPROP')[0].catalog);
  assert.equal(daily.frequency, 4);
  assert.equal(daily.duration, 7);
  assert.equal(daily.dosage, 'نقطة إلى نقطتين');
  assert.equal(defaults(search('ALFABRIMO')[0].catalog).duration, undefined);
  const hourly = defaults(search('TOBRADEX drops')[0].catalog);
  assert.equal(hourly.frequency, 2);
  assert.equal(hourly.frequencyUnit, 'hourly');
  assert.equal(hourly.duration, 2);
  assert.equal(hourly.staged, true);
  assert.ok(hourly.instructions.includes('ثم'));
});

test('conflicting or absent frequency requires doctor input', () => {
  const conflicting = search('CONJYCLEAR').find(item => item.catalog.doseText.includes('مرتين'));
  assert.equal(defaults(conflicting.catalog).frequency, undefined);
  assert.equal(defaults(conflicting.catalog).frequencyConflict, true);
  assert.equal(defaults(search('TOBRADEX ointment')[0].catalog).frequency, undefined);
  assert.equal(defaults(search('B.S.S')[0].catalog).frequency, undefined);
  assert.equal(defaults(search('B.S.S')[0].catalog).type, 'other');
});

test('catalog wins over name-only history while preserving other results', () => {
  const local = search('avazir').filter(item => item.name === 'AVAZIR');
  const result = merge(local, [{ name: 'avazir', source: 'doctor' }, { name: 'Custom', source: 'doctor' }]);
  assert.equal(result.length, 3);
  assert.equal(result[0].catalog.form, 'Eye Drops');
  assert.equal(result[2].name, 'Custom');
});
