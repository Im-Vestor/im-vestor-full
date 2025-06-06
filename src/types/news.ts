import type { UserType } from '@prisma/client';

// News router accepted user types
export type NewsUserType = 'ENTREPRENEUR' | 'INVESTOR' | 'PARTNER' | 'VC_GROUP' | 'INCUBATOR' | 'ADMIN';

// URL parameter types (lowercase for URLs)
export type NewsUrlType = 'entrepreneur' | 'investor' | 'partner' | 'vc_group' | 'incubator' | 'admin';

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

// Map URL parameter to API enum
export function mapUrlTypeToApiType(urlType: string): NewsUserType | null {
  switch (urlType.toLowerCase()) {
    case 'entrepreneur':
      return 'ENTREPRENEUR';
    case 'investor':
      return 'INVESTOR';
    case 'partner':
      return 'PARTNER';
    case 'vc_group':
    case 'vcgroup':
      return 'VC_GROUP';
    case 'incubator':
      return 'INCUBATOR';
    case 'admin':
      return 'ADMIN';
    default:
      return null;
  }
}

// Map API enum to URL parameter
export function mapApiTypeToUrlType(apiType: NewsUserType): NewsUrlType {
  switch (apiType) {
    case 'ENTREPRENEUR':
      return 'entrepreneur';
    case 'INVESTOR':
      return 'investor';
    case 'PARTNER':
      return 'partner';
    case 'VC_GROUP':
      return 'vc_group';
    case 'INCUBATOR':
      return 'incubator';
    case 'ADMIN':
      return 'admin';
  }
}

// Get user type title for display
export function getUserTypeTitle(userType: NewsUserType): string {
  switch (userType) {
    case 'ENTREPRENEUR':
      return 'Entrepreneur';
    case 'INVESTOR':
      return 'Investor';
    case 'PARTNER':
      return 'Partner';
    case 'VC_GROUP':
      return 'VC Group';
    case 'INCUBATOR':
      return 'Incubator';
    case 'ADMIN':
      return 'Admin';
  }
}

// Get section title for news
export function getNewsSectionTitle(userType: NewsUserType): string {
  switch (userType) {
    case 'ENTREPRENEUR':
      return 'Latest for Entrepreneurs';
    case 'INVESTOR':
      return 'Latest for Investors';
    case 'PARTNER':
      return 'Latest for Partners';
    case 'VC_GROUP':
      return 'Latest for VC Groups';
    case 'INCUBATOR':
      return 'Latest for Incubators';
    case 'ADMIN':
      return 'Latest News';
  }
}

// Get description for news section
export function getNewsDescription(userType: NewsUserType): string {
  switch (userType) {
    case 'ENTREPRENEUR':
      return 'Curated content specifically for entrepreneurs and startup founders';
    case 'INVESTOR':
      return 'Investment insights and opportunities for investors';
    case 'PARTNER':
      return 'Partnership opportunities and business collaboration insights';
    case 'VC_GROUP':
      return 'Venture capital trends and investment strategies';
    case 'INCUBATOR':
      return 'Startup incubation and acceleration insights';
    case 'ADMIN':
      return 'Latest news and updates';
  }
}

// Valid user types for URL parameters
export const VALID_URL_USER_TYPES: NewsUrlType[] = ['entrepreneur', 'investor', 'partner', 'vc_group', 'incubator', 'admin'];