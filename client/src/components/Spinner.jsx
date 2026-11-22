const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

// size: sm | md | lg    fullScreen: dim overlay over the whole page
export const Spinner = ({ size = 'md', label, fullScreen = false, className = '' }) => {
  const spinner = (
    <div role="status" aria-live="polite" className={`flex flex-col items-center gap-3 ${className}`}>
      <span
        className={`inline-block animate-spin rounded-full border-slate-300 border-t-rose-500 ${SIZES[size] || SIZES.md}`}
      />
      {label ? <span className="text-sm font-medium text-slate-600">{label}</span> : <span className="sr-only">Loading</span>}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      {spinner}
    </div>
  );
};
