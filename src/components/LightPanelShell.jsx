function LightPanelShell({ as: Tag = 'div', className = '', children }) {
  return (
    <Tag className={`rounded-2xl border border-slate-200 bg-primary-white backdrop-blur-sm ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export default LightPanelShell;
