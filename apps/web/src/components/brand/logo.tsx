'use client';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: 'w-7 h-7', text: 'text-sm' },
  md: { img: 'w-9 h-9', text: 'text-base' },
  lg: { img: 'w-14 h-14', text: 'text-2xl' },
  xl: { img: 'w-24 h-24', text: 'text-4xl' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = SIZES[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/logo_dreamlife.jpg"
        alt="Dream Life"
        className={cn(s.img, 'logo-transparent object-contain flex-shrink-0')}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-bold tracking-wide text-foreground', s.text)}>DREAM LIFE</span>
          <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase mt-0.5">Anime Store</span>
        </div>
      )}
    </div>
  );
}
