import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
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
import { api } from '~/utils/api';

interface ProductProps {
  title: string;
  description: string;
  onBuy?: () => void;
  isLoading?: boolean;
  onlyEntrepreneur?: boolean;
  value: number;
}

const products = [
  {
    id: 'poke',
    name: '3 Pokes',
    description:
      'Sends an introduction note to investors about your entrepreneur profile, helping you make that crucial first connection.',
    onlyEntrepreneur: true,
    value: 25,
  },
  {
    id: 'boost',
    name: 'Boost',
    description:
      'Places your project at the top of business sector searches, increasing visibility to potential investors.',
    onlyEntrepreneur: true,
    value: 20,
  },
  {
    id: 'daily-pitch-ticket',
    name: 'Daily Pitch Ticket',
    description:
      'Access to 2 public daily pitches open to all investors, hosted by our team, with optional Q&A session. Can be paid access or assigned to entrepreneur projects.',
    onlyEntrepreneur: false,
    value: 20,
  },
  {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    description:
      "Makes your project appear in the investors' hyper train feed, exposing your venture to a targeted audience.",
    onlyEntrepreneur: false,
    value: 35,
  },
];

const Product = ({
  title,
  description,
  onBuy,
  isLoading,
  onlyEntrepreneur,
  value,
}: ProductProps) => {
  const { user } = useUser();
  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';

  if (onlyEntrepreneur && !isEntrepreneur) {
    return null;
  }

  return (
    <Card className="flex h-full flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow w-full items-center justify-center">
        <p className="text-2xl font-bold">
          {value}€ <span className="text-sm text-neutral-500">+ IVA</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onBuy ?? (() => toast.error('Coming Soon'))}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Buy Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Shop() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user data including available pokes
  const { data: userData } = api.user.getUser.useQuery();

  const handlePurchase = async (productId: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = (await response.json()) as {
        sessionId: string;
        url: string;
      };

      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shop</h1>
          {userData && (
            <div className="rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-sm font-medium">
                Available Pokes: {userData.availablePokes}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <Product
              key={product.id}
              title={product.name}
              description={product.description}
              onBuy={() => handlePurchase(product.id)}
              isLoading={isProcessing}
              value={product.value}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
