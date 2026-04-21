export function normalizeMajor(major, majorOptions = []) {
  if (!major) return majorOptions.length > 0 ? majorOptions[0].value : 'CSCI';
  if (majorOptions.some(o => o.value === major)) return major;
  const matchLabel = majorOptions.find(o => o.label === major);
  if (matchLabel) return matchLabel.value;
  return majorOptions.length > 0 ? majorOptions[0].value : 'CSCI';
}

export function normalizeMinor(minor, minorOptions = []) {
  if (!minor) return 'None';
  if (minorOptions.some(o => o.value === minor)) return minor;
  const matchLabel = minorOptions.find(o => o.label === minor);
  if (matchLabel) return matchLabel.value;
  return 'None';
}
