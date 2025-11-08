import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoleManagement } from '../hooks/useRoleManagement';

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Mock useUser hook
jest.mock('../hooks/useUser', () => ({
  useUser: () => ({
    user: { id: 'current-user-id' },
    refetch: jest.fn(),
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useRoleManagement', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('updateUserRole', () => {
    it('successfully updates user role', async () => {
      const mockResponse = {
        message: 'User role updated successfully',
        user: { id: 'user-123', email: 'user@example.com', role: 'traveler' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      const promise = result.current.updateUserRole('user-123', 'traveler');

      await waitFor(() => {
        expect(result.current.isUpdatingUserRole).toBe(true);
      });

      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user-123/role',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ role: 'traveler' }),
        }
      );

      await waitFor(() => {
        expect(result.current.updateUserRoleSuccess).toBe(true);
      });
    });

    it('handles API errors', async () => {
      const mockError = {
        error: 'Forbidden',
        message: 'Admin access required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      await expect(
        result.current.updateUserRole('user-123', 'traveler')
      ).rejects.toEqual(mockError);

      await waitFor(() => {
        expect(result.current.updateUserRoleError).toBeDefined();
      });
    });

    it('handles authentication errors', async () => {
      // Mock getToken to return null
      jest.mocked(require('@clerk/nextjs').useAuth).mockReturnValue({
        getToken: jest.fn().mockResolvedValue(null),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      await expect(
        result.current.updateUserRole('user-123', 'traveler')
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateOwnRole', () => {
    it('successfully updates own role', async () => {
      const mockResponse = {
        message: 'Role updated successfully',
        user: {
          id: 'current-user-id',
          email: 'user@example.com',
          role: 'vendor',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      const promise = result.current.updateOwnRole('vendor');

      await waitFor(() => {
        expect(result.current.isUpdatingOwnRole).toBe(true);
      });

      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/role',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ role: 'vendor' }),
        }
      );

      await waitFor(() => {
        expect(result.current.updateOwnRoleSuccess).toBe(true);
      });
    });

    it('handles API errors for own role update', async () => {
      const mockError = {
        error: 'Forbidden',
        message: 'Users cannot assign themselves admin role',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      await expect(result.current.updateOwnRole('admin')).rejects.toEqual(
        mockError
      );

      await waitFor(() => {
        expect(result.current.updateOwnRoleError).toBeDefined();
      });
    });
  });

  describe('loading and error states', () => {
    it('provides combined loading state', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ message: 'Success' }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      const promise = result.current.updateUserRole('user-123', 'traveler');

      expect(result.current.isLoading).toBe(true);

      await promise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('provides combined error state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error' }),
      });

      const { result } = renderHook(() => useRoleManagement(), { wrapper });

      try {
        await result.current.updateUserRole('user-123', 'traveler');
      } catch (error) {
        // Expected error
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});
