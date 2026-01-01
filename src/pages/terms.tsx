import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Loader2, Globe } from 'lucide-react';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/use-translation';
import { useLanguage } from '~/contexts/LanguageContext';
import { useState } from 'react';

export default function Terms() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { language } = useLanguage();
  const t = useTranslation();
  const [viewingLanguage, setViewingLanguage] = useState<'pt-PT' | 'en-US'>(
    language === 'en-US' ? 'en-US' : 'pt-PT'
  );

  // Use terms-english for en-US and terms-portuguese for pt-PT
  const contentKey = viewingLanguage === 'en-US' ? 'terms-english' : 'terms';
  const { data } = api.content.getByKey.useQuery({ key: contentKey });
  const isViewingEnglish = viewingLanguage === 'en-US';

  const toggleLanguage = () => {
    setViewingLanguage(prev => (prev === 'en-US' ? 'pt-PT' : 'en-US'));
  };

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="mt-4 w-[80%]">
        <Header />
      </div>
      {isLoaded && !isSignedIn && (
        <div className="mt-4">
          <Button onClick={() => router.push('/')} className="text-primary hover:opacity-70">
            <ArrowLeft className="h-4 w-4 text-yellow-400" />
            {t('back')}
          </Button>
        </div>
      )}
      <div className="mt-8 w-full max-w-5xl rounded-2xl border-4 border-white/10 bg-[#181920] bg-opacity-30 p-8 backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-center text-4xl font-semibold text-[#E5CD82] flex-1">
            {data?.title ?? 'Terms & Conditions'}
          </h1>
          <Button
            onClick={toggleLanguage}
            variant="outline"
            className="ml-4 border-white/20 text-neutral-200 hover:bg-white/10 hover:text-white"
          >
            <Globe className="mr-2 h-4 w-4" />
            {isViewingEnglish ? t('viewInPortuguese') : t('viewInEnglish')}
          </Button>
        </div>
        
        {isViewingEnglish && (
          <div className="mb-6 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-200">
              {t('englishVersionDisclaimer')}
            </p>
          </div>
        )}

        <div className="space-y-6 text-neutral-100">
          {data?.contentHtml ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: data.contentHtml }}
            />
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
