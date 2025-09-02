import { zodResolver } from '@hookform/resolvers/zod';
import { type VcGroupMember } from '@prisma/client';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { PhoneInput } from '~/components/ui/phone-input';
import { api } from '~/utils/api';
import { sendImageToBackend } from '~/utils/file';

const memberFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  photo: z.string().optional(),
  role: z.string().min(2, 'Role must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  owner: z.boolean().optional(),
});

interface MemberFormProps {
  member?: VcGroupMember;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MemberForm = ({ member, onSuccess, onCancel }: MemberFormProps) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photo, setPhoto] = useState<string | null>(member?.photo ?? null);

  const { mutate: createMember, isPending: isCreatingMember } =
    api.vcGroup.createMember.useMutation({
      onSuccess: () => {
        toast.success('Member created successfully!');
        onSuccess();
      },
      onError: error => {
        toast.error(error.message || 'Failed to create member. Please try again.');
      },
    });

  const { mutate: updateMember, isPending: isUpdatingMember } =
    api.vcGroup.updateMember.useMutation({
      onSuccess: () => {
        toast.success('Member updated successfully!');
        onSuccess();
      },
      onError: error => {
        toast.error(error.message || 'Failed to update member. Please try again.');
      },
    });

  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: member?.name ?? '',
      photo: member?.photo ?? '',
      role: member?.role ?? '',
      email: member?.email ?? '',
      phone: member?.phone ?? '',
      owner: member?.owner ?? false,
    },
  });

  const isLoading = isCreatingMember || isUpdatingMember;

  const onSubmit = (data: z.infer<typeof memberFormSchema>) => {
    const finalData = {
      ...data,
      photo: photo ?? data.photo,
    };

    if (member) {
      updateMember({
        id: member.id,
        ...finalData,
      });
    } else {
      createMember(finalData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Photo Upload */}
        <div className="flex justify-center">
          {renderMemberPhotoUpload(
            `member-${member?.id ?? 'new'}`,
            member?.photo ?? null,
            photo,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photoUrl: string) => {
              setPhoto(photoUrl);
              form.setValue('photo', photoUrl);
            }
          )}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label className="font-normal text-neutral-200">Name*</Label>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <Label className="font-normal text-neutral-200">Role*</Label>
              <FormControl>
                <Input placeholder="Managing Partner" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label className="font-normal text-neutral-200">Email*</Label>
              <FormControl>
                <Input placeholder="john@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <Label className="font-normal text-neutral-200">Phone</Label>
              <FormControl>
                <PhoneInput {...field} placeholder="999 999 999" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                  <Label className="font-normal text-neutral-200">Owner</Label>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : member ? 'Update Member' : 'Create Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const renderMemberPhotoUpload = (
  userId: string,
  currentPhoto: string | null,
  photoUploaded: string | null,
  isUploadingPhoto: boolean,
  setIsUploadingPhoto: (isUploading: boolean) => void,
  setPhoto: (photo: string) => void
) => {
  return (
    <div className="relative">
      <label htmlFor={`photo-upload-${userId}`}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] hover:cursor-pointer hover:opacity-75">
          {(photoUploaded ?? currentPhoto) ? (
            <Image
              src={photoUploaded ?? currentPhoto ?? ''}
              alt="Profile"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Plus className="h-8 w-8 text-black" />
          )}
        </div>

        <input
          id={`photo-upload-${userId}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingPhoto(true);

            try {
              const imageUrl = await sendImageToBackend(file, userId);
              setPhoto(imageUrl ?? '');
            } catch (error) {
              toast.error('Failed to upload photo. Please try again.');
              console.error('Photo upload error:', error);
            } finally {
              setIsUploadingPhoto(false);
            }
          }}
          disabled={isUploadingPhoto}
        />
      </label>
    </div>
  );
};
