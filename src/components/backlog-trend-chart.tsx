"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function BacklogTrendChart({
  labels,
  backlog,
  inprogress,
}: {
  labels: string[];
  backlog: number[];
  inprogress: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const redGrad = ctx.createLinearGradient(0, 0, 0, 260);
    redGrad.addColorStop(0, "rgba(220,38,38,.35)");
    redGrad.addColorStop(1, "rgba(220,38,38,0)");
    const orangeGrad = ctx.createLinearGradient(0, 0, 0, 260);
    orangeGrad.addColorStop(0, "rgba(249,115,22,.2)");
    orangeGrad.addColorStop(1, "rgba(249,115,22,0)");

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Backlog (สะสม)",
            data: backlog,
            borderColor: "#dc2626",
            backgroundColor: redGrad,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointBackgroundColor: "#dc2626",
            pointRadius: 3.5,
          },
          {
            label: "In Progress",
            data: inprogress,
            borderColor: "#f97316",
            backgroundColor: orangeGrad,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            borderDash: [6, 3],
            pointBackgroundColor: "#f97316",
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
          x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#94a3b8", maxRotation: 0 } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [labels, backlog, inprogress]);

  return (
    <>
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="dot line" style={{ background: "#dc2626" }} />
          Backlog สะสม
        </span>
        <span className="chart-legend-item">
          <span className="dot line" style={{ background: "#f97316" }} />
          In Progress
        </span>
      </div>
      <div style={{ position: "relative", height: 270 }}>
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
