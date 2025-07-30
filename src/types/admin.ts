export type ProjectViewWithRelations = {
  id: string;
  createdAt: Date;
  projectId: string;
  investorId: string | null;
  vcGroupId: string | null;
  project: {
    name: string;
    Entrepreneur: {
      firstName: string;
      lastName: string;
    } | null;
  };
  investor: {
    firstName: string;
    lastName: string;
    user: {
      email: string;
    };
  } | null;
};