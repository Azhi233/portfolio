import { useMemo, useState } from 'react';
import VideoCard from './VideoCard.jsx';

function CinematicMasonry({ projects, items, columns = 4, className = '' }) {
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const sourceItems = useMemo(() => {
    if (Array.isArray(projects)) return projects;
    if (Array.isArray(items)) return items;
    return [];
  }, [projects, items]);

  const distributedColumns = useMemo(() => {
    const bucket = Array.from({ length: columns }, () => []);

    sourceItems.forEach((item, idx) => {
      bucket[idx % columns].push(item);
    });

    return bucket;
  }, [sourceItems, columns]);

  const speedClassByIndex = ['column-speed-1', 'column-speed-2', 'column-speed-3', 'column-speed-4'];
  const grainClassByIndex = ['grain-drift-1', 'grain-drift-2', 'grain-drift-3', 'grain-drift-4'];

  if (sourceItems.length === 0) {
    return (
      <div
        className={`flex h-[340px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 px-6 text-center text-xs tracking-[0.14em] text-zinc-500 ${className}`}
      >
        NO PROJECTS IN THIS CATEGORY YET.
      </div>
    );
  }

  return (
    <div className={`group/masonry grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {distributedColumns.map((columnItems, columnIdx) => {
        const isPaused = hoveredColumn === columnIdx;
        const loopItems = [...columnItems, ...columnItems].map((item, idx) => ({
          ...item,
          __uid: `${item.id}-${columnIdx}-${idx}`,
        }));

        return (
          <div key={`column-${columnIdx}`} className="relative h-[min(60vh,760px)] overflow-hidden rounded-2xl">
            <div
              className={`column-scroll ${speedClassByIndex[columnIdx % speedClassByIndex.length]} ${
                isPaused ? 'paused' : ''
              } flex flex-col gap-5`}
            >
              {loopItems.map((item) => (
                <div
                  key={item.__uid}
                  className="transition-opacity duration-500 ease-out group-hover/masonry:opacity-35 hover:!opacity-100"
                >
                  <VideoCard
                    item={item}
                    onHoverStart={() => setHoveredColumn(columnIdx)}
                    onHoverEnd={() => setHoveredColumn((current) => (current === columnIdx ? null : current))}
                  />
                </div>
              ))}
            </div>

            <div
              className={`pointer-events-none absolute inset-0 ${grainClassByIndex[columnIdx % grainClassByIndex.length]} ${
                isPaused ? 'paused' : ''
              } opacity-[0.08] mix-blend-soft-light`}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_64%_at_50%_0%,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.00)_66%)]" />
          </div>
        );
      })}
    </div>
  );
}

export default CinematicMasonry;
