/**
 * Export data as a CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) return;

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({ key: key as keyof T, label: String(key) }));

  // Build CSV content
  const header = cols.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
        if (val instanceof Date) return `"${val.toISOString()}"`;
        return `"${String(val)}"`;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");

  // Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
