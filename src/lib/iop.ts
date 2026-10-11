import dayjs from 'dayjs';

export type IopReading = {
  id: string;
  od: number | null;
  os: number | null;
  date: Date;
  formattedDate: string;
  fullDate: string;
  sortTime: number;
  isPending: boolean;
};

type IopSource = {
  _id?: unknown;
  medicalTestId?: unknown;
  category?: string;
  testType?: string;
  status?: string;
  eye?: string;
  iopOD?: unknown;
  iopOS?: unknown;
  testDate?: string | Date;
  createdAt?: string | Date;
};

function readingValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getIopReadings(records: IopSource[], tests: IopSource[]): IopReading[] {
  const readings = new Map<string, IopReading>();

  // Approved tests may also appear as medical records. The record is the canonical copy.
  for (const [index, item] of [...tests, ...records].entries()) {
    if (item.testType !== 'Intraocular Pressure' && item.testType !== 'iop') continue;
    if (item.status && item.status !== 'approved' && item.status !== 'pending_review') continue;

    const od = item.eye === 'Left' ? null : readingValue(item.iopOD);
    const os = item.eye === 'Right' ? null : readingValue(item.iopOS);
    if (od === null && os === null) continue;

    const rawDate = item.testDate || item.createdAt;
    if (!rawDate) continue;
    // A test date is a calendar day, even when the API serializes it at UTC midnight.
    const calendarDate = item.testDate ? (rawDate instanceof Date ? rawDate.toISOString() : String(rawDate)).slice(0, 10) : null;
    const day = calendarDate ? dayjs(calendarDate) : dayjs(rawDate);
    if (!day.isValid() || (calendarDate && day.format('YYYY-MM-DD') !== calendarDate)) continue;

    const id = String(item.medicalTestId || item._id || `unidentified-${index}`);
    const previous = readings.get(id);
    const createdAt = item.createdAt ? dayjs(item.createdAt) : null;
    readings.set(id, {
      id,
      od,
      os,
      date: day.toDate(),
      formattedDate: day.format('MMM DD, YYYY'),
      fullDate: day.format('MMMM DD, YYYY'),
      sortTime: previous?.sortTime ?? (createdAt?.isValid() ? createdAt.valueOf() : day.valueOf()),
      isPending: item.status === 'pending_review',
    });
  }

  return [...readings.values()].sort((a, b) =>
    a.date.getTime() - b.date.getTime() || a.sortTime - b.sortTime || a.id.localeCompare(b.id)
  );
}

export function getIopAverage(readings: IopReading[], eye: 'od' | 'os'): number | null {
  const values = readings.map((reading) => reading[eye]).filter((value): value is number => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}
