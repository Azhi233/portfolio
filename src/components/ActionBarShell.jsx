function ActionBarShell({ className = '', children }) {
  return (
    <div className={`sticky top-3 z-20 mb-4 rounded-xl border border-zinc-700 bg-zinc-950/90 p-3 backdrop-blur ${className}`.trim()}>
      {children}
    </div>
  );
}

export default ActionBarShell;
