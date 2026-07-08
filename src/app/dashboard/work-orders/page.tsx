import Link from "next/link";
import { requireUser } from "@/lib/dal";
import {
  getWorkOrdersFilterOptions,
  getWorkOrdersPage,
  type WorkOrdersFilters,
} from "@/lib/work-orders-query";
import { FilterBar } from "./filter-bar";
import { WoTable } from "./wo-table";

const ROLE_RANK = { VIEWER: 0, PLANNER: 1, ADMIN: 2 } as const;

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: WorkOrdersFilters = {
    search: sp.search,
    plant: sp.plant,
    team: sp.team,
    priority: sp.priority,
    status: sp.status,
    overdue: sp.overdue,
    supervisor: sp.supervisor,
    page: sp.page ? parseInt(sp.page, 10) : 1,
  };

  const [options, { rows, total, page, pageCount }] = await Promise.all([
    getWorkOrdersFilterOptions(),
    getWorkOrdersPage(filters),
  ]);

  const canEdit = ROLE_RANK[user.role] >= ROLE_RANK.PLANNER;

  function pageHref(p: number) {
    const params = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v) as [string, string][]
    );
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  return (
    <div className="content-main">
      <div className="card">
        <div className="card-title">
          <span className="card-icon">🗂️</span> Work Orders
        </div>
        <FilterBar options={options} />
        <div className="wo-result-count">
          พบ {total.toLocaleString()} รายการ (หน้า {page}/{pageCount})
        </div>
        <WoTable rows={rows} canEdit={canEdit} />
        <div className="wo-pagination">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            className="topbtn"
            aria-disabled={page <= 1}
          >
            ← ก่อนหน้า
          </Link>
          <span>
            หน้า {page} / {pageCount}
          </span>
          <Link
            href={pageHref(Math.min(pageCount, page + 1))}
            className="topbtn"
            aria-disabled={page >= pageCount}
          >
            ถัดไป →
          </Link>
        </div>
      </div>
    </div>
  );
}
