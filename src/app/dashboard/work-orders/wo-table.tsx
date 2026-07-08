"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { getWorkOrdersPage } from "@/lib/work-orders-query";
import { priPillClass, priLabel } from "@/lib/wo-status";
import { STATUS_OPTIONS, STATUS_PILL_CLASS_FULL, statusLabel } from "@/lib/status-options";
import type { WoStatus } from "@/generated/prisma/enums";
import { updateWorkOrderStatus } from "@/app/actions/work-orders";

type Row = Awaited<ReturnType<typeof getWorkOrdersPage>>["rows"][number];

function fmtDate(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WoTable({ rows, canEdit }: { rows: Row[]; canEdit: boolean }) {
  const [selected, setSelected] = useState<Row | null>(null);

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>WO No.</th>
              <th>Priority</th>
              <th>Description</th>
              <th>Plant</th>
              <th>Location</th>
              <th>Asset</th>
              <th>Team</th>
              <th>Supervisor</th>
              <th>Status (ไฟล์)</th>
              <th>Status (ผู้ใช้งาน)</th>
              <th>Target Start</th>
              <th>Target Finish</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} style={{ textAlign: "center" }}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.wo} onClick={() => setSelected(r)}>
                <td style={{ color: "var(--primary)", fontWeight: 600 }}>{r.wo}</td>
                <td>
                  <span className={`pill ${priPillClass(r.priority)}`}>
                    {priLabel(r.priority)}
                  </span>
                </td>
                <td
                  style={{
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={r.desc ?? ""}
                >
                  {r.desc}
                </td>
                <td>{r.plant || "-"}</td>
                <td>{r.location || "-"}</td>
                <td>{r.asset || "-"}</td>
                <td>{r.team || "-"}</td>
                <td style={{ fontSize: 11 }}>{r.supervisor || "-"}</td>
                <td>
                  <span
                    className="pill pill-notstart"
                    style={{ fontFamily: "monospace", fontSize: 10 }}
                  >
                    {r.status || "-"}
                  </span>
                </td>
                <td>
                  {r.update ? (
                    <span className={`pill ${STATUS_PILL_CLASS_FULL[r.update.status]}`}>
                      {statusLabel(r.update.status)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{fmtDate(r.targetStart)}</td>
                <td>{fmtDate(r.targetFinish)}</td>
                <td>
                  {r.overdue === "Overdue" ? (
                    <span className="pill pill-high">Overdue</span>
                  ) : (
                    <span className="pill pill-low">On due</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <WoDetailDrawer
          row={selected}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function WoDetailDrawer({
  row,
  canEdit,
  onClose,
}: {
  row: Row;
  canEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [chosenStatus, setChosenStatus] = useState<WoStatus>(
    row.update?.status ?? "NOT_START"
  );
  const [progress, setProgress] = useState(row.update?.progress ?? 0);
  const [remark, setRemark] = useState(row.update?.remark ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateWorkOrderStatus({ wo: row.wo, status: chosenStatus, progress, remark });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="wo-detail-panel">
      <div className="wo-detail-head-bar">
        <div className="wo-id">{row.wo}</div>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="wo-desc">{row.desc}</div>

      <div className="wo-field">
        <span className="k">Plant</span>
        <span className="v">{row.plant || "-"}</span>
      </div>
      <div className="wo-field">
        <span className="k">Team</span>
        <span className="v">{row.team || "-"}</span>
      </div>
      <div className="wo-field">
        <span className="k">Location / Asset</span>
        <span className="v">
          {row.location || "-"} {row.asset ? `/ ${row.asset}` : ""}
        </span>
      </div>
      <div className="wo-field">
        <span className="k">Target Start</span>
        <span className="v">{fmtDate(row.targetStart)}</span>
      </div>
      <div className="wo-field">
        <span className="k">Target Finish</span>
        <span className="v">{fmtDate(row.targetFinish)}</span>
      </div>

      {canEdit ? (
        <>
          <div className="wo-section-label">เลือกสถานะใหม่</div>
          <div className="qu-grid">
            {STATUS_OPTIONS.map((s) => (
              <div
                key={s.key}
                className={`qu-item${chosenStatus === s.key ? " sel" : ""}`}
                onClick={() => {
                  setChosenStatus(s.key);
                  if (s.key === "COMPLETED") setProgress(100);
                }}
              >
                <div className="ic" style={{ background: s.bg, color: s.fg }}>
                  {s.icon}
                </div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="wo-section-label">Progress (%)</div>
          <input
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value, 10) || 0)}
          />

          <div className="wo-section-label">Remark</div>
          <textarea
            placeholder="พิมพ์ความคืบหน้า ปัญหาที่พบ หรือของที่รออยู่..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <button className="wo-btn" disabled={isPending} onClick={save}>
            {isPending ? "กำลังบันทึก..." : "บันทึกอัปเดต"}
          </button>
          {saved && !isPending && (
            <div style={{ color: "var(--green)", fontSize: 12, marginTop: 8 }}>
              ✅ บันทึกแล้ว
            </div>
          )}
        </>
      ) : (
        row.update && (
          <>
            <div className="wo-field">
              <span className="k">Status</span>
              <span className="v">
                <span className={`pill ${STATUS_PILL_CLASS_FULL[row.update.status]}`}>
                  {statusLabel(row.update.status)}
                </span>
              </span>
            </div>
            <div className="wo-field">
              <span className="k">Progress</span>
              <span className="v">{row.update.progress}%</span>
            </div>
            {row.update.remark && (
              <>
                <div className="wo-section-label">Remark</div>
                <p style={{ fontSize: 12.5 }}>{row.update.remark}</p>
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
