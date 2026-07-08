"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function OverviewFilterBar({
  options,
}: {
  options: {
    plants: string[];
    teams: string[];
    supervisors: string[];
    workTypes: string[];
    rawStatuses: string[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  function setParamDebounced(key: string, value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam(key, value), 400);
  }

  function reset() {
    router.push("?");
  }

  return (
    <div className="ov-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div className="ov-title">📊 PP561011 MAINTENANCE PERFORMANCE</div>
          <div className="ov-title-sub">CORRECTIVE MAINTENANCE — WORK ORDER TRACKING SYSTEM</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="ov-filters">
          <div className="ov-filter-group">
            <label>Plant</label>
            <select
              defaultValue={searchParams.get("plant") ?? ""}
              onChange={(e) => setParam("plant", e.target.value)}
            >
              <option value="">All Plants</option>
              {options.plants.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Status</label>
            <select
              defaultValue={searchParams.get("status") ?? ""}
              onChange={(e) => setParam("status", e.target.value)}
            >
              <option value="">All Status</option>
              <option value="notactive">Waiting (WPLAN/WSCH/WSHUT)</option>
              <option value="inprogress">In Progress (Active)</option>
              <option value="close">Closed (CLOSE/FORCED_CLOSE/CAN)</option>
              <option value="completed">Completed (FINISH/WACCEPT/COMP)</option>
              <optgroup label="Status จาก Data จริง">
                {options.rawStatuses.map((s) => (
                  <option key={s} value={`raw:${s}`}>
                    {s}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Work Type</label>
            <select
              defaultValue={searchParams.get("workType") ?? ""}
              onChange={(e) => setParam("workType", e.target.value)}
            >
              <option value="">All Types</option>
              {options.workTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Priority</label>
            <select
              defaultValue={searchParams.get("priority") ?? ""}
              onChange={(e) => setParam("priority", e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Priority 1</option>
              <option value="2">Priority 2</option>
              <option value="3">Priority 3</option>
              <option value="4">Priority 4</option>
            </select>
          </div>
          <div className="ov-filter-group">
            <label>Team</label>
            <select
              defaultValue={searchParams.get("team") ?? ""}
              onChange={(e) => setParam("team", e.target.value)}
            >
              <option value="">All Teams</option>
              {options.teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="ov-filter-group">
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
          <div className="ov-filter-group">
            <label>Date From</label>
            <input
              type="date"
              defaultValue={searchParams.get("from") ?? ""}
              onChange={(e) => setParamDebounced("from", e.target.value)}
            />
          </div>
          <div className="ov-filter-group">
            <label>Date To</label>
            <input
              type="date"
              defaultValue={searchParams.get("to") ?? ""}
              onChange={(e) => setParamDebounced("to", e.target.value)}
            />
          </div>
        </div>
        <button className="ov-reset-btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
