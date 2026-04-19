export default function ReviewNotice({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm leading-7 text-amber-100 ${className}`}>
      自动翻译仅作为初稿，品牌文案、作品集标题和 CTA 建议在发布前人工审核。
    </div>
  );
}
