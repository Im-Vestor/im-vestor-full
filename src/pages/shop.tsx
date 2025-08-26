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
  value: number;
}

const products = [
  {
    id: 'poke',
    name: '3 Pokes',
    description:
      'Sends an personalized introduction note to other user about your profile, helping you make that crucial first connection.',
    value: 25,
    availableUserTypes: ['ENTREPRENEUR', 'INVESTOR', 'INCUBATOR', 'VC_GROUP'],
  },
  {
    id: 'boost',
    name: 'Boost',
    description:
      'Places your project at the top of business sector searches, increasing visibility to potential investors.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
  },
  {
    id: 'pitch-of-the-week-ticket',
    name: 'Pitch of the Week Ticket',
    description:
      'Access to 2 public weekly pitches open to all investors, hosted by our team, with optional Q&A session. Can be paid access or assigned to entrepreneur projects.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
  },
  {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    description: 'Expose yourself as a potential investor to other entrepreneurs.',
    value: 35,
    availableUserTypes: ['INVESTOR', 'VC_GROUP'],
  },
];

const Product = ({ title, description, onBuy, isLoading, value }: ProductProps) => {
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
  const { user } = useUser();
  const userType = user?.publicMetadata.userType as string;

  // Get user data including available pokes
  const { data: userData, isPending: isUserDataPending } = api.user.getUser.useQuery();

  const { data: existingHypertrainItem, isPending: isExistingHypertrainItemPending } =
    api.hypertrain.getHyperTrainItemByExternalId.useQuery(userData?.investor?.id ?? '', {
      enabled: !!userData?.investor?.id,
    });

  const handlePurchase = async (productId: string) => {
    if (isProcessing || isUserDataPending || isExistingHypertrainItemPending) return;

    setIsProcessing(true);

    if (productId === 'hyper-train-ticket' && existingHypertrainItem) {
      toast.error("You're currently in the hypertrain");
      setIsProcessing(false);
      return;
    }

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
          {products
            .filter(product => product.availableUserTypes.includes(userType))
            .map(product => (
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
