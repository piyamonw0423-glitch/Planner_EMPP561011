"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function WoTrendChart({
  labels,
  wo,
  closeArr,
  compArr,
}: {
  labels: string[];
  wo: number[];
  closeArr: number[];
  compArr: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const blueGrad = ctx.createLinearGradient(0, 0, 0, 260);
    blueGrad.addColorStop(0, "#60a5fa");
    blueGrad.addColorStop(1, "#1d4ed8");

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "WO Issued",
            data: wo,
            backgroundColor: blueGrad,
            borderRadius: 5,
            maxBarThickness: 36,
            barPercentage: 0.6,
            categoryPercentage: 0.75,
            order: 3,
          },
          {
            type: "bar",
            label: "Completed",
            data: compArr,
            backgroundColor: "#818cf8",
            borderRadius: 5,
            maxBarThickness: 36,
            barPercentage: 0.6,
            categoryPercentage: 0.75,
            order: 2,
          },
          {
            type: "line",
            label: "Closed",
            data: closeArr,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,.1)",
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 3.5,
            pointBackgroundColor: "#10b981",
            order: 1,
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
  }, [labels, wo, closeArr, compArr]);

  return (
    <>
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="dot" style={{ background: "#3b82f6" }} />
          WO Issued
        </span>
        <span className="chart-legend-item">
          <span className="dot" style={{ background: "#6366f1" }} />
          Completed (FINISH/WACCEPT/COMP)
        </span>
        <span className="chart-legend-item">
          <span className="dot" style={{ background: "#10b981" }} />
          Closed (CLOSE/FORCED_CLOSE/CAN)
        </span>
      </div>
      <div style={{ position: "relative", height: 270 }}>
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
