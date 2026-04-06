import { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const INITIAL_POSITION = { x: 50, y: 35 };

function SpotlightBackground({ focusTight = false }) {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const { config } = useConfig();

  const spotlightRadius = focusTight ? config.spotlightRadius * 0.7 : config.spotlightRadius;
  const vignetteIntensity = config.vignetteIntensity;

  useEffect(() => {
    const handlePointerMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setPosition({ x, y });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `
          radial-gradient(
            ${spotlightRadius}px circle at ${position.x}% ${position.y}%,
            rgba(148, 163, 184, ${focusTight ? 0.24 : 0.18}) 0%,
            rgba(71, 85, 105, ${focusTight ? 0.15 : 0.12}) 28%,
            rgba(15, 23, 42, 0.08) 46%,
            rgba(2, 6, 23, 0) 70%
          ),
          radial-gradient(
            140% 110% at 50% 42%,
            rgba(2, 6, 23, 0) 55%,
            rgba(0, 0, 0, ${focusTight ? 0.36 + vignetteIntensity * 0.18 : 0.24 + vignetteIntensity * 0.15}) 82%,
            rgba(0, 0, 0, ${focusTight ? 0.52 + vignetteIntensity * 0.22 : 0.44 + vignetteIntensity * 0.2}) 100%
          )
        `,
        transition: 'background 260ms ease-in-out',
      }}
    />
  );
}

export default SpotlightBackground;
