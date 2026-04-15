export default function LocaleToggleButton({ locale, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
    >
      {locale === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
