import { useConfig } from '../context/ConfigContext.jsx';

export default function EditableText({ value, onChange, as: Tag = 'p', className = '' }) {
  const { isEditMode } = useConfig();

  if (!isEditMode) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => onChange?.(event.currentTarget.textContent || '')}
      className={`${className} outline-none border border-dashed border-cyan-400/60 bg-cyan-400/5 transition hover:bg-cyan-400/10`}
    >
      {value}
    </Tag>
  );
}
