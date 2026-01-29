'use client';

import { useEffect } from 'react';

/**
 * Initialize app on mount
 * Runs DB indexes and other startup tasks
 */
export default function AppInitializer() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Call init endpoint to setup database
        const response = await fetch('/api/init', {
          method: 'POST',
        });

        if (response.ok) {
          console.log('✓ App initialized successfully');
        }
      } catch (error) {
        console.warn('App initialization warning:', error);
      }
    };

    initializeApp();
  }, []);

  return null;
}
