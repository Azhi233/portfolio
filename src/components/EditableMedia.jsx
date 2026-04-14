import { useConfig } from '../context/ConfigContext.jsx';

export default function EditableMedia({ src, type = 'image', onChange, className = '' }) {
  const { isEditMode } = useConfig();

  const handleClick = (event) => {
    if (!isEditMode) return;
    event.preventDefault();
    event.stopPropagation();

    const nextUrl = window.prompt('请输入新的媒体 URL', src || '');
    if (nextUrl && nextUrl.trim()) {
      onChange?.(nextUrl.trim());
    }
  };

  if (type === 'video') {
    return (
      <video
        src={src}
        controls={!isEditMode}
        onClick={handleClick}
        className={`${className} ${isEditMode ? 'cursor-pointer border border-dashed border-cyan-400/60 bg-cyan-400/5' : ''}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt="editable media"
      onClick={handleClick}
      className={`${className} ${isEditMode ? 'cursor-pointer border border-dashed border-cyan-400/60 bg-cyan-400/5' : ''}`}
    />
  );
}
