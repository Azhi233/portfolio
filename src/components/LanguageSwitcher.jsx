const LABELS = {
  zh: { active: '中文', inactive: 'EN' },
  en: { active: 'EN', inactive: '中文' },
};

export default function LanguageSwitcher({ locale = 'zh', onChange, className = '', compact = false }) {
  const labels = LABELS[locale] || LABELS.zh;
  const isZh = locale === 'zh';

  return (
    <button
      type="button"
      onClick={() => onChange?.(isZh ? 'en' : 'zh')}
      className={className}
      aria-label="Switch language between Chinese and English"
    >
      <span className="relative inline-flex items-center">
        <span
          className={`absolute inset-y-0 rounded-full bg-white/12 transition-all duration-300 ${compact ? 'w-7' : 'w-[52%]'}`}
          style={isZh ? { left: 0 } : { right: 0 }}
        />
        <span className={`relative z-10 ${compact ? 'px-3 py-1' : 'px-3 py-1.5'} ${isZh ? 'text-white' : 'text-zinc-300'}`}>
          {labels.active}
        </span>
        <span className={`relative z-10 ${compact ? 'px-3 py-1' : 'px-3 py-1.5'} ${isZh ? 'text-zinc-400' : 'text-white'}`}>
          {labels.inactive}
        </span>
      </span>
    </button>
  );
}
