export function detectCategory(row: { desc: string | null; woType: string | null }): string {
  const woType = (row.woType || "").trim();
  if (woType) return woType; // actual column wins

  const d = (row.desc || "").toUpperCase();
  if (/\bSAFETY\b|\(SAFETY\)/.test(d)) return "Safety";
  if (/WELD|เชื่อม|OVERLAY|CLAMP/.test(d)) return "Welding";
  if (/\bPM\b|PREVENTIVE|PREVENTIF|LUBRICATION/.test(d)) return "PM";
  if (/SOOT.?BLOW|SOOTBLOW/.test(d)) return "Soot Blow";
  if (/LEAK|รั่ว|LEAKAGE/.test(d)) return "Leak Repair";
  if (/CHANGE|REPLACE|INSTALL|เปลี่ยน|ติดตั้ง/.test(d)) return "Change/Replace";
  if (/REPAIR|FIX|RESTORE|ซ่อม|แก้ไข|OVERHAUL/.test(d)) return "Repair";
  if (/CLEAN|ล้าง|ทำความสะอาด|FLUSH|WASH/.test(d)) return "Clean";
  if (/INSPECT|CHECK|MONITOR|MEASURE|CALIBR|ตรวจ|เช็ค|VIBRAT|THERMO/.test(d))
    return "Inspect/Check";
  if (/ADJUST|ALIGN|ปรับ|BALANCE/.test(d)) return "Adjust/Align";
  return "Other";
}
