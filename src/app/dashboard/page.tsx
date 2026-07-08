import { requireUser } from "@/lib/dal";
import { getOverviewData, getOverviewFilterOptions, type OverviewFilters } from "@/lib/overview-data";
import { TEAM_COLORS } from "@/lib/wo-status";
import { StatusDonut } from "@/components/status-donut";
import { WoTrendChart } from "@/components/wo-trend-chart";
import { BacklogTrendChart } from "@/components/backlog-trend-chart";
import { CategoryDonut } from "@/components/category-donut";
import { OverviewFilterBar } from "./overview-filter-bar";

const KPI_ITEMS = [
  {
    key: "open" as const,
    label: "TOTAL WORK ORDERS",
    icon: "📋",
    grad: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#3b82f6 100%)",
    num: "#1e293b",
  },
  {
    key: "overdue" as const,
    label: "OVERDUE",
    icon: "🔴",
    grad: "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 60%,#ef4444 100%)",
    num: "#b91c1c",
  },
  {
    key: "dueToday" as const,
    label: "DUE TODAY",
    icon: "📅",
    grad: "linear-gradient(135deg,#78350f 0%,#b45309 60%,#f59e0b 100%)",
    num: "#92400e",
  },
  {
    key: "completedToday" as const,
    label: "COMPLETED TODAY",
    icon: "✅",
    grad: "linear-gradient(135deg,#14532d 0%,#15803d 60%,#22c55e 100%)",
    num: "#15803d",
  },
  {
    key: "waitingMaterial" as const,
    label: "WAITING MATERIAL",
    icon: "📦",
    grad: "linear-gradient(135deg,#3b0764 0%,#7c3aed 60%,#a78bfa 100%)",
    num: "#6d28d9",
  },
];

const AGING_ROWS = [
  { color: "#16a34a", label: "0 - 7 วัน", key: "b1" as const },
  { color: "#f59e0b", label: "8 - 30 วัน", key: "b2" as const },
  { color: "#fb923c", label: "31 - 90 วัน", key: "b3" as const },
  { color: "#dc2626", label: "> 90 วัน", key: "b4" as const },
];

