export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function formatLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDayStrip(dateStr: string): { day: string; date: number } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
    date: d.getDate(),
  };
}

export function formatSectionHeader(dateStr: string, today: string): string {
  if (dateStr === today) return `TODAY  ·  ${formatLong(dateStr)}`;
  if (dateStr === addDays(today, 1)) return `TOMORROW  ·  ${formatLong(dateStr)}`;
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase()}  ·  ${formatLong(dateStr)}`;
}

export function formatCardDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// Derives a stable 8-digit booking reference from any reservation ID string
export function toBookingRef(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (((h << 5) + h) ^ id.charCodeAt(i)) >>> 0;
  }
  return String(10000000 + (h % 90000000));
}

// "14:00" → "2pm", "11:30" → "11:30am"
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}
