import rows from './data/medications.json';

export interface CatalogMedication {
  id: string;
  name: string;
  form: string;
  doseText: string;
  frequencyText: string;
  durationText: string;
  sourceRows: number[];
}

export interface MedicationSearchResult {
  name: string;
  source: 'catalog' | 'pharco' | 'doctor';
  suggestion?: boolean;
  catalog?: CatalogMedication;
}

export const medicationCatalog: CatalogMedication[] = rows;

const dailyFrequencies: Record<string, number> = {
  'مرة واحدة يوميًا': 1,
  'مرتين يوميًا': 2,
  'مرتين يوميا': 2,
  'ثلاث مرات يوميًا': 3,
  'أربع مرات يوميًا': 4,
  'خمس مرات يوميًا': 5,
};
const durations: Record<string, number> = {
  'سبعه ايام': 7,
  'اول يومين': 2,
  'أول يومين': 2,
  'اربع ايام': 4,
  'أسبوعين': 14,
};

export function searchMedicationCatalog(query: string): MedicationSearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return medicationCatalog.filter(item => {
    const text = `${item.name} ${item.form}`.toLowerCase();
    return terms.every(term => text.includes(term));
  }).map(catalog => ({ name: catalog.name, source: 'catalog', catalog }));
}

export function mergeMedicationResults(local: MedicationSearchResult[], remote: MedicationSearchResult[]) {
  const catalogNames = new Set(local.map(item => item.name.toLowerCase()));
  return [...local, ...remote.filter(item => !catalogNames.has(item.name.toLowerCase()))];
}

export function getMedicationDefaults(item: CatalogMedication) {
  const form = item.form.toLowerCase();
  let type = 'other';
  if (form.includes('drops') || form.includes('ophthalmic')) type = 'eyedrop';
  else if (form.includes('ointment')) type = 'ointment';
  else if (form.includes('tablets')) type = 'tablet';
  else if (form.includes('capsules')) type = 'capsule';
  else if (form.includes('injection')) type = 'injection';

  // Preserve the full source regimen in instructions, including tapering and concentrations.
  let dosage = '';
  if (item.doseText.includes('نقطة إلى نقطتين')) dosage = 'نقطة إلى نقطتين';
  else if (item.doseText.includes('نقطة واحدة')) dosage = 'نقطة واحدة';
  else if (item.doseText.includes('طبقة صغيرة')) dosage = 'طبقة صغيرة';
  else if (item.doseText.startsWith('قرص واحد (250 مجم)')) dosage = 'قرص واحد (250 مجم)';
  else if (item.doseText.startsWith('كبسولة/قرص واحد')) dosage = 'كبسولة/قرص واحد';

  // These source rows disagree between the frequency column and the dose text.
  const frequencyConflict =
    (item.frequencyText === 'مرة واحدة يوميًا' && item.doseText.includes('مرتين يوميًا')) ||
    (item.frequencyText === 'كل ساعتين' && item.doseText.includes('كل 3-4 ساعات'));
  const frequency = frequencyConflict ? undefined
    : item.frequencyText === 'كل ساعتين' ? 2 : dailyFrequencies[item.frequencyText];

  return {
    type,
    dosage,
    frequency,
    frequencyUnit: item.frequencyText === 'كل ساعتين' ? 'hourly' : 'daily',
    duration: durations[item.durationText],
    instructions: `${item.form} — ${item.doseText}`,
    frequencyConflict,
    staged: /ثم|تقليل الجرعة|تقليل التكرار/.test(item.doseText),
  };
}
