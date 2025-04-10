import { Search, Bell, Upload, Edit, Trash } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Button } from "~/components/ui/button"

export function DashboardContent() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-medium h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisa"
              className="w-full bg-dark rounded-md py-2 pl-10 pr-4 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-badge-yellow"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-badge-yellow flex items-center justify-center text-background font-medium">
              U
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-3">
          <div className="bg-dark-sidebar rounded-md p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red/20 flex items-center justify-center">
                <Bell size={16} className="text-red" />
              </div>
              <span className="text-2xl font-bold">10</span>
            </div>
            <p className="text-sm text-text-secondary">Reports de Bugs/Problemas</p>
          </div>
        </div>

        <div className="col-span-9">
          <div className="grid grid-cols-3 gap-4 h-full">
            <TicketColumn title="Não Vistas" />
            <TicketColumn title="A tratar" />
            <TicketColumn title="Arquivados" showMore />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <FaqSection />
        <VideoSection />
      </div>
    </div>
  )
}

interface TicketColumnProps {
  title: string
  showMore?: boolean
}

function TicketColumn({ title, showMore }: TicketColumnProps) {
  return (
    <div className="bg-dark-sidebar rounded-md p-4 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{title}</h3>
        {showMore && <button className="text-xs text-text-secondary hover:text-text-primary">Ver mais</button>}
      </div>
      <div className="space-y-4">
        <TicketCard />
        <TicketCard withImage />
        <TicketCard />
      </div>
    </div>
  )
}

interface TicketCardProps {
  withImage?: boolean
}

function TicketCard({ withImage }: TicketCardProps) {
  return (
    <div className="bg-dark rounded-md p-3 border border-border">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-badge-yellow text-background text-xs px-2 py-0.5 rounded-sm font-medium">Bug</span>
      </div>
      <p className="text-xs text-text-secondary mb-2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </p>
      {withImage && (
        <div className="mt-2 rounded-md overflow-hidden">
          <img
            src="/placeholder.svg?height=80&width=220"
            alt="Ticket screenshot"
            className="w-full h-20 object-cover"
          />
        </div>
      )}
    </div>
  )
}

function FaqSection() {
  return (
    <div className="bg-dark-sidebar rounded-md p-4 border border-border">
      <h2 className="text-lg font-medium mb-4">Secção de FAQ</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Relativas a Empreendedores</h3>

        <Accordion type="single" collapsible className="space-y-2">
          <FaqItem
            question="Posso encontrar um investidor para os meus projetos sem pagar?"
            answer="Se o teu projeto precisar até 5 mil euros de financiamento, podes, regista-te já no plano free"
            defaultOpen
          />
          <FaqItem question="Posso ter mais do que um investidor no meu projeto?" />
          <FaqItem question="Posso registar mais do que um projeto ?" />
          <FaqItem question="Podem roubar-me a ideia de projeto/negócio?" />
        </Accordion>

        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 text-text-secondary">
            Adicionar FAQ <span className="text-lg">+</span>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Relativas a Investidores</h3>

        <Accordion type="single" collapsible className="space-y-2">
          <FaqItem
            question="Posso encontrar negócios projetos e produtos para investir sem ter de pagar ao site?"
            answer="Podes, encontra projectos produtos e negócios para investir até 5 mil euros, regista-te já no plano experimental free."
            defaultOpen
          />
          <FaqItem question="Se ocupar uma slot de investidor e desistir tenho de pagar alguma coisa?" />
          <FaqItem question="Poderei esconder a minha identidade?" />
          <FaqItem question="O que é o 'PYMWYM'?" />
          <FaqItem question="Qual é o valor mínimo que tenho de investir?" />
        </Accordion>

        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1 text-text-secondary">
            Adicionar FAQ <span className="text-lg">+</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface FaqItemProps {
  question: string
  answer?: string
  defaultOpen?: boolean
}

function FaqItem({ question, answer, defaultOpen }: FaqItemProps) {
  return (
    <AccordionItem value={question} className="border border-border rounded-md overflow-hidden">
      <AccordionTrigger className="px-4 py-3 text-sm font-medium flex hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="text-red">❌</span>
          {question}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 text-sm text-text-secondary bg-dark">
        {answer || "Resposta não disponível."}
      </AccordionContent>
    </AccordionItem>
  )
}

function VideoSection() {
  return (
    <div className="bg-dark-sidebar rounded-md p-4 border border-border">
      <h2 className="text-lg font-medium mb-4">Vídeos explicativos</h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Geral</h3>
          <div className="flex items-center gap-2">
            <button className="text-text-secondary hover:text-text-primary">
              <Edit size={14} />
            </button>
            <span className="text-text-secondary">8</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <VideoCard title="Criar Conta" />

          <div className="border border-border rounded-md flex flex-col items-center justify-center p-6 text-center">
            <Upload className="mb-2 text-text-secondary" size={24} />
            <p className="text-xs text-text-secondary mb-1">Clica para fazer upload ou arrasta e larga</p>
            <p className="text-xs text-text-secondary mb-3">Tamanho máximo: 50MB</p>
            <Button size="sm" className="bg-blue hover:bg-blue/90 text-xs">
              Adicionar Vídeo
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Empreendedores</h3>
          <div className="flex items-center gap-2">
            <button className="text-text-secondary hover:text-text-primary">
              <Edit size={14} />
            </button>
            <span className="text-text-secondary">8</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <VideoCard title="Dashboard" />
          <VideoCard title="Publicar um projeto" />
          <VideoCard title="Projetos" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Empreendedores</h3>
          <div className="flex items-center gap-2">
            <button className="text-text-secondary hover:text-text-primary">
              <Edit size={14} />
            </button>
            <span className="text-text-secondary">8</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <VideoCard title="Dashboard" />
          <VideoCard title="Procurar investimentos" />
          <VideoCard title="Reuniões" />
        </div>
      </div>

      <div className="mt-4">
        <Button className="w-full bg-badge-yellow hover:bg-badge-yellow/90 text-background">Adicionar Categoria</Button>
      </div>
    </div>
  )
}

interface VideoCardProps {
  title: string
}

function VideoCard({ title }: VideoCardProps) {
  return (
    <div className="relative border border-border rounded-md overflow-hidden group">
      <img src="/placeholder.svg?height=150&width=250" alt={title} className="w-full h-36 object-cover" />
      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-6 h-6 bg-dark rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary">
          <Edit size={12} />
        </button>
        <button className="w-6 h-6 bg-dark rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary mt-1">
          <Trash size={12} />
        </button>
      </div>
      <div className="p-2 text-center">
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
    </div>
  )
}

