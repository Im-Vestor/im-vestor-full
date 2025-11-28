import { useUser } from '@clerk/nextjs';
import { Hand, Megaphone, Train, Zap, ShoppingCart, type LucideIcon } from 'lucide-react';
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
import { ProjectSelectionDialog } from '~/components/shop/project-selection-dialog';
import { api } from '~/utils/api';

interface ProductProps {
  title: string;
  description: string;
  onBuy?: () => void;
  isLoading?: boolean;
  value: number;
  icon: LucideIcon;
}

const products = [
  {
    id: 'poke',
    name: '3 Pokes',
    description:
      'Sends an personalized introduction note to other user about your profile, helping you make that crucial first connection.',
    value: 25,
    availableUserTypes: ['ENTREPRENEUR', 'INVESTOR', 'INCUBATOR', 'VC_GROUP'],
    icon: Hand,
  },
  {
    id: 'boost',
    name: 'Boost',
    description:
      'Places your project at the top of business sector searches, increasing visibility to potential investors.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
    icon: Zap,
  },
  {
    id: 'public-pitch-ticket',
    name: 'Public Pitch Ticket',
    description:
      'Gain access to 2 public pitches, open to all investors and VCs. By purchasing this add-on, you can schedule your own Public Pitch.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
    icon: Megaphone,
  },
  {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    description: 'Get featured in the Hyper Train feed to increase visibility and connect with potential partners, investors, or entrepreneurs.',
    value: 35,
    availableUserTypes: ['ENTREPRENEUR', 'INVESTOR', 'VC_GROUP'],
    icon: Train,
  },
];

const Product = ({ title, description, onBuy, isLoading, value, icon: Icon }: ProductProps) => {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-2 border-white/5 bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:-translate-y-1 hover:border-primary-solid/50 hover:shadow-2xl hover:shadow-primary-solid/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-solid/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="relative z-10 pb-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-solid/10 text-primary-solid transition-colors duration-300 group-hover:bg-primary-solid group-hover:text-black">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-primary">
          {title}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed text-white/60">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 flex w-full flex-grow flex-col justify-end py-6">
        <div className="flex items-baseline gap-1">
          <p className="text-4xl font-bold tracking-tight text-white group-hover:text-primary transition-colors duration-300">
            {value}€
          </p>
          <span className="text-sm font-medium uppercase tracking-wider text-white/40">
            + IVA
          </span>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 pt-0">
        <Button
          onClick={onBuy ?? (() => toast.error('Coming Soon'))}
          className="w-full gap-2 font-bold shadow-lg shadow-primary-solid/5 transition-all hover:shadow-primary-solid/20"
          disabled={isLoading}
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              Buy Now <ShoppingCart className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Shop() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const userType = user?.publicMetadata.userType as string;

  // Debug logs
  console.log('Shop component rendered with:', {
    user: !!user,
    userType,
    isProcessing,
    showProjectSelection
  });

  // Get user data including available pokes
  const { data: userData, isPending: isUserDataPending } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache user data to avoid unnecessary requests
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Get entrepreneur projects for project selection
  const { data: entrepreneurData, isPending: isEntrepreneurDataPending } =
    api.entrepreneur.getByUserId.useQuery(undefined, {
      enabled: isLoaded && isSignedIn && userType === 'ENTREPRENEUR',
    });

  // For entrepreneurs, we'll check for existing hypertrain items when they try to purchase
  // For investors, we check their existing hypertrain item
  const { data: existingHypertrainItem, isPending: isExistingHypertrainItemPending } =
    api.hypertrain.getHyperTrainItemByExternalId.useQuery(
      userData?.investor?.id ?? '',
      {
      enabled: userType === 'INVESTOR' && !!userData?.investor?.id,
      }
    );

  // Debug hypertrain query
  console.log('Hypertrain query state:', {
    userType,
    investorId: userData?.investor?.id,
    enabled: userType === 'INVESTOR' && !!userData?.investor?.id,
    isPending: isExistingHypertrainItemPending,
    data: existingHypertrainItem
  });

  const handlePurchase = async (productId: string, projectId?: string) => {
    console.log('handlePurchase called with:', { productId, projectId, isProcessing, isUserDataPending, isExistingHypertrainItemPending });

    // Only block if user data is still loading or if we're already processing
    if (isProcessing || isUserDataPending) {
      console.log('Purchase blocked due to loading state');
      return;
    }

    // Only check hypertrain loading state if the product is hyper-train-ticket AND user is investor
    if (productId === 'hyper-train-ticket' && userType === 'INVESTOR' && isExistingHypertrainItemPending) {
      console.log('Purchase blocked due to hypertrain loading state for investor');
      return;
    }

    setIsProcessing(true);

    // Check for existing hypertrain items
    if (productId === 'hyper-train-ticket') {
      console.log('Processing hypertrain ticket purchase:', {
        userType,
        existingHypertrainItem,
        isExistingHypertrainItemPending
      });

      // For investors, check if they already have a hypertrain item
      if (userType === 'INVESTOR' && existingHypertrainItem) {
        console.log('Investor already has hypertrain item, blocking purchase');
        toast.error("You're currently in the hypertrain");
        setIsProcessing(false);
        return;
      }
    }

    // For entrepreneurs buying hyper-train-ticket, show project selection if no projectId provided
    if (productId === 'hyper-train-ticket' && userType === 'ENTREPRENEUR' && !projectId) {
      console.log('Entrepreneur buying hypertrain without projectId:', {
        entrepreneurData: !!entrepreneurData,
        projects: entrepreneurData?.projects?.length
      });

      if (!entrepreneurData?.projects || entrepreneurData.projects.length === 0) {
        console.log('No projects found, blocking purchase');
        toast.error('You need to create a project first to use Hyper Train');
        setIsProcessing(false);
        return;
      }

      console.log('Showing project selection dialog');
      setShowProjectSelection(true);
      setIsProcessing(false);
      return;
    }

    try {
      console.log('Making API call to /api/stripe/checkout with:', { productId, projectId });

      const response = await fetch(`/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          projectId,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to create checkout session: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('API response data:', responseData);

      const { url } = responseData as {
        sessionId: string;
        url: string;
      };

      if (!url) {
        throw new Error('No checkout URL received from API');
      }

      console.log('Redirecting to checkout URL:', url);
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProjectSelection = (projectId: string) => {
    handlePurchase('hyper-train-ticket', projectId);
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
            .filter(product => {
              if (!userType) return false;
              return product.availableUserTypes.includes(userType);
            })
            .map(product => (
              <Product
                key={product.id}
                title={product.name}
                description={product.description}
                onBuy={() => handlePurchase(product.id)}
                isLoading={isProcessing}
                value={product.value}
                icon={product.icon}
              />
            ))}
        </div>
      </div>

      {/* Project Selection Dialog for Entrepreneurs */}
      <ProjectSelectionDialog
        isOpen={showProjectSelection}
        onClose={() => setShowProjectSelection(false)}
        onSelectProject={handleProjectSelection}
        projects={entrepreneurData?.projects ?? []}
        isLoading={isEntrepreneurDataPending}
      />
    </main>
  );
}
