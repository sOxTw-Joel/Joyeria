import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[#C5A059] text-black font-bold hover:bg-[#d4b373]': variant === 'primary',
            'bg-[#161616] text-white border border-[#333] hover:border-[#C5A059]': variant === 'secondary',
            'border border-[#333] bg-transparent hover:border-[#C5A059] text-white hover:text-[#C5A059]': variant === 'outline',
            'bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-900': variant === 'danger',
            'hover:bg-[#161616] hover:text-white text-neutral-400': variant === 'ghost',
            'h-9 px-4 py-2': size === 'md',
            'h-8 rounded-md px-3 text-[10px] uppercase tracking-widest': size === 'sm',
            'h-10 rounded-md px-8 text-[11px] uppercase tracking-widest': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
