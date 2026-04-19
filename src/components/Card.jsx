function Card({ as: Tag = 'article', className = '', children }) {
  return <Tag className={`rounded-[1.75rem] border border-white/10 bg-white/[0.03] ${className}`.trim()}>{children}</Tag>;
}

export default Card;
