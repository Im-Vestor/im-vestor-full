'use client';

import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

type ClerkAppearance = React.ComponentProps<typeof ClerkProvider>['appearance'];

// Cores dark mode: mantém o padrão escuro do Clerk (sem customização pesada)
const clerkDarkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: '#EDD689',
    colorBackground: '#030014',
    colorInputBackground: 'rgba(255,255,255,0.05)',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.7)',
    colorNeutral: 'rgba(255,255,255,0.5)',
    colorDanger: '#EF4444',
    colorSuccess: '#22c55e',
    borderRadius: '0.5rem',
    fontFamily: 'Roboto, sans-serif',
  },
  elements: {
    card: 'border border-white/10 bg-[rgb(29,26,44)]',
    formFieldInput: 'bg-white/5 border-white/10 text-white',
    footerActionLink: 'text-[#EDD689] hover:text-[#D3B662]',
    socialButtonsBlockButton: 'border-white/10 text-white hover:bg-white/5',
  },
};

export function ClerkProviderWithTheme({ children }: { children: React.ReactNode; }) {
  return <ClerkProvider appearance={clerkDarkAppearance}>{children}</ClerkProvider>;
}
