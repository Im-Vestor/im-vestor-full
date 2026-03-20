import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  FileText,
  DollarSign,
  Receipt,
  CheckSquare,
  Upload,
  Download,
  Loader2,
  Clock,
} from 'lucide-react';
import { PaymentStatus } from '@prisma/client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { cn } from '~/lib/utils';

interface ClosingWorkflowProps {
  negotiationId: string;
  userType: string;
  onUpdate?: () => void;
}

export function ClosingWorkflow({ negotiationId, userType, onUpdate }: ClosingWorkflowProps) {
  const utils = api.useUtils();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEntrepreneur = userType === 'ENTREPRENEUR' || userType === 'INCUBATOR';
  const isInvestor = userType === 'INVESTOR' || userType === 'VC_GROUP';

  // Fetch negotiation data
  const { data: negotiation } = api.negotiation.getById.useQuery(
    { negotiationId },
    { enabled: !!negotiationId }
  );

  // Phase 1: Investment Amount
  const proposeMutation = api.negotiation.proposeInvestmentAmount.useMutation({
    onSuccess: () => {
      toast.success('Investment amount proposed successfully');
      setInvestmentAmount('');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const acceptMutation = api.negotiation.acceptInvestmentAmount.useMutation({
    onSuccess: () => {
      toast.success('Investment amount accepted');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const rejectMutation = api.negotiation.rejectInvestmentAmount.useMutation({
    onSuccess: () => {
      toast.success('Investment amount rejected');
      setRejectReason('');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.negotiation.updateInvestmentAmount.useMutation({
    onSuccess: () => {
      toast.success('Investment amount updated');
      setInvestmentAmount('');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Phase 2: Contract Upload
  const uploadInvestorContractMutation = api.negotiation.uploadInvestorContract.useMutation({
    onSuccess: () => {
      toast.success('Investor contract uploaded successfully');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const uploadEntrepreneurContractMutation = api.negotiation.uploadEntrepreneurContract.useMutation(
    {
      onSuccess: () => {
        toast.success('Counter-signature uploaded successfully');
        void utils.negotiation.getById.invalidate({ negotiationId });
        onUpdate?.();
      },
      onError: error => {
        toast.error(error.message);
      },
    }
  );

  // Phase 3: Completion Confirmation
  const confirmCompletionMutation = api.negotiation.confirmCompletion.useMutation({
    onSuccess: () => {
      toast.success('Marked as completed');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const revertCompletionMutation = api.negotiation.revertCompletion.useMutation({
    onSuccess: () => {
      toast.success('Completion confirmation reverted');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  // Phase 4: Payment - Fetch payment URL when both parties have confirmed
  const { data: paymentData } = api.negotiation.getPaymentCheckoutUrl.useQuery(
    { negotiationId },
    { enabled: false } // Will be enabled when we detect both confirmations
  );

  // Phase 6: Final Confirmation
  const confirmFundsMutation = api.negotiation.confirmFundsReceived.useMutation({
    onSuccess: () => {
      toast.success('Funds confirmed! Deal closed successfully.');
      void utils.negotiation.getById.invalidate({ negotiationId });
      onUpdate?.();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleProposeAmount = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }
    proposeMutation.mutate({ negotiationId, amount });
  };

  const handleUpdateAmount = () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }
    updateMutation.mutate({ negotiationId, newAmount: amount });
  };

  const handleAcceptAmount = () => {
    acceptMutation.mutate({ negotiationId });
  };

  const handleRejectAmount = () => {
    rejectMutation.mutate({ negotiationId, reason: rejectReason || undefined });
  };

  const handleConfirmCompletion = () => {
    confirmCompletionMutation.mutate({ negotiationId });
  };

  const handleRevertCompletion = () => {
    revertCompletionMutation.mutate({ negotiationId });
  };

  const handleConfirmFunds = () => {
    confirmFundsMutation.mutate({ negotiationId });
  };

  const handleContractUpload = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploadingContract(true);

    try {
      // Determine contract type based on user role
      const contractType = isInvestor ? 'investor' : 'entrepreneur';

      // Upload to R2 via API route
      const uploadRes = await fetch('/api/upload-contract', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
          'X-Negotiation-Id': negotiationId,
          'X-Contract-Type': contractType,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.text();
        throw new Error(error || 'Upload failed');
      }

      const { url } = (await uploadRes.json()) as { url: string };

      // Save to database via tRPC
      if (isInvestor) {
        await uploadInvestorContractMutation.mutateAsync({
          negotiationId,
          fileName: file.name,
          fileUrl: url,
        });
      } else {
        await uploadEntrepreneurContractMutation.mutateAsync({
          negotiationId,
          fileName: file.name,
          fileUrl: url,
        });
      }

      toast.success('Contract uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload contract');
    } finally {
      setIsUploadingContract(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleContractUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleContractUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  if (!negotiation) {
    return null;
  }

  const { negotiation: neg } = negotiation;

  // Phase statuses
  const hasProposedAmount = !!neg.agreedInvestmentAmount && !!neg.investmentAmountProposedAt;
  const amountAccepted = !!neg.investmentAmountAcceptedAt;
  const hasInvestorContract = !!neg.investorContractUrl;
  const hasEntrepreneurContract = !!neg.entrepreneurContractUrl;
  const entrepreneurConfirmed = !!neg.entrepreneurCompletionConfirmedAt;
  const investorConfirmed = !!neg.investorCompletionConfirmedAt;
  const bothConfirmed = entrepreneurConfirmed && investorConfirmed;
  const paymentComplete = neg.paymentStatus === PaymentStatus.PAYMENT_RECEIVED;
  const receiptUploaded = !!neg.receiptUrl;
  const fundsConfirmed = !!neg.fundsConfirmedAt;

  return (
    <div className="space-y-6">
      {/* Phase 1: Investment Amount */}
      <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-full p-2',
                amountAccepted
                  ? 'bg-green-500/20'
                  : hasProposedAmount
                    ? 'bg-yellow-500/20'
                    : 'bg-white/10'
              )}
            >
              <DollarSign
                className={cn(
                  'size-5',
                  amountAccepted
                    ? 'text-green-400'
                    : hasProposedAmount
                      ? 'text-yellow-400'
                      : 'text-white/40'
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold text-[#EFD687]">Investment Amount</h3>
              <p className="text-xs text-white/50">Agree on the investment amount</p>
            </div>
          </div>
          {amountAccepted ? (
            <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Accepted</Badge>
          ) : hasProposedAmount ? (
            <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">Pending</Badge>
          ) : (
            <Badge className="border-white/20 bg-white/10 text-white/50">Not Started</Badge>
          )}
        </div>

        {amountAccepted ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-green-400">
                  Agreed Investment
                </p>
                <p className="mt-2 text-3xl font-bold text-[#EFD687]">
                  ${Number(neg.agreedInvestmentAmount ?? 0).toLocaleString('en-US')}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Accepted on{' '}
                  {neg.investmentAmountAcceptedAt
                    ? new Date(neg.investmentAmountAcceptedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''}
                </p>
              </div>
              <CheckCircle2 className="size-12 text-green-400" />
            </div>
          </div>
        ) : hasProposedAmount ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-yellow-400">
                    Proposed Investment
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#EFD687]">
                    ${Number(neg.agreedInvestmentAmount ?? 0).toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Proposed on{' '}
                    {neg.investmentAmountProposedAt
                      ? new Date(neg.investmentAmountProposedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
                <Clock className="size-10 text-yellow-400" />
              </div>
            </div>

            {isEntrepreneur ? (
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  The investor has proposed this investment amount. You can accept or reject it.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAcceptAmount}
                    disabled={acceptMutation.isPending}
                    className="flex-1 bg-[#EDD689] text-background hover:bg-[#D3B662]"
                  >
                    {acceptMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Accept Amount
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 border-red-400/50 text-red-400 hover:bg-red-400/10 hover:text-red-300"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Waiting for entrepreneur to accept your proposal. You can update the amount if
                  needed.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="update-amount" className="text-sm text-white/70">
                    Update Investment Amount (USD)
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                        $
                      </span>
                      <Input
                        id="update-amount"
                        type="number"
                        placeholder="0.00"
                        value={investmentAmount}
                        onChange={e => setInvestmentAmount(e.target.value)}
                        className="bg-white/5 pl-7"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateAmount}
                      disabled={updateMutation.isPending || !investmentAmount}
                      variant="outline"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          isInvestor && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-6">
                <p className="text-sm text-white/70">
                  Start the closing process by proposing an investment amount. This will be sent to
                  the entrepreneur for approval.
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="propose-amount" className="text-sm font-medium text-white/70">
                  Investment Amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/50">
                    $
                  </span>
                  <Input
                    id="propose-amount"
                    type="number"
                    placeholder="Enter amount (e.g., 100000)"
                    value={investmentAmount}
                    onChange={e => setInvestmentAmount(e.target.value)}
                    className="bg-white/5 pl-9 text-lg"
                    min="0"
                    step="1000"
                  />
                </div>
                <Button
                  onClick={handleProposeAmount}
                  disabled={proposeMutation.isPending || !investmentAmount}
                  className="w-full"
                  size="lg"
                >
                  {proposeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Proposing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 size-4" />
                      Propose Investment Amount
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        )}

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Investment Amount</DialogTitle>
              <DialogDescription>
                You&apos;re about to reject the proposed investment of $
                {Number(neg.agreedInvestmentAmount ?? 0).toLocaleString('en-US')}. You can
                optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-sm">
                Reason (Optional)
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., I was expecting a higher valuation..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="bg-white/5"
                rows={4}
              />
            </div>
            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleRejectAmount();
                  setShowRejectDialog(false);
                }}
                disabled={rejectMutation.isPending}
                className="bg-red-500/90 text-white hover:bg-red-600"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Amount'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase 2: Contract Upload */}
      {amountAccepted && (
        <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-2',
                  hasInvestorContract && hasEntrepreneurContract ? 'bg-green-500/20' : 'bg-white/10'
                )}
              >
                <FileText
                  className={cn(
                    'size-5',
                    hasInvestorContract && hasEntrepreneurContract
                      ? 'text-green-400'
                      : 'text-white/40'
                  )}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#EFD687]">Contract Exchange</h3>
                <p className="text-xs text-white/50">Upload pre-signed PDF contracts</p>
              </div>
            </div>
            {hasInvestorContract && hasEntrepreneurContract ? (
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Complete</Badge>
            ) : hasInvestorContract ? (
              <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
                Awaiting Counter-Signature
              </Badge>
            ) : (
              <Badge className="border-white/20 bg-white/10 text-white/50">Pending</Badge>
            )}
          </div>

          <div className="space-y-3">
            {/* Investor Contract */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasInvestorContract ? (
                    <CheckCircle2 className="size-4 text-green-400" />
                  ) : (
                    <Circle className="size-4 text-white/30" />
                  )}
                  <span className="text-sm font-medium text-white/70">Investor Contract</span>
                </div>
                {hasInvestorContract && neg.investorContractUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-white/10"
                    onClick={() => window.open(neg.investorContractUrl ?? '', '_blank')}
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                )}
              </div>

              {!hasInvestorContract && isInvestor && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploadingContract}
                  />
                  <button
                    type="button"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all',
                      isDragging
                        ? 'border-[#EFD687]/60 bg-[#EFD687]/5'
                        : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    )}
                  >
                    {isUploadingContract ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-8 animate-spin text-[#EFD687]" />
                        <p className="text-sm text-white/60">Uploading contract...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="size-8 text-white/40" />
                        <p className="text-sm text-white/70">
                          Drop your PDF here or{' '}
                          <span className="text-[#EFD687]">click to browse</span>
                        </p>
                        <p className="text-xs text-white/40">PDF only, max 50MB</p>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {hasInvestorContract && (
                <div className="rounded-lg bg-green-500/10 p-3">
                  <p className="text-sm text-green-400">Contract uploaded successfully</p>
                  <p className="text-xs text-white/40">
                    {neg.investorContractUploadedAt
                      ? new Date(neg.investorContractUploadedAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Entrepreneur Counter-Signature */}
            {hasInvestorContract && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasEntrepreneurContract ? (
                      <CheckCircle2 className="size-4 text-green-400" />
                    ) : (
                      <Circle className="size-4 text-white/30" />
                    )}
                    <span className="text-sm font-medium text-white/70">
                      Entrepreneur Counter-Signature
                    </span>
                  </div>
                  {hasEntrepreneurContract && neg.entrepreneurContractUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-white/10"
                      onClick={() => window.open(neg.entrepreneurContractUrl ?? '', '_blank')}
                    >
                      <Download className="size-3.5" />
                      Download
                    </Button>
                  )}
                </div>

                {!hasEntrepreneurContract && isEntrepreneur && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploadingContract}
                    />
                    <button
                      type="button"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all',
                        isDragging
                          ? 'border-[#EFD687]/60 bg-[#EFD687]/5'
                          : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      )}
                    >
                      {isUploadingContract ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="size-8 animate-spin text-[#EFD687]" />
                          <p className="text-sm text-white/60">Uploading counter-signature...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="size-8 text-white/40" />
                          <p className="text-sm text-white/70">
                            Drop your signed PDF here or{' '}
                            <span className="text-[#EFD687]">click to browse</span>
                          </p>
                          <p className="text-xs text-white/40">PDF only, max 50MB</p>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {hasEntrepreneurContract && (
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <p className="text-sm text-green-400">
                      Counter-signature uploaded successfully
                    </p>
                    <p className="text-xs text-white/40">
                      {neg.entrepreneurContractUploadedAt
                        ? new Date(neg.entrepreneurContractUploadedAt).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                )}

                {!hasEntrepreneurContract && !isEntrepreneur && (
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-sm text-white/50">
                      Waiting for entrepreneur to upload counter-signature...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 3: Completion Confirmation */}
      {hasInvestorContract && hasEntrepreneurContract && (
        <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-2',
                  bothConfirmed ? 'bg-green-500/20' : 'bg-white/10'
                )}
              >
                <CheckSquare
                  className={cn('size-5', bothConfirmed ? 'text-green-400' : 'text-white/40')}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#EFD687]">Completion Confirmation</h3>
                <p className="text-xs text-white/50">
                  Both parties confirm negotiation is complete
                </p>
              </div>
            </div>
            {bothConfirmed ? (
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                Both Confirmed
              </Badge>
            ) : entrepreneurConfirmed || investorConfirmed ? (
              <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
                Waiting for Other Party
              </Badge>
            ) : (
              <Badge className="border-white/20 bg-white/10 text-white/50">Pending</Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
                {entrepreneurConfirmed ? (
                  <CheckCircle2 className="size-4 text-green-400" />
                ) : (
                  <Circle className="size-4 text-white/30" />
                )}
                <span className="text-sm text-white/70">Entrepreneur Confirmed</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
                {investorConfirmed ? (
                  <CheckCircle2 className="size-4 text-green-400" />
                ) : (
                  <Circle className="size-4 text-white/30" />
                )}
                <span className="text-sm text-white/70">Investor Confirmed</span>
              </div>
            </div>

            {isEntrepreneur && !entrepreneurConfirmed && (
              <Button
                onClick={handleConfirmCompletion}
                disabled={confirmCompletionMutation.isPending}
                className="w-full"
              >
                Mark as Completed
              </Button>
            )}

            {isInvestor && !investorConfirmed && (
              <Button
                onClick={handleConfirmCompletion}
                disabled={confirmCompletionMutation.isPending}
                className="w-full"
              >
                Mark as Completed
              </Button>
            )}

            {((isEntrepreneur && entrepreneurConfirmed) || (isInvestor && investorConfirmed)) &&
              !bothConfirmed && (
                <Button
                  variant="outline"
                  onClick={handleRevertCompletion}
                  disabled={revertCompletionMutation.isPending}
                  className="w-full"
                >
                  Revert My Confirmation
                </Button>
              )}
          </div>
        </div>
      )}

      {/* Phase 4: Payment */}
      {bothConfirmed && (
        <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-2',
                  paymentComplete ? 'bg-green-500/20' : 'bg-white/10'
                )}
              >
                <DollarSign
                  className={cn('size-5', paymentComplete ? 'text-green-400' : 'text-white/40')}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#EFD687]">Escrow Payment</h3>
                <p className="text-xs text-white/50">Investor pays into escrow</p>
              </div>
            </div>
            {paymentComplete ? (
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Paid</Badge>
            ) : (
              <Badge className="border-white/20 bg-white/10 text-white/50">Pending</Badge>
            )}
          </div>

          {paymentComplete ? (
            <div className="rounded-lg bg-green-500/10 p-4">
              <p className="text-sm text-green-400">Payment completed successfully</p>
              <p className="mt-1 text-xs text-white/40">
                Paid {neg.paidAt ? new Date(neg.paidAt).toLocaleDateString() : ''}
              </p>
            </div>
          ) : isInvestor && paymentData?.url ? (
            <Button
              onClick={() => {
                window.location.href = paymentData.url;
              }}
              className="w-full"
            >
              Proceed to Payment
            </Button>
          ) : (
            <p className="text-sm text-white/50">Waiting for payment processing...</p>
          )}
        </div>
      )}

      {/* Phase 5: Receipt Upload - Admin only */}
      {paymentComplete && (
        <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-2',
                  receiptUploaded ? 'bg-green-500/20' : 'bg-white/10'
                )}
              >
                <Receipt
                  className={cn('size-5', receiptUploaded ? 'text-green-400' : 'text-white/40')}
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#EFD687]">Transfer Receipt</h3>
                <p className="text-xs text-white/50">Admin uploads transfer receipt</p>
              </div>
            </div>
            {receiptUploaded ? (
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">Uploaded</Badge>
            ) : (
              <Badge className="border-white/20 bg-white/10 text-white/50">Pending</Badge>
            )}
          </div>

          {receiptUploaded ? (
            <div className="rounded-lg bg-green-500/10 p-4">
              <p className="text-sm text-green-400">Receipt uploaded by admin</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(neg.receiptUrl ?? '', '_blank')}
              >
                View Receipt
              </Button>
            </div>
          ) : (
            <p className="text-sm text-white/50 italic">
              Awaiting admin to upload transfer receipt...
            </p>
          )}
        </div>
      )}

      {/* Phase 6: Final Confirmation */}
      {receiptUploaded && !fundsConfirmed && isEntrepreneur && (
        <div className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-2">
                <CheckCircle2 className="size-5 text-white/40" />
              </div>
              <div>
                <h3 className="font-semibold text-[#EFD687]">Confirm Funds Received</h3>
                <p className="text-xs text-white/50">Confirm you received the investment</p>
              </div>
            </div>
            <Badge className="border-white/20 bg-white/10 text-white/50">Action Required</Badge>
          </div>

          <Button
            onClick={handleConfirmFunds}
            disabled={confirmFundsMutation.isPending}
            className="w-full"
          >
            Confirm Funds Received & Close Deal
          </Button>
        </div>
      )}

      {fundsConfirmed && (
        <div className="rounded-xl border-2 border-green-500/30 bg-green-500/10 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-green-400" />
            <div>
              <h3 className="font-semibold text-green-400">Deal Closed Successfully!</h3>
              <p className="text-sm text-white/70">
                All parties have confirmed. The negotiation is now complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
