'use strict';

function numericVersion(value) {
  return String(value || '')
    .replace(/^v/i, '')
    .split(/[.-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(candidate, current) {
  const next = numericVersion(candidate);
  const installed = numericVersion(current);

  for (let index = 0; index < 3; index += 1) {
    if (next[index] > installed[index]) return true;
    if (next[index] < installed[index]) return false;
  }
  return false;
}

module.exports = {
  isNewerVersion,
  numericVersion
};
