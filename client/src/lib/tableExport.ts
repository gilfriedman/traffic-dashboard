export function tableToTsv(container: HTMLElement): string {
  const table = container.querySelector('table');
  if (!table) return '';
  return Array.from(table.querySelectorAll('tr'))
    .map((row) =>
      Array.from(row.querySelectorAll('th, td'))
        .map((cell) => (cell.textContent ?? '').trim().replace(/\s+/g, ' '))
        .join('\t')
    )
    .join('\n');
}

export async function copyTableAsTsv(container: HTMLElement): Promise<void> {
  await navigator.clipboard.writeText(tableToTsv(container));
}
