import assert from 'node:assert/strict';
import test from 'node:test';
import { getIopAverage, getIopReadings } from './iop.ts';

test('deduplicates approved readings, shows pending readings, and excludes rejected ones', () => {
  const tests = [
    { _id: 'one', testType: 'Intraocular Pressure', status: 'approved', testDate: '2026-10-08T00:00:00.000Z', eye: 'Right', iopOD: 18, iopOS: 99 },
    { _id: 'two', testType: 'Intraocular Pressure', status: 'approved', testDate: '2026-10-09T00:00:00.000Z', eye: 'Left', iopOS: 20 },
    { _id: 'pending', testType: 'Intraocular Pressure', status: 'pending_review', testDate: '2026-10-10', eye: 'Both', iopOD: 25, iopOS: 25 },
    { _id: 'rejected', testType: 'Intraocular Pressure', status: 'rejected', testDate: '2026-10-10', eye: 'Both', iopOD: 30, iopOS: 30 },
  ];
  const records = [
    { _id: 'record-one', medicalTestId: 'one', category: 'test_result', testType: 'Intraocular Pressure', testDate: '2026-10-08T00:00:00.000Z', eye: 'Right', iopOD: 19 },
  ];

  const readings = getIopReadings(records, tests);
  assert.equal(readings.length, 3);
  assert.deepEqual(readings.map(({ od, os }) => [od, os]), [[19, null], [null, 20], [25, 25]]);
  assert.deepEqual(readings.map(({ isPending }) => isPending), [false, false, true]);
  assert.equal(readings[0].formattedDate, 'Oct 08, 2026');
  assert.equal(getIopAverage(readings.filter((reading) => !reading.isPending), 'od'), 19);
  assert.equal(getIopAverage(readings.filter((reading) => !reading.isPending), 'os'), 20);
});

test('rejects invalid values and dates without inventing a reading', () => {
  const readings = getIopReadings([], [
    { _id: 'blank', testType: 'iop', status: 'approved', testDate: '2026-10-10', iopOD: '', iopOS: null },
    { _id: 'invalid', testType: 'iop', status: 'approved', testDate: '2026-10-10', iopOD: 'NaN', iopOS: -4 },
    { _id: 'no-date', testType: 'iop', status: 'approved', iopOD: 17 },
    { _id: 'valid', testType: 'iop', status: 'approved', testDate: '2026-10-10', eye: 'Both', iopOD: 17 },
  ]);
  assert.equal(readings.length, 1);
  assert.deepEqual([readings[0].od, readings[0].os], [17, null]);
  assert.equal(getIopAverage([], 'od'), null);
});

test('shows a single older pending eye reading when no approved record exists', () => {
  const readings = getIopReadings([], [
    { _id: 'rejected', testType: 'Intraocular Pressure', status: 'rejected', testDate: '2026-06-08T00:00:00.000Z', eye: 'Both', iopOD: 20, iopOS: 20 },
    { _id: 'pending', testType: 'Intraocular Pressure', status: 'pending_review', testDate: '2026-06-08T00:00:00.000Z', eye: 'Left', iopOS: 20 },
  ]);
  assert.equal(readings.length, 1);
  assert.equal(readings[0].os, 20);
  assert.equal(readings[0].od, null);
  assert.equal(readings[0].isPending, true);
});
