type Status = 'pending' | 'approved' | 'rejected';

const STYLES: Record<Status, { dot: string; label: string; pulse?: boolean }> = {
  pending: { dot: 'bg-amber', label: 'Pending', pulse: true },
  approved: { dot: 'bg-cyan', label: 'Approved' },
  rejected: { dot: 'bg-red', label: 'Rejected' },
};

export function StatusDot({ status }: { status: Status }) {
  const s = STYLES[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2">
        <span className={`h-2 w-2 rounded-full ${s.dot} ${s.pulse ? 'status-pulse' : ''}`} />
      </span>
      <span className="text-muted">{s.label}</span>
    </span>
  );
}
