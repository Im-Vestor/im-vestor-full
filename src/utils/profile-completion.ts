import { type UserType } from '@prisma/client';

export interface UserData {
  userType?: UserType;
  entrepreneur?: {
    countryId?: number | null;
    country?: { id: number } | null;
  } | null;
  investor?: {
    countryId?: number | null;
    country?: { id: number } | null;
  } | null;
  partner?: {
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
  } | null;
  incubator?: {
    countryId?: number | null;
  } | null;
  vcGroup?: {
    countryId?: number | null;
  } | null;
}

export function isProfileCompleted(userData: UserData | null | undefined): boolean {
  if (!userData?.userType) return false;

  switch (userData.userType) {
    case 'ENTREPRENEUR':
      return !!userData.entrepreneur?.countryId;
    case 'INVESTOR':
      return !!userData.investor?.countryId;
    case 'PARTNER':
      return !!(userData.partner?.firstName && userData.partner?.lastName);
    case 'INCUBATOR':
      return !!userData.incubator?.countryId;
    case 'VC_GROUP':
      return !!userData.vcGroup?.countryId;
    case 'ADMIN':
      return true; // Admins are considered complete
    default:
      return false;
  }
}
