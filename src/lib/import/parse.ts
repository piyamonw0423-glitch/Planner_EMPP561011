import * as XLSX from "xlsx";

export type ParsedWorkOrder = {
  wo: string;
  desc: string | null;
  location: string | null;
  asset: string | null;
  plant: string | null;
  team: string | null;
  priority: string | null;
  statusAJ: string | null;
  status: string | null;
  overdue: string | null;
  supervisor: string | null;
  workLocation: string | null;
  woType: string | null;
  targetStart: Date | null;
  targetFinish: Date | null;
  actualStart: Date | null;
  actualFinish: Date | null;
  dataDate: Date | null;
  plannedHours: number;
  actualHours: number;
};

type RawRow = Record<string, unknown>;

function pick(row: RawRow, keys: string[]): unknown {
  for (const k of keys) {
    for (const realKey of Object.keys(row)) {
      if (realKey.trim().toLowerCase() === k.toLowerCase()) {
        return row[realKey];
      }
    }
  }
  return "";
}

function pickString(row: RawRow, keys: string[]): string | null {
  const v = pick(row, keys);
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

function pickDate(row: RawRow, keys: string[]): Date | null {
  const v = pick(row, keys);
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function pickFloat(row: RawRow, keys: string[]): number {
  const v = pick(row, keys);
  const n = parseFloat(String(v ?? "0"));
  return isNaN(n) ? 0 : n;
}

// Normalize any timestamp to UTC-midnight of the calendar day it DISPLAYS as.
// Google Sheets exports a date cell from a +7 sheet as e.g. 2026-07-03T17:00:00Z
// (which shows as 4/7/2026), so shift +7h before truncating to a day.
function normalizeToDay(d: Date): Date {
  const shifted = new Date(d.getTime() + 7 * 3600 * 1000);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  );
}

// Data_Date arrives in two formats in the sheet: real date cells (ISO) and
// plain text "D/M/YYYY" (e.g. "20/6/2026"). Handle both -> UTC-midnight day.
export function parseDataDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : normalizeToDay(v);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : normalizeToDay(d);
}

export function parseRows(json: RawRow[]): ParsedWorkOrder[] {
  return json
    .map((row): ParsedWorkOrder | null => {
      const wo = pick(row, ["Work Order"]);
      if (!wo) return null;

      return {
        wo: String(wo).trim(),
        desc: pickString(row, ["Description"]),
        location: pickString(row, ["Location"]),
        asset: pickString(row, ["Asset"]),
        plant: pickString(row, ["Plant"]),
        team: pickString(row, ["Team"]),
        priority: pickString(row, ["Priority"]),
        statusAJ: pickString(row, ["Status A-J"]),
        status: pickString(row, ["Status"]),
        overdue: pickString(row, ["Overdue/Ondue"]),
        supervisor: pickString(row, [
          "Namesup",
          "Supervisor",
          "NameSup",
          "NAMESUP",
          "Planner Group",
          "PlannerGroup",
          "Resp Person",
          "RespPerson",
        ]),
        workLocation: pickString(row, [
          "WO_Worklocation",
          "WO_WorkLocation",
          "Work Location",
          "WorkLocation",
        ]),
        woType: pickString(row, [
          "WO_Type",
          "PM_Type",
          "Order Type",
          "WOType",
          "Work Type",
          "Type",
          "MaintenanceType",
          "Activity Type",
          "PM Type",
        ]),
        targetStart: pickDate(row, ["Target Start"]),
        targetFinish: pickDate(row, ["Target Finish"]),
        actualStart: pickDate(row, ["Actual Start"]),
        actualFinish: pickDate(row, ["Actual Finish"]),
        dataDate: parseDataDate(
          pick(row, ["Data_Date", "Data Date", "DataDate", "DATA_DATE", "Data_date"])
        ),
        plannedHours: pickFloat(row, [
          "Planned Hours",
          "PlannedHours",
          "Plan Hours",
          "Hours",
          "Std Hrs",
          "StdHrs",
          "Work Hours",
          "WO_PlannedHrs",
        ]),
        actualHours: pickFloat(row, [
          "Actual Hours",
          "ActualHours",
          "Act Hours",
          "Actual Labor",
          "ActualLabor",
          "Act Hr",
          "ActHours",
          "WO_ActualHrs",
        ]),
      };
    })
    .filter((r): r is ParsedWorkOrder => r !== null);
}

// Memory-light streaming CSV parser: calls onRow for each data row (as an
// object keyed by header) without building a full workbook or holding all rows.
// Handles RFC-4180 quoting ("" escapes, commas/newlines inside quotes).
export function streamCsv(text: string, onRow: (row: RawRow) => void): void {
  let header: string[] | null = null;
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    if (!header) {
      header = row.map((h) => h.trim());
    } else if (row.length > 1 || row[0] !== "") {
      const obj: RawRow = {};
      for (let j = 0; j < header.length; j++) obj[header[j]] = row[j] ?? "";
      onRow(obj);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      endField();
    } else if (c === "\n") {
      endRow();
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length) endRow();
}

export function parseWorkbookBuffer(buffer: ArrayBuffer): ParsedWorkOrder[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  return parseRows(json);
}

export function parseCsvText(text: string): ParsedWorkOrder[] {
  const wb = XLSX.read(text, { type: "string", raw: false, cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  return parseRows(json);
}

export function googleSheetUrlToCsv(inputUrl: string): string {
  let url = inputUrl.trim();
  if (
    url.includes("docs.google.com/spreadsheets") &&
    !url.includes("export") &&
    !url.includes("/pub")
  ) {
    const m = url.match(/\/d\/([^/]+)/);
    if (m) {
      const gidM = url.match(/[?&]gid=(\d+)/);
      const gid = gidM ? gidM[1] : "0";
      url = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
    }
  }
  return url;
}
