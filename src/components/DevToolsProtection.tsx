'use client';

import { useEffect } from 'react';
import { disableDevTools } from '@/utils/dev-logger';

export default function DevToolsProtection() {
  useEffect(() => {
    disableDevTools();
  }, []);

  return null;
} 