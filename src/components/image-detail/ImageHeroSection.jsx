import Card from '../Card.jsx';

function ImageBox({ src, title }) {
  if (!src) {
    return <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-zinc-500">No image available.</div>;
  }

  return <img src={src} alt={title || 'Image preview'} className="h-full w-full object-cover" />;
}

export default function ImageHeroSection({ imageUrl, title, description, category, featuredLabel }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-h-[320px] bg-black/35 p-4 md:p-6">
          <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/50">
            <ImageBox src={imageUrl} title={title} />
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/25 p-8 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">IMAGE / META</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{title}</h1>
          <p className="mt-5 text-sm leading-7 text-zinc-300 md:text-base">{description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.12em] text-zinc-200">
              {category}
            </span>
            {featuredLabel ? (
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs tracking-[0.12em] text-amber-100">
                {featuredLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
