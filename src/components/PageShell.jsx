function PageShell({ as: Tag = 'main', className = '', children }) {
  return <Tag className={`min-h-screen px-6 text-zinc-100 md:px-12 ${className}`.trim()}>{children}</Tag>;
}

export default PageShell;
