export {}

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      userType?: UserType;
    };
    primaryEmail?: string;
  }
}