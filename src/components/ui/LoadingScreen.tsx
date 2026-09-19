import { motion } from 'motion/react';
import { Gem } from 'lucide-react';

interface LoadingScreenProps {
  logo?: string | null;
  title?: string;
  subtitle?: string;
}

export default function LoadingScreen({ 
  logo, 
  title = 'Catálogo de Joyería',
  subtitle = 'Cargando colecciones exclusivas...' 
}: LoadingScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white px-6 select-none overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.08)_0%,_transparent_65%)]" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated Logo or Gem Monogram */}
        <motion.div
          animate={{ 
            scale: [0.97, 1.02, 0.97],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ 
            duration: 2.4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="flex items-center justify-center mb-6"
        >
          {logo ? (
            <img 
              src={logo} 
              alt={title}
              className="max-h-20 md:max-h-24 w-auto max-w-[240px] sm:max-w-[300px] object-contain drop-shadow-[0_4px_24px_rgba(197,160,89,0.22)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-[#C5A059]/40 bg-[#0F0F0F] flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.15)]">
              <Gem className="w-7 h-7 text-[#C5A059]" />
            </div>
          )}
        </motion.div>

        {/* Title if no logo or as elegant complement */}
        {!logo && (
          <h2 className="font-serif italic text-xl sm:text-2xl text-[#F2F2F2] tracking-wide mb-2 font-light">
            {title}
          </h2>
        )}

        {/* Animated Gold Shimmer Hairline Bar */}
        <div className="w-40 sm:w-48 h-[2px] bg-[#161616] rounded-full overflow-hidden relative my-4 border border-[#222]">
          <motion.div 
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent shadow-[0_0_12px_#C5A059]"
            animate={{ 
              x: ['-100%', '250%'] 
            }}
            transition={{ 
              duration: 1.8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>

        {/* Status text */}
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-medium mt-1">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}
