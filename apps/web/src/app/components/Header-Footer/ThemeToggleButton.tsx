'use client';

import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;

    const html = document.documentElement;
    // If no theme class is set, assume light theme (default)
    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('light');
      return false;
    }
    return html.classList.contains('dark');
  });

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));
    // Listen for class changes in case theme is changed elsewhere
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains('dark'));
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(html.classList.contains('dark'));
  };

  return (
    <button
      className="themeButton"
      aria-label="Toggle Dark Mode"
      type="button"
      onClick={toggleTheme}
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}
