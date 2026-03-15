/**
 * parseDlsCsv
 *
 * Parses a delimited string (CSV or TSV) into ImportDlsDeclarationRequest objects.
 * Auto-detects tab vs comma separator from the first line — use tab when the
 * data is pasted directly from a spreadsheet.
 * Column headers are matched flexibly against known keywords — they may appear
 * in any order and only a partial match is required:
 *
 *   name           → user | name | villain
 *   bibNumber      → bib  | num  | #
 *   isFirstDls     → first | 1st | dls   (only truthy: y/yes/1/true)
 *   isGoingForKills→ kill                (only truthy: y/yes/1/true)
 *   comments       → comment | note | info | detail | other
 */

import type { ImportDlsDeclarationRequest } from '../../../models';

// ── Internal types ───────────────────────────────────────────────────

type FieldKey = keyof ImportDlsDeclarationRequest;

interface ColMap {
	name?: number;
	bibNumber?: number;
	isFirstDls?: number;
	isGoingForKills?: number;
	comments?: number;
}

export interface ParseDlsCsvResult {
	/** Successfully parsed rows ready to send to the API */
	rows: ImportDlsDeclarationRequest[];
	/** Number of data rows skipped due to a missing / invalid bib number */
	skipped: number;
	/** Non-fatal issues discovered during parsing */
	warnings: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Returns true for y / yes / 1 / true (case-insensitive) */
function isTruthy(raw: string): boolean {
	const v = raw.trim().toLowerCase();
	return v === 'y' || v === 'yes' || v === '1' || v === 'true';
}

/** Strips an optional leading '#' and parses the integer, returns null on failure */
function parseBib(raw: string): number | null {
	const cleaned = raw.trim().replace(/^#/, '').trim();
	if (!cleaned) return null;
	const n = parseInt(cleaned, 10);
	return isNaN(n) ? null : n;
}

/**
 * Maps a single header string to a field key.
 * Checks in priority order so 'kills' doesn't also match 'isFirstDls'
 * and 'bib number' doesn't also match 'name'.
 */
function matchHeader(header: string): FieldKey | null {
	const h = header.toLowerCase();
	if (h.includes('kill')) return 'isGoingForKills';
	if (h.includes('first') || h.includes('1st')) return 'isFirstDls';
	if (h.includes('bib') || h.includes('#')) return 'bibNumber';
	// 'num' matches after 'bib' so we don't accidentally capture 'name'
	if (h.includes('num')) return 'bibNumber';
	if (h.includes('comment') || h.includes('note') || h.includes('info') || h.includes('detail') || h.includes('other')) return 'comments';
	if (h.includes('user') || h.includes('name') || h.includes('villain')) return 'name';
	// 'dls' on its own (when not part of another match) → isFirstDls
	if (h.includes('dls')) return 'isFirstDls';
	return null;
}

/**
 * Detects whether a line uses tabs or commas as its delimiter.
 * Prefers tab if the line contains at least one tab character.
 */
function detectDelimiter(line: string): '\t' | ',' {
	return line.includes('\t') ? '\t' : ',';
}

/**
 * Splits a single row into cells using the given delimiter.
 * For comma-delimited data, respects double-quoted fields (including escaped
 * quotes represented as ""). Tab-delimited data from spreadsheets is split
 * directly without quote handling.
 */
function splitRow(line: string, delimiter: '\t' | ','): string[] {
	if (delimiter === '\t') {
		return line.split('\t');
	}
	// Comma: quote-aware split
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote inside a quoted field
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Parses a CSV string (with a header row) into an array of
 * ImportDlsDeclarationRequest objects.
 *
 * Rows that have a missing or non-numeric bib number are skipped and
 * counted in the `skipped` field of the result.
 */
export function parseDlsCsv(csvText: string): ParseDlsCsvResult {
	const warnings: string[] = [];
	const rows: ImportDlsDeclarationRequest[] = [];

	// Split into lines, discard lines that are entirely whitespace
	const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

	if (lines.length === 0) {
		return { rows, skipped: 0, warnings: ['The file appears to be empty'] };
	}
	if (lines.length < 2) {
		return { rows, skipped: 0, warnings: ['No data rows found (only a header row)'] };
	}

	// Detect delimiter from the first line
	const delimiter = detectDelimiter(lines[0]);

	// Map header → column index (first match wins per field)
	const headers = splitRow(lines[0], delimiter);
	const colMap: ColMap = {};
	headers.forEach((h, i) => {
		const field = matchHeader(h) as keyof ColMap | null;
		if (field !== null && colMap[field] === undefined) {
			colMap[field] = i;
		}
	});

	if (colMap.bibNumber === undefined) {
		warnings.push('No bib number column was detected — all rows will be skipped. Expected a header containing "bib", "num", or "#".');
	}

	let skipped = 0;

	for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
		const cells = splitRow(lines[lineIdx], delimiter);

		// Skip rows where every cell is empty (e.g. a blank row in the middle of a TSV paste)
		if (cells.every((c) => c.trim() === '')) continue;

		// bib is required
		const bibRaw = colMap.bibNumber !== undefined ? (cells[colMap.bibNumber] ?? '') : '';
		const bib = parseBib(bibRaw);
		if (bib === null) {
			skipped++;
			continue;
		}

		const row: ImportDlsDeclarationRequest = {
			bibNumber: bib,
		};

		if (colMap.name !== undefined) {
			const v = (cells[colMap.name] ?? '').trim();
			if (v) row.name = v;
		}
		if (colMap.isFirstDls !== undefined) {
			row.isFirstDls = isTruthy(cells[colMap.isFirstDls] ?? '');
		}
		if (colMap.isGoingForKills !== undefined) {
			row.isGoingForKills = isTruthy(cells[colMap.isGoingForKills] ?? '');
		}
		if (colMap.comments !== undefined) {
			const v = (cells[colMap.comments] ?? '').trim();
			if (v) {
				row.comments = v
				// If the comments contain the word "first" or "1st", but the isFirstDls column wasn't found then assume it's a first DLS declaration and set that flag (with a warning since this is just a guess)
				if (colMap.isFirstDls === undefined && /(^|\s)(first|1st)(\s|$)/i.test(v)) {
					row.isFirstDls = true;
					warnings.push(`Row ${lineIdx + 1}: Detected "first" in comments, assuming this is a first DLS declaration since no dedicated column was found. Please verify this row was parsed correctly.`);
				}
				// If the comments contain the word "kill", but the isGoingForKills column wasn't found then assume it's a kills declaration and set that flag (with a warning since this is just a guess)
				if (colMap.isGoingForKills === undefined && /(^|\s)kill(s)?(\s|$)/i.test(v)) {
					row.isGoingForKills = true;
					warnings.push(`Row ${lineIdx + 1}: Detected "kill" in comments, assuming this declaration is going for kills since no dedicated column was found. Please verify this row was parsed correctly.`);
				}
			};
		}

		rows.push(row);
	}

	return { rows, skipped, warnings };
}
