function ConsolePanelShell({ as: Tag = 'div', className = '', children }) {
  return (
    <Tag className={`rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${className}`.trim()}>
      {children}
    </Tag>
  );
}

export default ConsolePanelShell;
