import { useState, useEffect } from 'react';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Switch } from './switch';
import { useTranslation } from '~/hooks/use-translation';
import { Settings2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const t = useTranslation();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    } else {
      setSettings(JSON.parse(consent));
    }
  }, []);

  const handleAcceptAll = () => {
    const newSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(newSettings));
    setSettings(newSettings);
    setShowConsent(false);
    setShowPreferences(false);
  };

  const handleRejectAll = () => {
    const newSettings = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(newSettings));
    setSettings(newSettings);
    setShowConsent(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    setShowConsent(false);
    setShowPreferences(false);
  };

  const handleToggle = (key: keyof CookieSettings) => {
    if (key === 'necessary') return;
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showConsent && !showPreferences) return null;

  return (
    <AnimatePresence>
      {(showConsent || showPreferences) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-white/10 shadow-lg"
        >
          <div className="container mx-auto p-4 md:p-6">
            {!showPreferences ? (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">{t('cookieConsent')}</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {t('cookieConsentDescription')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreferences(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    {t('preferences')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                  >
                    {t('rejectAll')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {t('acceptAll')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{t('preferences')}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreferences(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t('necessaryCookies')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('necessaryCookiesDescription')}
                      </p>
                    </div>
                    <Switch checked={settings.necessary} disabled />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t('analyticsCookies')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('analyticsCookiesDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.analytics}
                      onCheckedChange={() => handleToggle('analytics')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t('marketingCookies')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('marketingCookiesDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.marketing}
                      onCheckedChange={() => handleToggle('marketing')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t('preferenceCookies')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('preferenceCookiesDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.preferences}
                      onCheckedChange={() => handleToggle('preferences')}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreferences(false)}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {t('savePreferences')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}