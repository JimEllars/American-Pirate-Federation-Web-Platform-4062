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

/**
 * HTML Sanitizer Utility
 * Strips HTML tags using Regex and unescapes standard HTML entities.
 */
export function stripHtml(htmlString) {
  if (!htmlString) return '';

  // Strip HTML tags
  let text = htmlString.replace(/<\/?[^>]+(>|$)/g, '');

  // Unescape standard HTML entities
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8211;': '-',
    '&#8212;': '-',
    '&nbsp;': ' '
  };

  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#8217;|&#8216;|&#8211;|&#8212;|&nbsp;/g, match => entities[match] || match);
}
