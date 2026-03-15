'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import React from 'react';

type ClerkAppearance = React.ComponentProps<typeof ClerkProvider>['appearance'];

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

const clerkLightAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: '#6C47FF',
    colorBackground: '#ffffff',
    colorInputBackground: '#f5f5f5',
    colorInputText: '#1a1a2e',
    colorText: '#1a1a2e',
    colorTextSecondary: 'rgba(26,26,46,0.7)',
    colorNeutral: 'rgba(26,26,46,0.5)',
    colorDanger: '#EF4444',
    colorSuccess: '#22c55e',
    borderRadius: '0.5rem',
    fontFamily: 'Roboto, sans-serif',
  },
  elements: {
    card: 'border border-gray-200 bg-white',
    formFieldInput: 'bg-gray-50 border-gray-200 text-gray-900',
    footerActionLink: 'text-[#6C47FF] hover:text-[#4F35D4]',
    socialButtonsBlockButton: 'border-gray-200 text-gray-900 hover:bg-gray-50',
  },
};

function ClerkProviderInner({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const appearance = resolvedTheme === 'light' ? clerkLightAppearance : clerkDarkAppearance;

  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}

export function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  return <ClerkProviderInner>{children}</ClerkProviderInner>;
}
