import { useMemo } from 'react';

function HorizontalCardScroller({ children, className = '', itemClassName = '' }) {
  const items = useMemo(() => {
    if (Array.isArray(children)) return children;
    return [children];
  }, [children]);

  return (
    <div className={`overflow-x-auto pb-3 ${className}`.trim()}>
      <div className="flex snap-x snap-mandatory gap-4 pr-2">
        {items.map((child, index) => (
          <div key={index} className={`snap-start shrink-0 ${itemClassName}`.trim()}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HorizontalCardScroller;
