import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSignUp } from '@clerk/nextjs';
import RegisterPage from '../app/auth/register/page';

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useSignUp: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('RegisterPage', () => {
  const mockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
    attemptEmailAddressVerification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSignUp as jest.Mock).mockReturnValue({
      isLoaded: true,
      signUp: mockSignUp,
      setActive: jest.fn(),
    });
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('renders registration form', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('I am a')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('loads pre-selected role from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('traveler');

    render(<RegisterPage />);

    const roleSelect = screen.getByRole('combobox');
    expect(roleSelect).toHaveValue('traveler');
  });

  it('validates password strength', async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    fireEvent.change(passwordInput, { target: { value: 'mediumpass' } });

    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    fireEvent.change(passwordInput, { target: { value: 'strongpassword123' } });

    await waitFor(() => {
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters long.')
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'different123' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  it('submits registration form successfully', async () => {
    mockSignUp.create.mockResolvedValue({});
    mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        password: 'password123',
        unsafeMetadata: {
          phone: '',
          country: '',
          role: 'shopper',
        },
      });
      expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: 'email_code',
      });
    });

    expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
  });

  it('handles registration errors', async () => {
    const mockError = {
      errors: [
        {
          message: 'Email already exists',
          meta: { paramName: 'email_address' },
        },
      ],
    };
    mockSignUp.create.mockRejectedValue(mockError);

    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('verifies email successfully', async () => {
    const mockSetActive = jest.fn();
    (useSignUp as jest.Mock).mockReturnValue({
      isLoaded: true,
      signUp: {
        ...mockSignUp,
        attemptEmailAddressVerification: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'session-123',
        }),
      },
      setActive: mockSetActive,
    });

    render(<RegisterPage />);

    // Simulate being in verification state
    const codeInput = screen.getByLabelText('Verification Code');
    const verifyButton = screen.getByRole('button', { name: 'Verify Email' });

    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ session: 'session-123' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles verification errors', async () => {
    const mockError = {
      errors: [{ message: 'Invalid verification code' }],
    };
    mockSignUp.attemptEmailAddressVerification.mockRejectedValue(mockError);

    render(<RegisterPage />);

    // Simulate being in verification state
    const codeInput = screen.getByLabelText('Verification Code');
    const verifyButton = screen.getByRole('button', { name: 'Verify Email' });

    fireEvent.change(codeInput, { target: { value: 'invalid' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: 'Show password' });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates role selection', async () => {
    render(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please select a valid role.')
      ).toBeInTheDocument();
    });
  });
});
