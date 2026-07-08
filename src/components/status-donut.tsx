"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

const LABELS = [
  "Not Start",
  "In Progress",
  "Waiting Material",
  "Waiting Approval",
  "Completed",
];
const COLORS = ["#94a3b8", "#2563eb", "#f59e0b", "#7c3aed", "#16a34a"];

export function StatusDonut({
  data,
  total,
}: {
  data: [number, number, number, number, number];
  total: number;
}) {
  return (
    <div className="donut-wrap">
      <div className="donut-canvas-box">
        <Doughnut
          data={{
            labels: LABELS,
            datasets: [
              {
                data,
                backgroundColor: COLORS,
                borderWidth: 3,
                borderColor: "#ffffff",
                hoverOffset: 8,
                hoverBorderWidth: 3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            animation: { animateRotate: true, duration: 900 },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#111827",
                titleColor: "#fff",
                bodyColor: "#e5e7eb",
                padding: 9,
                cornerRadius: 8,
                displayColors: true,
              },
            },
          }}
        />
        <div className="donut-center">
          <div className="n">{total.toLocaleString()}</div>
          <div className="l">Total</div>
        </div>
      </div>
      <div className="legend-list">
        {LABELS.map((l, i) => {
          const pct = total ? Math.round((data[i] / total) * 1000) / 10 : 0;
          return (
            <div className="legend-row" key={l}>
              <span className="sw" style={{ background: COLORS[i] }} />
              <span className="lbl">
                {l} ({pct}%)
              </span>
              <span className="val">{data[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
