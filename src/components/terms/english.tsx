import { useEffect, useRef, useState } from 'react';
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Eraser,
  Save,
} from 'lucide-react';

function ToolbarButton({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button type="button" variant="outline" className="h-9 px-2" onClick={onClick} title={title}>
      {children}
    </Button>
  );
}

export function EnglishTerms() {
  const { data, isLoading, refetch } = api.content.getByKey.useQuery({ key: 'terms-english' });
  const saveMutation = api.content.upsertByKey.useMutation();
  const [title, setTitle] = useState<string>('Terms');
  const [html, setHtml] = useState<string>(
    '<h1>Terms of Use</h1><p>Add the terms and conditions here...</p>'
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef<boolean>(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title || 'Termos de Utilização');
      const newHtml = data.contentHtml || '<h1>Termos de Utilização</h1>';
      setHtml(newHtml);
      // Initialize editor content without triggering React re-render
      if (editorRef.current) {
        editorRef.current.innerHTML = newHtml;
      }
    }
  }, [data]);

  // Ensure the editor has initial content when mounted (for default state before data loads)
  useEffect(() => {
    if (!isLoading && editorRef.current && !editorRef.current.innerHTML && html) {
      editorRef.current.innerHTML = html;
    }
  }, [isLoading, html]);

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
    if (isComposingRef.current) return;
    const currentHtml = editorRef.current?.innerHTML ?? '';
    setHtml(currentHtml);
  };

  const onCompositionStart = () => {
    isComposingRef.current = true;
  };

  const onCompositionEnd = () => {
    isComposingRef.current = false;
    onInput();
  };

  const onSave = async () => {
    try {
      await saveMutation.mutateAsync({ key: 'terms-english', title, contentHtml: html });
      toast.success('Termos salvos com sucesso');
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Terms and Conditions</h1>
        <Button onClick={onSave} disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm">Title</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
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
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Preview</h2>
        <div className="rounded-md border border-white/10 bg-white/5 p-4">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
