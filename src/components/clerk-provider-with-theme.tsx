'use client';

import { ClerkProvider } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

type ClerkAppearance = React.ComponentProps<typeof ClerkProvider>['appearance'];

// Cores Clerk light mode: azul-violeta (#6C47FF) + fundo branco/cinza claro
const clerkLightAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: '#6C47FF',
    colorBackground: '#f8f8fc',
    colorInputBackground: '#ffffff',
    colorInputText: '#1a1a2e',
    colorText: '#1a1a2e',
    colorTextSecondary: '#6b7280',
    colorNeutral: '#6b7280',
    colorDanger: '#EF4444',
    colorSuccess: '#22c55e',
    borderRadius: '0.5rem',
    fontFamily: 'Roboto, sans-serif',
  },
  elements: {
    card: 'shadow-md border border-[#e5e7eb] bg-white',
    headerTitle: 'text-[#1a1a2e]',
    headerSubtitle: 'text-[#6b7280]',
    formFieldLabel: 'text-[#374151]',
    formFieldInput: 'bg-white border-[#d1d5db] text-[#1a1a2e]',
    footerActionLink: 'text-[#6C47FF] hover:text-[#4F35D4]',
    socialButtonsBlockButton: 'border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]',
    dividerLine: 'bg-[#e5e7eb]',
    dividerText: 'text-[#9ca3af]',
  },
};

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <ClerkProvider appearance={clerkDarkAppearance}>{children}</ClerkProvider>;
}
