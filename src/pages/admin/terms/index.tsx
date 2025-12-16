import AdminLayout from '../index';
import { useState } from 'react';
import { FileText, Globe } from 'lucide-react';
import { EnglishTerms } from '~/components/terms/english';
import { PortugueseTerms } from '~/components/terms/portuguese';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { AdminPageHeader } from '~/components/admin/shared';
import { Card } from '~/components/ui/card';

export default function TermsAdminPage() {
  return (
    <AdminLayout>
      <EditorTerms />
    </AdminLayout>
  );
}

function EditorTerms() {
  const [activeTab, setActiveTab] = useState('english');

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Termos e Condições"
        description="Gerencie e edite os termos e condições para as versões em inglês e português"
        icon={FileText}
        iconLabel="Settings"
      />

      <Card className="bg-card/30 backdrop-blur-sm border-white/10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-white/10">
            <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 p-0 h-auto">
              <TabsTrigger
                value="english"
                className="flex items-center justify-center gap-2 py-4 px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span>English</span>
              </TabsTrigger>
              <TabsTrigger
                value="portuguese"
                className="flex items-center justify-center gap-2 py-4 px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span>Português</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="english" className="mt-0">
              <EnglishTerms />
            </TabsContent>

            <TabsContent value="portuguese" className="mt-0">
              <PortugueseTerms />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
