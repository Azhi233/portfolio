function SectionShell({ as: Tag = 'section', className = '', children, ...props }) {
  const baseClassName = 'mx-auto w-full max-w-7xl px-6 md:px-12';
  return (
    <Tag className={`${baseClassName} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

export default SectionShell;
