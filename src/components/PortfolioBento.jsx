import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useIntrinsicMediaSize } from '../hooks/useIntrinsicMediaSize.jsx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const fallbackItems = [
  { id: 'b1', title: 'Premium Toy Campaign', cls: 'col-span-2 row-span-2', image: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1400&q=80' },
  { id: 'b2', title: 'Industrial Launch Pack', cls: '', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=900&q=80' },
  { id: 'b3', title: 'Retail Shelf Visuals', cls: '', image: 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?auto=format&fit=crop&w=900&q=80' },
  { id: 'b4', title: 'Web Hero Sequence', cls: 'row-span-2', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80' },
  { id: 'b5', title: 'Offline Catalog Story', cls: 'col-span-2', image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80' },
  { id: 'b6', title: 'Short Video Matrix', cls: '', image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80' },
];

const clsPattern = ['col-span-2 row-span-2', '', '', 'row-span-2', 'col-span-2', ''];

function PortfolioBento({
  items = [],
  heading = 'FULL ECOSYSTEM PORTFOLIO',
  subheading = 'Explore the wider body of work.',
}) {
  const rootRef = useRef(null);

  const bentoItems = useMemo(() => {
    const source = items.length ? items : fallbackItems;
    return source.slice(0, 6).map((item, idx) => ({
      ...item,
      cls: item.cls ?? clsPattern[idx] ?? '',
    }));
  }, [items]);

  const mediaSize = useIntrinsicMediaSize();

  useGSAP(
    () => {
      gsap.fromTo(
        '.bento-item',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    },
    { scope: rootRef, revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} className="bg-[#06070b] px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs tracking-[0.24em] text-zinc-500">{heading}</p>
        <h2 className="mt-3 text-3xl tracking-[0.11em] text-zinc-100 md:text-5xl">{subheading}</h2>

        <div
          className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
          style={{ gridAutoRows: mediaSize.aspectRatio && mediaSize.aspectRatio < 1 ? '220px' : '180px' }}
        >
          {bentoItems.map((item) => (
            <article
              key={item.id}
              className={`bento-item group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${item.cls}`}
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                onLoad={mediaSize.onImageLoad}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <p className="absolute bottom-3 left-3 text-xs tracking-[0.12em] text-zinc-200">{item.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PortfolioBento;
