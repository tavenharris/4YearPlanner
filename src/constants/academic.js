export const MAJOR_OPTIONS = [
  { value: 'CSCI', label: 'Computer Science' },
  { value: 'CSEN', label: 'Computer Science and Engineering' },
];

export const MINOR_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'MIS', label: 'Management Information Systems' },
];

export const MAJOR_LABELS = MAJOR_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export const MINOR_LABELS = MINOR_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export function normalizeMajor(major) {
  if (!major) return 'CSCI';
  if (MAJOR_OPTIONS.some(o => o.value === major)) return major;
  const matchLabel = MAJOR_OPTIONS.find(o => o.label === major);
  if (matchLabel) return matchLabel.value;
  return 'CSCI';
}

export function normalizeMinor(minor) {
  if (!minor) return 'None';
  if (MINOR_OPTIONS.some(o => o.value === minor)) return minor;
  const matchLabel = MINOR_OPTIONS.find(o => o.label === minor);
  if (matchLabel) return matchLabel.value;
  return 'None';
}
