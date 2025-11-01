// Client-side authentication types
export type UserRole = 'shopper' | 'traveler' | 'vendor' | 'admin';

export interface User {
  id: string;
  clerkId: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  country?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}
