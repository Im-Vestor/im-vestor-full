import { type VcGroupMember } from '@prisma/client';
import { ArrowLeft, Edit, Loader2, Plus, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { MemberForm } from '~/pages/vc-group/member-form';
import { api } from '~/utils/api';

export default function VcGroupMembers() {
  const router = useRouter();
  const utils = api.useUtils();
  const [editingMember, setEditingMember] = useState<VcGroupMember | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<VcGroupMember | null>(null);

  const { data: members, isLoading: isLoadingMembers } = api.vcGroup.getMembers.useQuery();
  const { data: vcGroup } = api.vcGroup.getByUserId.useQuery();

  const { mutate: deleteMember, isPending: isDeletingMember } =
    api.vcGroup.deleteMember.useMutation({
      onSuccess: () => {
        toast.success('Member deleted successfully!');
        void utils.vcGroup.getMembers.invalidate();
        setMemberToDelete(null);
      },
      onError: error => {
        toast.error(error.message || 'Failed to delete member. Please try again.');
        setMemberToDelete(null);
      },
    });

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      deleteMember({ id: memberToDelete.id });
    }
  };

  const handleEditSuccess = () => {
    setEditingMember(null);
    void utils.vcGroup.getMembers.invalidate();
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    void utils.vcGroup.getMembers.invalidate();
  };

  if (isLoadingMembers || !members) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
        <Header />
        <div className="mt-16 flex items-center justify-center sm:mt-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <button
              type="button"
              className="flex items-center gap-2 hover:opacity-75"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="text-2xl font-bold text-white">{vcGroup?.name} - Members</h1>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Members Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members?.map(member => (
            <Card key={member.id} className="bg-card border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                      {member.photo ? (
                        <Image src={member.photo} alt={member.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-300">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {member.name}
                        {member.owner && (
                          <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                            Owner
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-400">{member.role}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium">Email:</span> {member.email}
                  </p>
                  {member.phone && (
                    <p className="text-gray-300">
                      <span className="font-medium">Phone:</span> {member.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMember(member)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setMemberToDelete(member)}
                    disabled={isDeletingMember || members.length === 1}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(members?.length ?? 0) === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No members yet</h3>
            <p className="text-gray-400 mb-4">
              Start by adding your first team member to your VC group.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Member
            </Button>
          </div>
        )}
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={open => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberForm
              member={editingMember}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <MemberForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={open => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.
              {memberToDelete?.owner && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This member is marked as an owner.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingMember ? 'Deleting...' : 'Delete Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
