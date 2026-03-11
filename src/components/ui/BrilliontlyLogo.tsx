import Image from 'next/image';

export function BrilliontlyLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  const animalSize = Math.round(size * 0.6);
  const gatorSize = Math.round(size * 0.75);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size * 1.5, height: size }}
    >
      {/* Bull - left side */}
      <Image
        src="/bull.png"
        alt=""
        width={animalSize}
        height={animalSize}
        className="absolute"
        style={{
          left: 0,
          bottom: 0,
          width: animalSize,
          height: animalSize,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        }}
        draggable={false}
      />

      {/* Big Bull the Gator - center front, overlapping */}
      <Image
        src="/gator.png"
        alt="Big Bull the Gator"
        width={gatorSize}
        height={gatorSize}
        className="absolute z-10"
        style={{
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: gatorSize,
          height: gatorSize,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
        }}
        draggable={false}
        priority
      />

      {/* Bear - right side */}
      <Image
        src="/bear.png"
        alt=""
        width={animalSize}
        height={animalSize}
        className="absolute"
        style={{
          right: 0,
          bottom: 0,
          width: animalSize,
          height: animalSize,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
        }}
        draggable={false}
      />
    </div>
  );
}

export function BrilliontlyWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BrilliontlyLogo size={36} />
      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
        Brilliontly
      </span>
    </div>
  );
}
