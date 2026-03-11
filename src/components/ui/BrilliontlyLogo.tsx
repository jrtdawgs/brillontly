export function BrilliontlyLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="bGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#bGradBg)" stroke="url(#bGrad)" strokeWidth="2" />
      {/* Stylized B letter */}
      <path
        d="M16 10h8c3.5 0 6.5 1.2 6.5 5.2 0 2.8-1.8 4.2-4 4.8v0.2c2.8 0.5 5 2.2 5 5.5 0 4.5-3.5 6.3-7.5 6.3H16V10z
           M21 18.5h2.5c2 0 3.2-0.8 3.2-2.8 0-2-1.3-2.7-3.2-2.7H21v5.5z
           M21 29h3c2.2 0 3.5-1 3.5-3.2 0-2.2-1.3-3.3-3.8-3.3H21V29z"
        fill="url(#bGrad)"
      />
    </svg>
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
