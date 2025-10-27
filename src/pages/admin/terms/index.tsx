import AdminLayout from '../index';
import { useEffect, useRef, useState } from 'react';
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { toast } from 'sonner';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Eraser, Save } from 'lucide-react';

export default function TermsAdminPage() {
  return (
    <AdminLayout>
      <EditorTerms />
    </AdminLayout>
  );
}

function ToolbarButton({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <Button type="button" variant="outline" className="h-9 px-2" onClick={onClick} title={title}>
      {children}
    </Button>
  );
}

function EditorTerms() {
  const { data, isLoading, refetch } = api.content.getByKey.useQuery({ key: 'terms' });
  const saveMutation = api.content.upsertByKey.useMutation();
  const [title, setTitle] = useState<string>('Termos de Utilização');
  const [html, setHtml] = useState<string>('<h1>Termos de Utilização</h1><p>Adicione aqui os termos e condições...</p>');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      setTitle(data.title || 'Termos de Utilização');
      setHtml(data.contentHtml || '<h1>Termos de Utilização</h1>');
    }
  }, [data]);

  const exec = (command: string, value?: string) => {
    if (typeof window === 'undefined') return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = window.prompt('URL do link:');
    if (url) exec('createLink', url);
  };

  const onInput = () => {
    const currentHtml = editorRef.current?.innerHTML ?? '';
    setHtml(currentHtml);
  };

  const onSave = async () => {
    try {
      await saveMutation.mutateAsync({ key: 'terms', title, contentHtml: html });
      toast.success('Termos salvos com sucesso');
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar Termos e Condições</h1>
        <Button onClick={onSave} disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm">Título</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <ToolbarButton onClick={() => exec('bold')} title="Negrito">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="Itálico">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Sublinhar">
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'H1')} title="Cabeçalho 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'H2')} title="Cabeçalho 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Lista não ordenada">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Lista ordenada">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={insertLink} title="Inserir link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec('removeFormat')} title="Remover formatação">
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div
          ref={editorRef}
          className="min-h-[400px] w-full rounded-md border border-white/10 bg-white/5 p-4 focus:outline-none prose prose-invert max-w-none"
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          dangerouslySetInnerHTML={{ __html: isLoading ? '<p>Carregando...</p>' : html }}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Pré-visualização</h2>
        <div className="rounded-md border border-white/10 bg-white/5 p-4">
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}