const P1_ITEMS = [
  { icon: "📋", label: "P1 ทั้งหมด (Open)", key: "open" as const, color: "#1e40af" },
  { icon: "🔴", label: "P1 Overdue (เกิน Target)", key: "overdue" as const, color: "#dc2626" },
  { icon: "🟢", label: "P1 On Due (ยังอยู่ใน Target)", key: "onDue" as const, color: "#059669" },
  { icon: "⏸", label: "P1 ยังไม่เริ่ม (No Actual Start)", key: "noStart" as const, color: "#d97706" },
  null,
  { icon: "⏱", label: "ค้างนาน > 3 วัน", key: "gt3" as const, color: "#f59e0b" },
  { icon: "⏱", label: "ค้างนาน > 7 วัน", key: "gt7" as const, color: "#fb923c" },
  { icon: "⏱", label: "ค้างนาน > 14 วัน", key: "gt14" as const, color: "#ef4444" },
  { icon: "🔥", label: "ค้างนาน > 30 วัน", key: "gt30" as const, color: "#b91c1c" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: OverviewFilters = {
    plant: sp.plant,
    status: sp.status,
    workType: sp.workType,
    priority: sp.priority,
    team: sp.team,
    supervisor: sp.supervisor,
    from: sp.from,
    to: sp.to,
  };

  const [data, options] = await Promise.all([getOverviewData(filters), getOverviewFilterOptions()]);

  const donutData: [number, number, number, number, number] = [
    data.statusBuckets.notstart,
    data.statusBuckets.inprogress,
    data.statusBuckets.waiting,
    data.statusBuckets.waitingapproval,
    data.statusBuckets.completed,
  ];

  const p1Base = Math.max(1, data.p1.open);
  const ovAgingBuckets = [
    { label: "0-7 วัน", color: "#16a34a", value: data.overviewAging.b1 },
    { label: "8-30 วัน", color: "#f59e0b", value: data.overviewAging.b2 },
    { label: "31-90 วัน", color: "#fb923c", value: data.overviewAging.b3 },
    { label: ">90 วัน", color: "#dc2626", value: data.overviewAging.b4 },
  ];
  const ovAgingMax = Math.max(1, ...ovAgingBuckets.map((b) => b.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <OverviewFilterBar options={options} />

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div className="content-main">
          <div className="card">
            <div className="card-title">👋 ยินดีต้อนรับ, {user.name}</div>
          </div>

          <div className="kpi-grid">
            {KPI_ITEMS.map((it) => (
              <div className="kpi-card" key={it.key}>
                <div className="kpi-card-header" style={{ background: it.grad }}>
                  <div className="kpi-card-icon">{it.icon}</div>
                  <div className="kpi-card-label">{it.label}</div>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-card-num" style={{ color: it.num }}>
                    {data.kpi[it.key].toLocaleString()}
                  </div>
                  <div className="kpi-card-unit">รายการ</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">
              <span className="card-icon">👷</span> Workload by Team
            </div>
            {data.workload.length === 0 ? (
              <div className="wo-empty">ไม่มีข้อมูล</div>
            ) : (
              data.workload.map(({ team, count }) => {
                const pct = Math.round((count / data.workloadMax) * 100);
                const color = TEAM_COLORS[team] || "#64748b";
                return (
                  <div className="workload-row" key={team}>
                    <div className="wl-label">{team}</div>
                    <div className="wl-track">
                      <div className="wl-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="wl-pct">{pct}%</div>
                    <div className="wl-hrs">{count} งาน</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="content-side">
          <div className="card">
            <div className="card-title">
              <span className="card-icon">🍩</span> Status Overview
            </div>
            <StatusDonut data={donutData} total={data.statusTotal} />
          </div>

          <div className="card">
            <div className="card-title">
              <span className="card-icon">⏳</span> Backlog Aging
            </div>
            {AGING_ROWS.map((row) => (
              <div className="aging-row" key={row.key}>
                <span className="aging-dot" style={{ background: row.color }} />
                <span className="lbl">{row.label}</span>
                <span className="val">{data.aging[row.key]}</span>
              </div>
            ))}
            <div className="aging-total">
              <span>รวม</span>
              <span>{data.agingTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ov-section-divider">
        <div className="line" />
        <div className="title">แยกตามทีม</div>
        <div className="line" />
      </div>

      <div className="ov-kpi-row">
        {data.teamCards.map((c) => (
          <div className={`ov-kpi-card${c.isTotal ? " total" : ""}`} key={c.team}>
            <div
              className="ov-kpi-stripe"
              style={{ background: `linear-gradient(90deg, ${c.healthColor}, ${c.healthColor}aa)` }}
            />
            <div className="ov-kpi-inner">
              <div className="ov-kpi-top">
                <div>
                  <div className="ov-kpi-name">{c.team}</div>
                  <span
                    className="ov-kpi-badge"
                    style={{
                      background: c.isTotal ? "rgba(255,255,255,.15)" : c.healthBg,
                      color: c.isTotal ? "#bfdbfe" : c.healthColor,
                    }}
                  >
                    {c.healthLabel}
                  </span>
                </div>
              </div>
              <div className="ov-kpi-stats">
                <div className="ov-kpi-stat">
                  <div className="lbl">WO Total</div>
                  <div className="val">{c.wo.toLocaleString()}</div>
                </div>
                <div className="ov-kpi-stat">
                  <div className="lbl">Backlog</div>
                  <div className="val" style={{ color: c.isTotal ? "#fcd34d" : "#d97706" }}>
                    {c.backlog.toLocaleString()}
                  </div>
                </div>
                <div className="ov-kpi-stat">
                  <div className="lbl">Close</div>
                  <div className="val" style={{ color: c.isTotal ? "#86efac" : "#059669" }}>
                    {c.closeCount.toLocaleString()}
                  </div>
                </div>
                <div className="ov-kpi-stat">
                  <div className="lbl">Overdue</div>
                  <div className="val" style={{ color: c.isTotal ? "#fca5a5" : "#ef4444" }}>
                    {c.overdue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="ov-kpi-footer">
              <span className="ratio-label">Backlog Ratio</span>
              <div className="ov-kpi-ratiobar">
                <div
                  className="ov-kpi-ratiobar-fill"
                  style={{ width: `${Math.min(c.ratio, 100)}%`, background: c.healthColor }}
                />
              </div>
              <span className="ratio-val">{c.ratio}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ov-charts-row">
        <div className="ov-card" style={{ flex: 1.4, minWidth: 300 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
            📈 WORK ORDER &amp; CLOSED TREND
          </div>
          <WoTrendChart
            labels={data.trend.labels}
            wo={data.trend.wo}
            closeArr={data.trend.closeArr}
            compArr={data.trend.compArr}
          />
        </div>
        <div className="ov-card" style={{ flex: 1, minWidth: 260 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#78350f,#f59e0b)" }}>
            📉 BACKLOG TREND
          </div>
          <BacklogTrendChart
            labels={data.trend.labels}
            backlog={data.trend.backlog}
            inprogress={data.trend.inprogress}
          />
        </div>
        <div className="ov-card" style={{ flex: 1, minWidth: 280 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#134e4a,#0d9488)" }}>
            📋 RECORD COUNT — แยกตามทีม
          </div>
          <div className="table-scroll" style={{ maxHeight: 260 }}>
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Closed</th>
                  <th>Overdue</th>
                  <th>On Due</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recordCount.entries.map(([team, g]) => (
                  <tr key={team}>
                    <td>{team}</td>
                    <td>{g.closed.toLocaleString()}</td>
                    <td>{g.overdue.toLocaleString()}</td>
                    <td>{g.onDue.toLocaleString()}</td>
                    <td>{g.total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                  <td>Total</td>
                  <td>{data.recordCount.totals.closed.toLocaleString()}</td>
                  <td>{data.recordCount.totals.overdue.toLocaleString()}</td>
                  <td>{data.recordCount.totals.onDue.toLocaleString()}</td>
                  <td>{data.recordCount.totals.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="ov-charts-row">
        <div className="ov-card" style={{ flex: 1, minWidth: 280 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#1e3a8a,#0284c7)" }}>
            📅 BACKLOG AGING — ภาพรวม
          </div>
          {ovAgingBuckets.map((b) => (
            <div className="ov-aging-row" key={b.label}>
              <div className="ov-aging-label">{b.label}</div>
              <div className="ov-aging-track">
                <div
                  className="ov-aging-fill"
                  style={{ width: `${Math.round((b.value / ovAgingMax) * 100)}%`, background: b.color }}
                />
              </div>
              <div className="ov-aging-val" style={{ color: b.color }}>
                {b.value}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 6, textAlign: "right" }}>
            รวม Backlog ทั้งหมด: {ovAgingBuckets.reduce((a, b) => a + b.value, 0)} รายการ
          </div>
        </div>

        <div className="ov-card" style={{ flex: 1, minWidth: 280 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
            🔴 PRIORITY 1 — ALERT ZONE
          </div>
          {P1_ITEMS.map((it, i) =>
            it === null ? (
              <div key={`div-${i}`} style={{ borderTop: "1px dashed #e2e8f0", margin: "8px 0 6px" }} />
            ) : (
              <div className="p1-stat-row" key={it.key}>
                <span className="p1-stat-icon">{it.icon}</span>
                <div className="p1-stat-label">{it.label}</div>
                <div className="p1-mini-bar">
                  <div
                    className="p1-mini-fill"
                    style={{
                      width: `${Math.round((data.p1[it.key] / p1Base) * 100)}%`,
                      background: it.color,
                    }}
                  />
                </div>
                <div className="p1-stat-num" style={{ color: it.color }}>
                  {data.p1[it.key]}
                </div>
              </div>
            )
          )}
        </div>

        <div className="ov-card" style={{ flex: 1, minWidth: 280 }}>
          <div className="ov-card-title" style={{ background: "linear-gradient(135deg,#3b0764,#7c3aed)" }}>
            📋 WORKLOAD BY CATEGORY
          </div>
          <CategoryDonut categories={data.categories} />
        </div>
      </div>
    </div>
  );
}
