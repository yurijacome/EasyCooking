'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    // Set light theme as default if no theme is currently set
    const html = document.documentElement;

    if (!html.classList.contains('light') && !html.classList.contains('dark')) {
      html.classList.add('light');
    }
  }, []);

  return null; // This component doesn't render anything
}
