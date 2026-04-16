import { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

export default function EditableToggleButton({
  value,
  onToggle,
  onLabelChange,
  className = '',
  label = 'EDIT TOGGLE',
  activeLabel = 'ON',
  inactiveLabel = 'OFF',
  activeText = '',
  inactiveText = '',
}) {
  const { isEditMode } = useConfig();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ activeText, inactiveText });

  useEffect(() => {
    if (!editing) return;
    setDraft({ activeText, inactiveText });
  }, [editing, activeText, inactiveText]);

  const canEdit = isEditMode && (typeof onToggle === 'function' || typeof onLabelChange === 'function');

  const handleClick = (event) => {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();
    if (!editing) {
      setEditing(true);
      return;
    }

    onLabelChange?.({
      activeText: String(draft.activeText || '').trim(),
      inactiveText: String(draft.inactiveText || '').trim(),
    });
    onToggle?.();
    setEditing(false);
  };

  const handleDoubleClick = (event) => {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();
  };

  if (!canEdit) {
    return <button type="button" className={className}>{value ? activeText || activeLabel : inactiveText || inactiveLabel}</button>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`${className} ${editing ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-dashed border-cyan-400/60 bg-cyan-400/5'} cursor-pointer hover:bg-cyan-400/10`}
    >
      {editing ? (
        <span className="inline-flex items-center gap-2">
          <span className="sr-only">{label}</span>
          <input
            value={value ? draft.activeText : draft.inactiveText}
            onChange={(event) =>
              setDraft((prev) => (value ? { ...prev, activeText: event.target.value } : { ...prev, inactiveText: event.target.value }))
            }
            onClick={(event) => event.stopPropagation()}
            className="min-w-0 bg-transparent text-inherit outline-none"
            autoFocus
          />
          <span className="text-[10px] tracking-[0.18em] text-cyan-200">再次单击保存</span>
        </span>
      ) : (
        <span>{value ? activeText || activeLabel : inactiveText || inactiveLabel}</span>
      )}
    </button>
  );
}
