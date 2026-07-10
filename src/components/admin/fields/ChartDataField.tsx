'use client';

import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { clsx } from '@/lib/clsx';

export interface ChartData {
  headers: string[];
  rows: (string | number)[][];
}

const EMPTY: ChartData = { headers: ['Category', 'Value'], rows: [] };

/**
 * Editable data grid for the Chart block. Editors add/remove rows and columns
 * and type cell values directly, or upload an Excel/CSV to replace the grid.
 * Column 0 is the category label; remaining columns are numeric series.
 */
export function ChartDataField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: ChartData | undefined;
  onChange: (v: ChartData) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const data: ChartData = value && Array.isArray(value.headers) && Array.isArray(value.rows) ? value : EMPTY;
  const colCount = data.headers.length;

  const setHeader = (i: number, v: string) => {
    const headers = data.headers.slice();
    headers[i] = v;
    onChange({ ...data, headers });
  };
  const setCell = (r: number, cRaw: number, v: string) => {
    const rows = data.rows.map((row) => row.slice());
    // Column 0 stays a string label; series columns coerce to a number when numeric.
    rows[r][cRaw] = cRaw === 0 ? v : v === '' ? '' : Number.isNaN(Number(v)) ? v : Number(v);
    onChange({ ...data, rows });
  };
  const addRow = () => onChange({ ...data, rows: [...data.rows, Array.from({ length: colCount }, (_, i) => (i === 0 ? '' : 0))] });
  const removeRow = (r: number) => onChange({ ...data, rows: data.rows.filter((_, i) => i !== r) });
  const addColumn = () => onChange({
    headers: [...data.headers, `Series ${colCount}`],
    rows: data.rows.map((row) => [...row, 0]),
  });
  const removeColumn = (c: number) => {
    if (colCount <= 2) return; // keep at least category + one series
    onChange({
      headers: data.headers.filter((_, i) => i !== c),
      rows: data.rows.map((row) => row.filter((_, i) => i !== c)),
    });
  };

  const onFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return;
    // header:1 → array-of-arrays; first row is headers, the rest are data rows.
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, blankrows: false });
    if (matrix.length === 0) return;
    const headers = (matrix[0] ?? []).map((h) => String(h ?? ''));
    const rows = matrix.slice(1).map((row) =>
      headers.map((_, i) => {
        const cell = row[i];
        if (i === 0) return cell === undefined || cell === null ? '' : String(cell);
        if (cell === undefined || cell === null || cell === '') return '';
        return Number.isNaN(Number(cell)) ? cell : Number(cell);
      }),
    );
    onChange({ headers: headers.length ? headers : EMPTY.headers, rows });
  };

  const inputCls = 'w-full rounded border border-ink/15 px-1.5 py-1 text-xs';

  return (
    <div className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink/70">{label}</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-navy/40 px-2 py-0.5 text-[11px] font-medium text-navy hover:bg-navy/5"
        >
          Upload Excel / CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-ink/15">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-6 border-b border-ink/10 bg-paper/60" />
              {data.headers.map((h, c) => (
                <th key={c} className="border-b border-l border-ink/10 bg-paper/60 p-1">
                  <div className="flex items-center gap-1">
                    <input
                      className={clsx(inputCls, 'font-medium')}
                      value={h}
                      placeholder={c === 0 ? 'Label' : `Series ${c}`}
                      onChange={(e) => setHeader(c, e.target.value)}
                    />
                    {c > 0 && colCount > 2 && (
                      <button type="button" title="Remove column" onClick={() => removeColumn(c)} className="text-ink/30 hover:text-magenta">✕</button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, r) => (
              <tr key={r}>
                <td className="border-b border-ink/10 text-center align-middle">
                  <button type="button" title="Remove row" onClick={() => removeRow(r)} className="px-1 text-ink/30 hover:text-magenta">✕</button>
                </td>
                {data.headers.map((_, c) => (
                  <td key={c} className="border-b border-l border-ink/10 p-1">
                    <input
                      className={inputCls}
                      inputMode={c === 0 ? 'text' : 'decimal'}
                      value={String(row[c] ?? '')}
                      onChange={(e) => setCell(r, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr><td colSpan={colCount + 1} className="p-3 text-center text-[11px] text-ink/40">No rows yet — add one below or upload a file.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex gap-2">
        <button type="button" onClick={addRow} className="flex-1 rounded-md border border-dashed border-navy/40 py-1 text-[11px] font-medium text-navy hover:bg-navy/5">+ Row</button>
        <button type="button" onClick={addColumn} className="flex-1 rounded-md border border-dashed border-navy/40 py-1 text-[11px] font-medium text-navy hover:bg-navy/5">+ Column (series)</button>
      </div>
      {help && <span className="mt-1 block text-[11px] text-ink/40">{help}</span>}
    </div>
  );
}
