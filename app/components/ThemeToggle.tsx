'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = ['light', 'dark', 'oled'];
  const current = theme || 'light';

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(current);
    // If current is not in themes (e.g. system), start with light
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getLabel = () => {
    if (current === 'light') return '☀️ Light';
    if (current === 'dark') return '🌙 Dark';
    if (current === 'oled') return '🖤 OLED';
    return '🖥️ System';
  };

  return (
    <button
      onClick={toggleTheme}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
      aria-label="Toggle Theme"
    >
      {getLabel()}
    </button>
  );
}
