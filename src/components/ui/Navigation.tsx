'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const modes = [
  { name: 'Investing', href: '/investing', icon: 'chart' },
  { name: 'Day Trading', href: '/day-trading', icon: 'bolt' },
  { name: 'Retirement', href: '/retirement', icon: 'piggy' },
];

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-8 4 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
  </svg>
);

const PiggyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

function getIcon(icon: string) {
  switch (icon) {
    case 'chart': return <ChartIcon />;
    case 'bolt': return <BoltIcon />;
    case 'piggy': return <PiggyIcon />;
    default: return null;
  }
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Brillontly
            </span>
          </Link>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#111827] rounded-lg p-1">
            {modes.map((mode) => {
              const isActive = pathname.startsWith(mode.href);
              return (
                <Link
                  key={mode.href}
                  href={mode.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#1e293b] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#1e293b]/50'
                  )}
                >
                  {getIcon(mode.icon)}
                  <span className="hidden sm:inline">{mode.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/accounts"
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === '/accounts' ? 'text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              Accounts
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
