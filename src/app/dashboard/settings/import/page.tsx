import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  await requireRole("PLANNER");

  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { importedBy: { select: { name: true } } },
  });

  return (
    <div className="content-main">
      <div className="card">
        <div className="card-title">
          <span className="card-icon">⬆️</span> นำเข้าข้อมูล Work Order
        </div>
        <ImportForm />
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-icon">🕓</span> ประวัติการนำเข้า
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ไฟล์ / แหล่งข้อมูล</th>
                <th>ประเภท</th>
                <th>จำนวนแถว</th>
                <th>โดย</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    ยังไม่มีการนำเข้าข้อมูล
                  </td>
                </tr>
              )}
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>{b.createdAt.toLocaleString("th-TH")}</td>
                  <td>{b.fileName}</td>
                  <td>{b.source}</td>
                  <td>{b.rowCount.toLocaleString()}</td>
                  <td>{b.importedBy?.name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
