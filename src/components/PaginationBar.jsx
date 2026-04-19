import Button from './Button.jsx';

export default function PaginationBar({ page = 1, totalPages = 1, onPrev, onNext, label = 'PAGE' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs tracking-[0.18em] text-zinc-500">{label} {page} / {totalPages}</p>
      <div className="flex gap-2">
        <Button type="button" variant="subtle" onClick={onPrev} disabled={page <= 1}>
          PREV
        </Button>
        <Button type="button" variant="subtle" onClick={onNext} disabled={page >= totalPages}>
          NEXT
        </Button>
      </div>
    </div>
  );
}
