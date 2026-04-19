import EditableText from '../EditableText.jsx';

function MetricCard({ metric, index, onLabelChange, onValueChange }) {
  return (
    <div className="hero-metric rounded-xl border border-slate-200/80 bg-primary-white/70 px-3.5 py-3 backdrop-blur-sm md:px-4">
      <EditableText
        as="p"
        className="text-[10px] tracking-[0.14em] text-slate-gray/70"
        value={metric.label}
        onChange={(value) => onLabelChange?.(index, value)}
      />
      <EditableText
        as="p"
        className="mt-1 text-[13px] font-medium text-slate-700 md:text-sm"
        value={metric.value}
        onChange={(value) => onValueChange?.(index, value)}
      />
    </div>
  );
}

export default MetricCard;
