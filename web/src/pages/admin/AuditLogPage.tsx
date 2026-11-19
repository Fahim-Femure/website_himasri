import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { subscribeAuditLogs } from '@/services/cmsService';
import type { AuditLogDoc } from '@/types/models';
import { formatDateId } from '@/utils/format';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    document.title = 'Log Audit — HIMASRI IT PLN';
    return subscribeAuditLogs(setLogs);
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        (l.actorName || l.actorUid).toLowerCase().includes(q)
      );
    });
  }, [logs, search, actionFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit"
        description="Catatan aktivitas admin dan perubahan konten (hanya baca, maks. 200 entri terbaru)."
      />

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="w-full sm:max-w-xs">
          <Field
            label="Cari aktor atau target"
            placeholder="Ketik aksi, nama, atau ID…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter jenis aksi"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="min-h-[42px] rounded-md border border-cream-300 bg-white px-3.5 py-2 type-small text-ink-900"
        >
          <option value="ALL">Semua aksi ({logs.length})</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg bg-white border border-cream-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-100 type-label font-medium text-ink-600">
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pelaku</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Ringkasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 type-label">
                {filtered.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap tabular-nums">
                      {formatDateId(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {log.actorName || log.actorUid}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="maroon">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono type-caption text-ink-600">{log.target}</td>
                    <td className="px-4 py-3 text-ink-600 max-w-xs break-words">
                      {log.after ? JSON.stringify(log.after) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="rounded-lg bg-white border border-cream-200 p-4 space-y-2 type-label"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="maroon">{log.action}</Badge>
                  <span className="type-caption text-ink-600 tabular-nums">
                    {formatDateId(log.createdAt)}
                  </span>
                </div>
                <p className="font-semibold text-ink-900">{log.actorName || log.actorUid}</p>
                <p className="font-mono type-caption text-ink-600 break-all">{log.target}</p>
                {log.after && (
                  <p className="type-caption text-ink-600 break-words">{JSON.stringify(log.after)}</p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Belum ada log audit"
          description="Aktivitas persetujuan anggota, ubah peran, rotasi referal, dan perubahan konten akan tercatat otomatis di sini."
        />
      )}
    </div>
  );
}
