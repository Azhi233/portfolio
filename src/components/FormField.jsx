function FormField({ label, hint, className = '', children }) {
  return (
    <label className={`block ${className}`.trim()}>
      <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{label}</p>
      {children}
      {hint ? <p className="mt-2 text-[11px] leading-5 tracking-[0.08em] text-zinc-500">{hint}</p> : null}
    </label>
  );
}

export default FormField;
