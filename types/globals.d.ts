export { };

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      userType?: UserType;
      userIsAdmin?: boolean;
    };
    primaryEmail?: string;
  }
}
