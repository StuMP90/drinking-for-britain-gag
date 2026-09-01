/**
 * Format a date string to UK standard: DD/MM/YYYY.
 * Handles ISO 8601, date-only strings, and null/undefined gracefully.
 */
export function fmtDate(value: string | null | undefined): string {
    if (!value) return '—';

    // Parse without converting timezones — treat date-only strings as local
    const d = value.includes('T')
        ? new Date(value)
        : new Date(value + 'T00:00:00');

    if (isNaN(d.getTime())) return value;

    return d.toLocaleDateString('en-GB', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric',
    });
}

/**
 * Format a datetime string to UK standard: DD/MM/YYYY HH:mm.
 * Use only when the time component is meaningful.
 */
export function fmtDateTime(value: string | null | undefined): string {
    if (!value) return '—';

    const d = new Date(value);
    if (isNaN(d.getTime())) return value;

    return d.toLocaleString('en-GB', {
        day:    '2-digit',
        month:  '2-digit',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
    });
}
