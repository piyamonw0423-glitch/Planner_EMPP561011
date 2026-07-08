"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function FilterBar({
  options,
}: {
  options: {
    plants: string[];
    teams: string[];
    supervisors: string[];
    statuses: string[];
    overdues: string[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("search", value), 300);
  }

  function reset() {
    router.push("?");
  }

  return (
    <div className="wo-filter-bar">
      <div className="wo-filter-group" style={{ minWidth: 200 }}>
        <label>ค้นหา</label>
        <input
          type="text"
          placeholder="WO, Description, Asset, Team..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="wo-filter-group">
        <label>Plant</label>
        <select
          defaultValue={searchParams.get("plant") ?? ""}
          onChange={(e) => setParam("plant", e.target.value)}
        >
          <option value="">All</option>
          {options.plants.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="wo-filter-group">
        <label>Team</label>
        <select
          defaultValue={searchParams.get("team") ?? ""}
          onChange={(e) => setParam("team", e.target.value)}
        >
          <option value="">All</option>
          {options.teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="wo-filter-group">
        <label>Priority</label>
        <select
          defaultValue={searchParams.get("priority") ?? ""}
          onChange={(e) => setParam("priority", e.target.value)}
        >
          <option value="">All</option>
          <option value="1">P1</option>
          <option value="2">P2</option>
          <option value="3+">P3+</option>
        </select>
      </div>
      <div className="wo-filter-group">
        <label>Status</label>
        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="">All</option>
          {options.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="wo-filter-group">
        <label>Overdue</label>
        <select
          defaultValue={searchParams.get("overdue") ?? ""}
          onChange={(e) => setParam("overdue", e.target.value)}
        >
          <option value="">All</option>
          {options.overdues.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="wo-filter-group">
        <label>Supervisor</label>
        <select
          defaultValue={searchParams.get("supervisor") ?? ""}
          onChange={(e) => setParam("supervisor", e.target.value)}
        >
          <option value="">All</option>
          {options.supervisors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <button className="topbtn" onClick={reset}>
        ล้างตัวกรอง
      </button>
    </div>
  );
}
