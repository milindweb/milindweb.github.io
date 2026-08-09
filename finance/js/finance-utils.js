// finance/js/finance-utils.js — formatting helpers

function fmt(n) {
  if (n === undefined || n === null || n === '') return '0';
  var num = Number(n);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

function fmtShort(n) {
  var num = Number(n);
  if (isNaN(num)) return '0';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDateForInput(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  var s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var parts = s.split(/[/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return parts[0] + '-' + parts[1].padStart(2,'0') + '-' + parts[2].padStart(2,'0');
    if (parts[2].length === 4) return parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0');
  }
  return s;
}
