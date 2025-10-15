import { useState } from 'react';
import AdminLayout from '../index';
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Gift, User, Package, Users, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
    description: 'Gain access to 2 public weekly pitches.',
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

function GiftProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);

  // Bulk gift states
  const [emailList, setEmailList] = useState('');
  const [bulkProductType, setBulkProductType] = useState<string>('');
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Fetch users for gifting
  const { data: users, isLoading: isLoadingUsers, refetch: refetchUsers } = api.admin.getUsersForGifting.useQuery({
    search: searchTerm || undefined,
    userType: selectedUserType && selectedUserType !== 'all' ? selectedUserType : undefined,
  });

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
      productType: selectedProduct as any,
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
      productType: bulkProductType as any,
      quantity: bulkQuantity,
      reason: bulkReason || undefined,
    });
  };

  const getAvailableProducts = (userType: string) => {
    return products.filter(product => product.availableUserTypes.includes(userType));
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gift Products</h1>
          <p className="text-muted-foreground">Give products from the shop to users</p>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" />
          <span className="text-sm font-medium">Admin Gift System</span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>Find users to gift products to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search by name or email</Label>
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType">Filter by user type</Label>
              <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                <SelectTrigger className="w-full">
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

      {/* Bulk Gift Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Gift Products
          </CardTitle>
          <CardDescription>Gift products to multiple users by providing their email addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailList">Email List</Label>
              <textarea
                id="emailList"
                placeholder="Enter email addresses separated by commas, semicolons, or new lines&#10;Example: user1@example.com, user2@example.com&#10;user3@example.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas, semicolons, or new lines
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulkProduct">Product</Label>
                <Select value={bulkProductType} onValueChange={setBulkProductType}>
                  <SelectTrigger>
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
                <Label htmlFor="bulkQuantity">Quantity</Label>
                <Input
                  id="bulkQuantity"
                  type="number"
                  min="1"
                  max="10"
                  value={bulkQuantity}
                  onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkReason">Reason (optional)</Label>
              <Input
                id="bulkReason"
                placeholder="Why are you gifting this product?"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleBulkGiftProduct}
                disabled={!emailList.trim() || !bulkProductType || bulkGiftProductMutation.isPending}
                className="w-full sm:w-auto"
              >
                {bulkGiftProductMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Gift to All Users
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between p-3 sm:p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 sm:w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 sm:w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-full sm:w-24"></div>
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
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={user.imageUrl || undefined} alt={user.name} />
                      <AvatarFallback className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h3 className="font-medium truncate">{user.name}</h3>
                        <Badge className={`${getUserTypeColor(user.userType)} text-xs shrink-0`}>
                          {user.userType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mt-1">
                        <span>Pokes: {user.availablePokes}</span>
                        <span>Boosts: {user.availableBoosts}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Dialog open={isGiftDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsGiftDialogOpen(open);
                      if (open) {
                        setSelectedUser(user);
                      } else {
                        setSelectedUser(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Gift className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Gift Product</span>
                          <span className="sm:hidden">Gift</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gift Product to {user.name}</DialogTitle>
                          <DialogDescription>
                            Select a product to gift to this user. The product will be added to their account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="product">Product</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts(user.userType).map((product) => (
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
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max="10"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Input
                              id="reason"
                              placeholder="Why are you gifting this product?"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsGiftDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleGiftProduct}
                            disabled={!selectedProduct || giftProductMutation.isPending}
                          >
                            {giftProductMutation.isPending ? 'Gifting...' : 'Gift Product'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Gift Results Dialog */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Bulk Gift Results
            </DialogTitle>
            <DialogDescription>
              {bulkResults?.summary.successful} successful, {bulkResults?.summary.failed} failed
            </DialogDescription>
          </DialogHeader>

          {bulkResults && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Failed Results First */}
              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <>
                  {bulkResults.errors.map((error: any, index: number) => (
                    <div key={`error-${index}`} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-800 truncate">{error.email}</div>
                        <div className="text-sm text-red-600">{error.error}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Successful Results */}
              {bulkResults.results && bulkResults.results.length > 0 && (
                <>
                  {bulkResults.results.map((result: any, index: number) => (
                    <div key={`success-${index}`} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-green-800 truncate">{result.email}</div>
                        <div className="text-sm text-green-600">
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
            <Button onClick={() => setIsResultsDialogOpen(false)}>
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