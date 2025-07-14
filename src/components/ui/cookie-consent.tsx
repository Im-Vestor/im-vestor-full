import { useEffect, useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Switch } from './switch';

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
}

export function CookieConsent() {
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
  });
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      setIsOpen(false);
      setSettings(JSON.parse(consent) as CookieSettings);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-[400px] z-50">
      <CardHeader>
        <CardTitle>Cookie Preferences</CardTitle>
        <CardDescription>Manage your cookie settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Necessary</p>
            <p className="text-sm text-muted-foreground">Required for the website to function</p>
          </div>
          <Switch checked disabled />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Analytics</p>
            <p className="text-sm text-muted-foreground">Help us improve by tracking usage</p>
          </div>
          <Switch
            checked={settings.analytics}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, analytics: checked }))}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Close
        </Button>
        <Button onClick={handleSave}>Save preferences</Button>
      </CardFooter>
    </Card>
  );
}
