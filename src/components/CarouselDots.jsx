function CarouselDots({ count = 0, activeIndex = 0, onSelect }) {
  if (!count || count < 2) return null;

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect?.(index)}
          className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-cyan-300' : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default CarouselDots;
