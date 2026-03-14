export type UserWithProfile = {
  id: string;
  imageUrl?: string | null;
  userType: string;
  entrepreneur?: { firstName: string; lastName: string } | null;
  investor?: { firstName: string; lastName: string } | null;
  incubator?: { name: string } | null;
  partner?: { firstName: string; lastName: string } | null;
  vcGroup?: { name: string } | null;
};

export function getDisplayName(user: UserWithProfile): string {
  if (user.entrepreneur) return `${user.entrepreneur.firstName} ${user.entrepreneur.lastName}`;
  if (user.investor) return `${user.investor.firstName} ${user.investor.lastName}`;
  if (user.partner) return `${user.partner.firstName} ${user.partner.lastName}`;
  if (user.incubator) return user.incubator.name;
  if (user.vcGroup) return user.vcGroup.name;
  return 'User';
}
