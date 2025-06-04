import type { UserType } from '@prisma/client';

// News router accepted user types
export type NewsUserType = 'ENTREPRENEUR' | 'INVESTOR' | 'PARTNER' | 'VC_GROUP' | 'INCUBATOR' | 'ADMIN';

// Type guard to check if UserType is valid for news
export function isValidNewsUserType(userType: UserType): userType is NewsUserType {
  return ['ENTREPRENEUR', 'INVESTOR', 'PARTNER', 'VC_GROUP', 'INCUBATOR', 'ADMIN'].includes(userType);
}

// Convert UserType to NewsUserType safely
export function toNewsUserType(userType: UserType): NewsUserType {
  if (isValidNewsUserType(userType)) {
    return userType;
  }
  // Fallback to a default type
  return 'ENTREPRENEUR';
}