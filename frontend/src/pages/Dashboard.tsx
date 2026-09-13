import { useFetch } from '../lib/useFetch.ts'
import { Card, ErrorState, EmptyState, formatIDR } from '../components/ui.tsx'
import type { DayAggregate, ReportSummary } from '../lib/types.ts'

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
      </p>
    </div>
  )
}

function MiniBarChart({ rows, label }: { rows: DayAggregate[]; label: (r: DayAggregate) => string }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.sales ?? r.revenue ?? 0)))
  const showTicks = rows.length > 0
  return (
    <div className="flex items-end gap-2" style={{ height: '160px' }}>
      {!showTicks ? (
        <EmptyState message="Belum ada data" />
      ) : (
        rows.map((r, i) => {
          const v = Number(r.sales ?? r.revenue ?? 0)
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{v}</span>
              <div
                className="w-full rounded-t bg-indigo-500 transition-all group-hover:bg-indigo-600"
                style={{ height: `${(v / max) * 130}px`, minHeight: '4px' }}
                title={label(r)}
              />
              <span className="text-[10px] text-slate-400">
                {r.day ? new Date(r.day).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

export default function Dashboard() {
  const summary = useFetch<ReportSummary>('/api/reports/summary/')
  const salesPerDay = useFetch<DayAggregate[]>('/api/reports/sales-per-day/?days=7')
  const revenuePerDay = useFetch<DayAggregate[]>('/api/reports/revenue-per-day/?days=7')

  if (summary.error) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-slate-900">Dashboard</h1>
        <ErrorState message={summary.error} onRetry={summary.reload} />
      </div>
    )
  }

  const s = summary.data

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      {s ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Penjualan" value={String(s.total_sales)} suffix="transaksi" />
          <StatCard label="Total Pendapatan" value={formatIDR(s.total_revenue)} />
          <StatCard label="Total Pengeluaran" value={formatIDR(s.total_expenses)} />
          <StatCard
            label="Laba Bersih"
            value={Number(s.net_profit) >= 0 ? formatIDR(s.net_profit) : `-${formatIDR(Math.abs(Number(s.net_profit)))}`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Penjualan 7 Hari Terakhir">
          {salesPerDay.loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : salesPerDay.error ? (
            <ErrorState message={salesPerDay.error} onRetry={salesPerDay.reload} />
          ) : (
            <MiniBarChart rows={salesPerDay.data ?? []} label={(r) => `${r.day}: ${r.sales} penjualan`} />
          )}
        </Card>

        <Card title="Pendapatan 7 Hari Terakhir">
          {revenuePerDay.loading ? (
            <div className="h-40 animate-pulse rounded bg-slate-200" />
          ) : revenuePerDay.error ? (
            <ErrorState message={revenuePerDay.error} onRetry={revenuePerDay.reload} />
          ) : (
            <MiniBarChart rows={revenuePerDay.data ?? []} label={(r) => `${r.day}: ${formatIDR(r.revenue ?? 0)}`} />
          )}
        </Card>
      </div>
    </div>
  )
}