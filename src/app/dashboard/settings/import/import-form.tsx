"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const resp = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" });
      } else {
        setMessage({
          type: "success",
          text: `นำเข้าสำเร็จ ${data.rowCount.toLocaleString()} รายการ`,
        });
        setFileName("");
        setUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="wo-section-label">อัปโหลดไฟล์ Excel / CSV</div>
        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          📤 คลิกเพื่อเลือกไฟล์ (.xlsx, .csv)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
        />
        {fileName && <div className="file-name">เลือกไฟล์: {fileName}</div>}
        <button
          className="wo-btn"
          disabled={busy || !fileName}
          onClick={() => {
            if (!fileInputRef.current?.files?.[0]) return;
            const fd = new FormData();
            fd.set("file", fileInputRef.current.files[0]);
            submit(fd);
          }}
        >
          {busy ? "กำลังนำเข้า..." : "นำเข้าไฟล์"}
        </button>
      </div>

      <div>
        <div className="wo-section-label">หรือนำเข้าจาก Google Sheet URL</div>
        <input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="wo-btn"
          disabled={busy || !url.trim()}
          onClick={() => {
            const fd = new FormData();
            fd.set("url", url.trim());
            submit(fd);
          }}
        >
          {busy ? "กำลังนำเข้า..." : "นำเข้าจาก URL"}
        </button>
        <div className="badge-note">
          Google Sheets: File → Share → Publish to web → เลือก Sheet → CSV →
          คัดลอก URL มาวาง (หรือวาง URL ปกติของ Sheet ที่แชร์แบบ Anyone with
          the link)
        </div>
      </div>

      {message && (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: message.type === "success" ? "var(--green)" : "var(--red)",
          }}
        >
          {message.type === "success" ? "✅ " : "❌ "}
          {message.text}
        </div>
      )}
    </div>
  );
}
