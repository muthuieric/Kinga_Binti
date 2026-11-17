export type Category = 'fgm' | 'child_marriage' | 'other' | 'none';

export const CATEGORY_LABEL: Record<Category, string> = {
  fgm: 'FGM',
  child_marriage: 'Child marriage',
  other: 'Other harmful norm',
  none: 'No signal',
};

export const SUB_COUNTIES = [
  'Narok North', 'Narok South', 'Narok East', 'Narok West', 'Trans Mara West', 'Trans Mara East',
  'Kajiado Central', 'Kajiado North', 'Kajiado South', 'Kajiado East', 'Kajiado West',
];

export const AGE_BANDS = ['Under 18', '18–25', '26–35', '36–50', '50+'];
export const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'];
export const LABELS = ['FGM', 'Child marriage', 'Other', 'None'];
