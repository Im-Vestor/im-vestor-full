import Image from "next/image";
import { DollarSign, Users, Settings, Globe, CircleUser, Signal } from "lucide-react";

export default function Dashboard() {

  return (
    <div className="flex h-screen bg-background text-foreground">

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 bg-background">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Signal className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold">250</div>
              <div className="text-xs text-muted-foreground">Utilizadores Online</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">17</div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">+0.2%</span>
              </div>
              <div className="text-xs text-muted-foreground">Utilizadores 24H</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">120€</div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">+6.2%</span>
              </div>
              <div className="text-xs text-muted-foreground">Inscrições 24H</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">8</div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">-12.1%</span>
              </div>
              <div className="text-xs text-muted-foreground">Projetos Financiados 24H</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">264€</div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">+6.2%</span>
              </div>
              <div className="text-xs text-muted-foreground">Add-Ons 24H</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold">986</div>
              <div className="text-xs text-muted-foreground">Utilizadores Registados</div>
            </div>

            <div className="bg-card rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <CircleUser className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold">490</div>
              <div className="text-xs text-muted-foreground">Empreendedores Registados</div>
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex border-b border-white/10 mb-6">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              Ultimas 24 Horas
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Ultima Semana
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Ultimo Mês
            </button>
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Ultimo Ano
            </button>
          </div>

          {/* Charts and Data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-card rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Rendimento <span className="text-sm text-muted-foreground">(EUR)</span>
                </h3>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                  <span className="text-xs">Total</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                  <span className="text-xs">Inscrições</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs">Add-Ons</span>
                </div>
              </div>
              <div className="h-64 w-full">
                <RevenueChart />
              </div>
            </div>

            {/* Access by Country */}
            <div className="bg-card rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Acessos <span className="text-sm text-muted-foreground">(1586)</span>
                </h3>
              </div>
              <div className="space-y-4">
                <CountryAccessItem country="United States" flag="🇺🇸" percentage={27} />
                <CountryAccessItem country="Portugal" flag="🇵🇹" percentage={20} />
                <CountryAccessItem country="United Kingdom" flag="🇬🇧" percentage={16} />
                <CountryAccessItem country="France" flag="🇫🇷" percentage={8} />
                <CountryAccessItem country="Argentina" flag="🇦🇷" percentage={7} />
                <button className="w-full mt-4 py-2 text-sm text-center text-muted-foreground hover:text-foreground border border-white/10 rounded-md">
                  Ver mais
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Investment Areas */}
            <div className="bg-card rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Areas de Investimento <span className="text-sm text-muted-foreground">(mais impactantes)</span>
                </h3>
              </div>
              <div className="flex justify-center mb-4">
                <div className="h-48 w-48">
                  <InvestmentPieChart />
                </div>
              </div>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  <span className="text-xs">Area 1</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                  <span className="text-xs">Area 2</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs">Area 3</span>
                </div>
              </div>
            </div>

            {/* Meetings */}
            <div className="bg-card rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Reuniões Realizadas</h3>
              </div>
              <div className="mb-4">
                <div className="h-8 bg-yellow-400/80 rounded-md flex items-center justify-center text-black font-medium">
                  37
                </div>
              </div>
              <div className="mb-2 text-sm text-muted-foreground">
                Situações reportadas em reuniões <span className="text-xs">(4)</span>
              </div>

              <div className="space-y-4">
                <MeetingReport
                  id="1587"
                  description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor..."
                  tag="Má linguagem"
                />
                <MeetingReport
                  id="1587"
                  description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor..."
                />
              </div>
            </div>

            {/* Support */}
            <div className="bg-card rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  Suporte <span className="text-sm text-muted-foreground">(Tickets)</span>
                </h3>
              </div>
              <div className="space-y-4">
                <SupportItem label="Abertos" value={16} color="bg-yellow-400" />
                <SupportItem label="Respondidos" value={12} color="bg-green-500" />
                <SupportItem label="P/ Responder" value={4} color="bg-red-500" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function CountryAccessItem({ country, flag, percentage }: { country: string; flag: string; percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl">{flag}</div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm">{country}</span>
          <span className="text-sm">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    </div>
  )
}

function SupportItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm">{value}</span>
      </div>
      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / 16) * 100}%` }}></div>
      </div>
    </div>
  )
}

function MeetingReport({ id, description, tag }: { id: string; description: string; tag?: string }) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Reunião #{id}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Reportado por</span>
          <div className="h-6 w-6 rounded-full bg-accent overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="User Avatar"
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      {tag && (
        <div className="flex">
          <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">{tag}</span>
        </div>
      )}
    </div>
  )
}

function RevenueChart() {
  // This would normally use a chart library like recharts
  // For this example, we'll create a simple visual representation
  return (
    <div className="relative h-full w-full flex items-end justify-between gap-1 pb-4">
      {[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
        <div key={hour} className="flex-1 flex items-end gap-0.5 h-full">
          <div className="w-1/3 bg-yellow-400 rounded-t-sm" style={{ height: `${Math.random() * 70 + 20}%` }}></div>
          <div className="w-1/3 bg-indigo-500 rounded-t-sm" style={{ height: `${Math.random() * 50 + 10}%` }}></div>
          <div className="w-1/3 bg-blue-500 rounded-t-sm" style={{ height: `${Math.random() * 60 + 15}%` }}></div>
          <div className="absolute -bottom-2 text-[8px] text-muted-foreground">{hour}:00</div>
        </div>
      ))}
    </div>
  )
}

function InvestmentPieChart() {
  // This would normally use a chart library
  // For this example, we'll use a simple SVG
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ddd" strokeWidth="1" />

      {/* Blue segment - 40% */}
      <path d="M 50 50 L 50 10 A 40 40 0 0 1 87.32 65 Z" fill="#3b82f6" />

      {/* Yellow segment - 35% */}
      <path d="M 50 50 L 87.32 65 A 40 40 0 0 1 28.68 85 Z" fill="#f0d687" />

      {/* Red segment - 25% */}
      <path d="M 50 50 L 28.68 85 A 40 40 0 0 1 50 10 Z" fill="#ef4444" />
    </svg>
  )
}
