/**
 * Passive formatting utility for terminal-style UI
 * Transforms an ISO date string into: [ YYYY.MM.DD :: HH:MM:SS ]
 */
export function formatTerminalDate(isoString) {
  if (!isoString) return '[ NULL ]';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '[ INVALID_DATE ]';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `[ ${yyyy}.${mm}.${dd} :: ${hh}:${min}:${ss} ]`;
  } catch (err) {
    return '[ PARSE_ERROR ]';
  }
}
