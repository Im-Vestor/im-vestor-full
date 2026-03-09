export function generateIcsBuffer(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  url: string;
  description?: string;
}): Buffer {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatDate = (d: Date): string => {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@im-vestor.com`;
  const description = (params.description ?? `Join the meeting: ${params.url}`).replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Im-Vestor//Meeting//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(params.startDate)}`,
    `DTEND:${formatDate(params.endDate)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${description}`,
  ];

  if (params.url?.startsWith('http')) {
    lines.push(`URL:${params.url}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return Buffer.from(lines.join('\r\n'), 'utf-8');
}
