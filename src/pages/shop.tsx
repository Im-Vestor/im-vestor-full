import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

interface ProductProps {
  title: string;
  description: string;
}

const Product = ({ title, description }: ProductProps) => {
  return (
    <Card className="flex h-full flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter>
        <Button onClick={() => toast.error('Coming Soon')} className="w-full">
          Buy Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Shop() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
        <h1 className="mb-8 text-2xl font-bold">Shop</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Product
            title="Boost"
            description="Places your project at the top of business sector searches, increasing visibility to potential investors."
          />
          <Product
            title="Poke"
            description="Sends an introduction note to investors about your entrepreneur profile, helping you make that crucial first connection."
          />
          <Product
            title="Hyper Train Ticket"
            description="Makes your project appear in the investors' hyper train feed, exposing your venture to a targeted audience."
          />
          <Product
            title="Daily Pitch Ticket"
            description="Access to 2 public daily pitches open to all investors, hosted by our team, with optional Q&A session. Can be paid access or assigned to entrepreneur projects."
          />
        </div>
      </div>
    </main>
  );
}
