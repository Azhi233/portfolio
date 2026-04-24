export default function DraggableSlotCard({ children, isDragging = false, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${isDragging ? 'opacity-60 scale-[0.99]' : ''} transition`}
    >
      {children}
    </div>
  );
}
