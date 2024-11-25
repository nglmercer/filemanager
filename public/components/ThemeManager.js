export const themes = {
  default: {
    container: 'bg-gray-900/95 rounded-2xl p-6 shadow-xl',
    text: 'text-xl font-semibold text-gray-100',
    media: 'rounded-lg max-w-full',
    animation: 'slide-fade',
    layout: 'flex-col',
    textAnimation: 'text-pop'
  },
  neon: {
    container: 'bg-purple-900/90 rounded-xl p-6 shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-500',
    text: 'text-xl font-bold text-purple-100 drop-shadow-[0_0_5px_rgba(147,51,234,0.5)]',
    media: 'rounded-lg max-w-full border-2 border-purple-500',
    animation: 'bounce-fade',
    layout: 'flex-col-reverse',
    textAnimation: 'text-wave'
  },
  minimal: {
    container: 'bg-white/95 rounded-md p-4 shadow-sm',
    text: 'text-lg font-medium text-gray-800',
    media: 'rounded-md max-w-full',
    animation: 'slide-simple',
    layout: 'flex-row',
    textAnimation: 'text-pop'
  },
  gaming: {
    container: 'bg-red-600/95 rounded-3xl p-6 shadow-2xl border-2 border-yellow-400',
    text: 'text-2xl font-black text-yellow-300 uppercase',
    media: 'rounded-xl max-w-full border-2 border-yellow-400',
    animation: 'shake-fade',
    layout: 'flex-row-reverse',
    textAnimation: 'text-glitch'
  },
  retro: {
    container: 'bg-green-900/90 rounded-none p-6 border-4 border-green-400',
    text: 'text-2xl font-mono text-green-400',
    media: 'rounded-none border-4 border-green-400 max-w-full',
    animation: 'slide-fade',
    layout: 'flex-col',
    textAnimation: 'text-rotate'
  }
};

export const animations = {
  'slide-fade': {
    enter: 'slideIn 2s ease-out, fadeIn 2s ease-out',
    exit: 'slideOut 2s ease-in, fadeOut 2s ease-in'
  },
  'bounce-fade': {
    enter: 'bounceIn 2s cubic-bezier(0.36, 0, 0.66, -0.56), fadeIn 2s ease-out',
    exit: 'bounceOut 2s cubic-bezier(0.34, 1.56, 0.64, 1), fadeOut 2s ease-in'
  },
  'slide-simple': {
    enter: 'slideIn 2s ease-out',
    exit: 'slideOut 2s ease-in'
  },
  'shake-fade': {
    enter: 'shakeIn 0.8s ease-out, fadeIn 2s ease-out',
    exit: 'shakeOut 0.8s ease-in, fadeOut 2s ease-in'
  }
};