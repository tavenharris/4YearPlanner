export const MINOR_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'MIS', label: 'Management Information Systems' },
];

export const MINOR_LABELS = MINOR_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export function normalizeMajor(major, majorOptions = []) {
  if (!major) return majorOptions.length > 0 ? majorOptions[0].value : 'CSCI';
  if (majorOptions.some(o => o.value === major)) return major;
  const matchLabel = majorOptions.find(o => o.label === major);
  if (matchLabel) return matchLabel.value;
  return majorOptions.length > 0 ? majorOptions[0].value : 'CSCI';
}

export function normalizeMinor(minor) {
  if (!minor) return 'None';
  if (MINOR_OPTIONS.some(o => o.value === minor)) return minor;
  const matchLabel = MINOR_OPTIONS.find(o => o.label === minor);
  if (matchLabel) return matchLabel.value;
  return 'None';
}
