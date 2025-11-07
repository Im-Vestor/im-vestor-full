import { useState } from 'react';
import AdminLayout from '../index';
import { api, type RouterInputs, type RouterOutputs } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Gift, User, Package, Users, CheckCircle, XCircle, Handshake, Zap, UserCircle, Train, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '~/hooks/use-debounce';

// Type definitions
type UserForGifting = RouterOutputs['admin']['getUsersForGifting'][number];
type BulkGiftResult = RouterOutputs['admin']['giftProductToUsersByEmail'];
type ProductType = RouterInputs['admin']['giftProductToUser']['productType'];

const products = [
  {
    id: 'poke',
    name: '3 Pokes',
    description: 'Sends a personalized introduction note to other users about your profile.',
    value: 25,
    availableUserTypes: ['ENTREPRENEUR', 'INVESTOR', 'INCUBATOR', 'VC_GROUP'],
  },
  {
    id: 'boost',
    name: 'Boost',
    description: 'Places your project at the top of business sector searches.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
  },
  {
    id: 'pitch-of-the-week-ticket',
    name: 'Pitch of the Week Ticket',
    description: 'Gain access to 2 public pitches.',
    value: 20,
    availableUserTypes: ['ENTREPRENEUR'],
  },
  {
    id: 'hyper-train-ticket',
    name: 'Hyper Train Ticket',
    description: 'Get featured in the Hyper Train feed to increase visibility and connect with potential partners, investors, or entrepreneurs.',
    value: 35,
    availableUserTypes: ['ENTREPRENEUR', 'INVESTOR', 'VC_GROUP'],
  },
];

// Helper function to clamp number between min and max
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

function GiftProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserForGifting | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);

  // Bulk gift states
  const [emailList, setEmailList] = useState('');
  const [bulkProductType, setBulkProductType] = useState<ProductType | ''>('');
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkGiftResult | null>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Fetch users for gifting with debounced search
  const { data: users, isLoading: isLoadingUsers, refetch: refetchUsers } = api.admin.getUsersForGifting.useQuery(
    {
      search: debouncedSearchTerm || undefined,
      userType: selectedUserType && selectedUserType !== 'all' ? selectedUserType : undefined,
    },
    {
      staleTime: 30000, // 30 seconds - data stays fresh for 30s
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component remount if data is fresh
      placeholderData: (previousData) => previousData, // Keep previous data while loading to avoid flicker
    }
  );

  // Gift product mutation
  const giftProductMutation = api.admin.giftProductToUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsGiftDialogOpen(false);
      setSelectedUser(null);
      setSelectedProduct('');
      setQuantity(1);
      setReason('');
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });


  // Bulk gift product mutation
  const bulkGiftProductMutation = api.admin.giftProductToUsersByEmail.useMutation({
    onSuccess: (data) => {
      setBulkResults(data);
      setIsResultsDialogOpen(true);

      if (data.success) {
        toast.success(`Successfully gifted to ${data.summary.successful} users`);
        if (data.summary.failed > 0) {
          toast.warning(`${data.summary.failed} gifts failed. Check the details.`);
        }
      } else {
        toast.error('No gifts were successful');
      }

      setEmailList('');
      setBulkProductType('');
      setBulkQuantity(1);
      setBulkReason('');
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGiftProduct = () => {
    if (!selectedUser || !selectedProduct) {
      toast.error('Please select a user and product');
      return;
    }

    giftProductMutation.mutate({
      userId: selectedUser.id,
      productType: selectedProduct,
      quantity,
      reason: reason || undefined,
    });
  };

  const handleBulkGiftProduct = () => {
    if (!emailList.trim() || !bulkProductType) {
      toast.error('Please provide email list and select a product');
      return;
    }

    // Parse email list (split by comma, semicolon, or newline)
    const emails = emailList
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      toast.error('Please provide at least one valid email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    bulkGiftProductMutation.mutate({
      emails,
      productType: bulkProductType,
      quantity: bulkQuantity,
      reason: bulkReason || undefined,
    });
  };

  const getAvailableProducts = (userType: string) => {
    // Filter products based on user type
    // Note: Hyper Train is only available for INVESTOR and VC_GROUP (as per backend validation)
    return products.filter(product => {
      return product.availableUserTypes.includes(userType);
    });
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      ENTREPRENEUR: 'bg-blue-100 text-blue-800',
      INVESTOR: 'bg-green-100 text-green-800',
      INCUBATOR: 'bg-purple-100 text-purple-800',
      VC_GROUP: 'bg-orange-100 text-orange-800',
      PARTNER: 'bg-gray-100 text-gray-800',
    };
    return colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Gift Products</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Give products from the shop to users</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg w-fit">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
            <span className="text-xs sm:text-sm font-medium">Admin Gift System</span>
          </div>
        </div>
      </div>

      {/* Bulk Gift Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Bulk Gift Products
          </CardTitle>
          <CardDescription className="text-sm">Gift products to multiple users by providing their email addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailList" className="text-sm font-medium">Email List</Label>
              <textarea
                id="emailList"
                placeholder="Enter email addresses separated by commas, semicolons, or new lines&#10;Example: user1@example.com, user2@example.com&#10;user3@example.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="w-full min-h-[80px] sm:min-h-[100px] p-3 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas, semicolons, or new lines
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulkProduct" className="text-sm font-medium">Product</Label>
                <Select value={bulkProductType} onValueChange={(value) => setBulkProductType(value as ProductType | '')}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ${product.value} • Available for: {product.availableUserTypes.join(', ')}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkQuantity" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="bulkQuantity"
                  type="number"
                  min="1"
                  max="10"
                  value={bulkQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setBulkQuantity(clamp(value, 1, 10));
                  }}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkReason" className="text-sm font-medium">Reason (optional)</Label>
              <Input
                id="bulkReason"
                placeholder="Why are you gifting this product?"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleBulkGiftProduct}
                disabled={!emailList.trim() || !bulkProductType || bulkGiftProductMutation.isPending}
                className="w-full sm:w-auto h-10"
              >
                {bulkGiftProductMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Gift to Email List
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Search Users
          </CardTitle>
          <CardDescription className="text-sm">Find users to gift products to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search by name or email</Label>
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType" className="text-sm font-medium">Filter by user type</Label>
              <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="All user types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All user types</SelectItem>
                  <SelectItem value="ENTREPRENEUR">Entrepreneur</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                  <SelectItem value="INCUBATOR">Incubator</SelectItem>
                  <SelectItem value="VC_GROUP">VC Group</SelectItem>
                  <SelectItem value="PARTNER">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl || ''} alt={user.name || 'User avatar'} />
                      <AvatarFallback className="text-sm font-medium">
                        <UserCircle className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-row items-center justify-between w-full">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="font-medium text-sm sm:text-base break-words">{user.name || 'N/A'}</h3>
                          <Badge className={`${getUserTypeColor(user.userType)} text-xs shrink-0 w-fit`}>
                            {user.userType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                          <p className="text-xs sm:text-sm text-muted-foreground break-all">{user.email}</p>
                          {user.availablePokes > 0 ? (
                            <span className="flex items-center gap-1">
                              <Handshake className="h-3 w-3" />
                              <span>Pokes: {user.availablePokes}</span>
                            </span>
                          ) : null}
                          {user.availableBoosts > 0 ? (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>Boosts: {user.availableBoosts}</span>
                            </span>
                          ) : null}
                          {user.availablePitches > 0 ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Pitches: {user.availablePitches}</span>
                            </span>
                          ) : null}
                          {user.availableHyperTrainTickets > 0 ? (
                            <span className="flex items-center gap-1">
                              <Train className="h-3 w-3" />
                              <span>Hyper Train Tickets: {user.availableHyperTrainTickets}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit h-8"
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedProduct('');
                          setQuantity(1);
                          setReason('');
                          setIsGiftDialogOpen(true);
                        }}
                      >
                        <Gift className="h-3 w-3 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Gift Product</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Gift Dialog - Moved outside loop */}
      <Dialog open={isGiftDialogOpen} onOpenChange={(open) => {
          setIsGiftDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            setSelectedProduct('');
            setQuantity(1);
            setReason('');
          }
      }}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Gift Product to {selectedUser?.name || selectedUser?.email || 'User'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Select a product to gift to this user. The product will be added to their account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium">Product</Label>
                <Select value={selectedProduct} onValueChange={(value) => setSelectedProduct(value as ProductType)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableProducts(selectedUser.userType).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ${product.value} • {product.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setQuantity(clamp(value, 1, 10));
                  }}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Why are you gifting this product?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsGiftDialogOpen(false)}
              className="w-full sm:w-auto h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGiftProduct}
              disabled={!selectedUser || !selectedProduct || giftProductMutation.isPending}
              className="w-full sm:w-auto h-10"
            >
              {giftProductMutation.isPending ? 'Gifting...' : 'Gift Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Gift Results Dialog */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
              Bulk Gift Results
            </DialogTitle>
            <DialogDescription className="text-sm">
              {bulkResults?.summary.successful} successful, {bulkResults?.summary.failed} failed
            </DialogDescription>
          </DialogHeader>

          {bulkResults && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Failed Results First */}
              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <>
                  {bulkResults.errors.map((error, index: number) => (
                    <div key={`error-${index}`} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-800 truncate text-sm sm:text-base">{error.email}</div>
                        <div className="text-xs sm:text-sm text-red-600 mt-1">{error.error}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Successful Results */}
              {bulkResults.results && bulkResults.results.length > 0 && (
                <>
                  {bulkResults.results.map((result, index: number) => (
                    <div key={`success-${index}`} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-green-800 truncate text-sm sm:text-base">{result.email}</div>
                        <div className="text-xs sm:text-sm text-green-600 mt-1">
                          Pokes: {result.user.availablePokes} • Boosts: {result.user.availableBoosts}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsResultsDialogOpen(false)} className="w-full sm:w-auto h-10">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GiftProductsPageWithLayout() {
  return (
    <AdminLayout>
      <GiftProductsPage />
    </AdminLayout>
  );
}