import FormField from './FormField.jsx';

function VariantUrlGroup({ value, onChange, className = '' }) {
  return (
    <FormField label="Variants URLs (for comparison)" className={`md:col-span-2 rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3 ${className}`.trim()}>
      <div className="grid gap-3 md:grid-cols-3">
        <FormField label="RAW URL">
          <input
            value={value.rawUrl}
            onChange={(event) => onChange((prev) => ({ ...prev, rawUrl: event.target.value }))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
            placeholder="https://..."
          />
        </FormField>
        <FormField label="GRADED URL">
          <input
            value={value.gradedUrl}
            onChange={(event) => onChange((prev) => ({ ...prev, gradedUrl: event.target.value }))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
            placeholder="https://..."
          />
        </FormField>
        <FormField label="STYLED URL">
          <input
            value={value.styledUrl}
            onChange={(event) => onChange((prev) => ({ ...prev, styledUrl: event.target.value }))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
            placeholder="https://..."
          />
        </FormField>
      </div>
    </FormField>
  );
}

export default VariantUrlGroup;
