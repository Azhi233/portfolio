function PanelShell({ as: Tag = 'div', className = '', children }) {
  return (
    <Tag
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

export default PanelShell;
