import { useMemo, useRef } from 'react';
import MediaFrame from './MediaFrame.jsx';

function usePointerDrag(onDrag) {
  const dragRef = useRef(null);

  const onPointerDown = (event, type) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      type,
      startX: event.clientX,
      startY: event.clientY,
    };

    const handleMove = (moveEvent) => {
      if (!dragRef.current) return;
      onDrag?.({
        type: dragRef.current.type,
        deltaX: moveEvent.clientX - dragRef.current.startX,
        deltaY: moveEvent.clientY - dragRef.current.startY,
      });
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  return onPointerDown;
}

export default function ResizableMediaFrame({ frame, onFrameChange, editMode = false, className = '' }) {
  const previewStyle = useMemo(() => ({
    width: `${Math.max(10, frame?.width || 100)}%`,
    height: `${Math.max(10, frame?.height || 100)}%`,
    left: `${Math.max(0, frame?.x || 0)}%`,
    top: `${Math.max(0, frame?.y || 0)}%`,
  }), [frame]);

  const handleDrag = usePointerDrag(({ type, deltaX, deltaY }) => {
    const next = { ...frame };
    const widthDelta = deltaX * 0.2;
    const heightDelta = deltaY * 0.2;

    if (type === 'move') {
      next.x = Math.max(0, Math.min(100 - (frame.width || 100), (frame.x || 0) + deltaX * 0.15));
      next.y = Math.max(0, Math.min(100 - (frame.height || 100), (frame.y || 0) + deltaY * 0.15));
    }

    if (type === 'resize-br') {
      next.width = Math.max(20, Math.min(100, (frame.width || 100) + widthDelta));
      next.height = Math.max(20, Math.min(100, (frame.height || 100) + heightDelta));
    }

    if (type === 'resize-tr') {
      next.width = Math.max(20, Math.min(100, (frame.width || 100) + widthDelta));
      next.height = Math.max(20, Math.min(100, (frame.height || 100) - heightDelta));
      next.y = Math.max(0, Math.min(100 - next.height, (frame.y || 0) + heightDelta));
    }

    if (type === 'resize-bl') {
      next.width = Math.max(20, Math.min(100, (frame.width || 100) - widthDelta));
      next.height = Math.max(20, Math.min(100, (frame.height || 100) + heightDelta));
      next.x = Math.max(0, Math.min(100 - next.width, (frame.x || 0) + widthDelta));
    }

    if (type === 'resize-tl') {
      next.width = Math.max(20, Math.min(100, (frame.width || 100) - widthDelta));
      next.height = Math.max(20, Math.min(100, (frame.height || 100) - heightDelta));
      next.x = Math.max(0, Math.min(100 - next.width, (frame.x || 0) + widthDelta));
      next.y = Math.max(0, Math.min(100 - next.height, (frame.y || 0) + heightDelta));
    }

    onFrameChange?.(next);
  });

  return (
    <div className={`relative ${className}`} style={{ cursor: editMode ? 'crosshair' : 'default' }}>
      <MediaFrame
        src={frame?.src}
        alt={frame?.alt || ''}
        type={frame?.type || 'image'}
        aspectRatio={frame?.aspectRatio || '4 / 3'}
        cropX={frame?.cropX || 50}
        cropY={frame?.cropY || 50}
        scale={frame?.scale || 1}
        frameScale={frame?.frameScale || 1}
        className="h-full w-full"
      />
      {editMode ? (
        <div className="absolute inset-0 rounded-[inherit] border border-dashed border-white/35">
          <div className="pointer-events-auto absolute inset-0 cursor-crosshair" />
          <div
            className="pointer-events-auto absolute cursor-move"
            style={previewStyle}
            onPointerDown={(event) => handleDrag(event, 'move')}
          >
            <div className="absolute inset-0 rounded-[inherit] border border-cyan-300/70 bg-cyan-300/5" />
            {['tl', 'tr', 'bl', 'br'].map((corner) => (
              <button
                key={corner}
                type="button"
                aria-label={`resize-${corner}`}
                className={`pointer-events-auto absolute h-3.5 w-3.5 rounded-full border border-cyan-200 bg-cyan-300 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] ${corner === 'tl' ? '-left-1.5 -top-1.5 cursor-nwse-resize' : ''} ${corner === 'tr' ? '-right-1.5 -top-1.5 cursor-nesw-resize' : ''} ${corner === 'bl' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' : ''} ${corner === 'br' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' : ''}`}
                onPointerDown={(event) => handleDrag(event, `resize-${corner}`)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
