"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#94a3b8",
];

export function CategoryDonut({ categories }: { categories: Array<[string, number]> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = categories.map(([k]) => k);
    const data = categories.map(([, v]) => v);
    const total = data.reduce((a, b) => a + b, 0) || 1;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data, backgroundColor: COLORS, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 10,
              font: { size: 10 },
              generateLabels: (chart) =>
                (chart.data.labels as string[]).map((l, i) => ({
                  text: `${l}  ${Math.round(((chart.data.datasets[0].data[i] as number) / total) * 100)}%`,
                  fillStyle: COLORS[i % COLORS.length],
                  hidden: false,
                  index: i,
                })),
            },
          },
          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ${c.parsed} (${Math.round((c.parsed / total) * 100)}%)`,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [categories]);

  return (
    <div style={{ position: "relative", height: 200 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
