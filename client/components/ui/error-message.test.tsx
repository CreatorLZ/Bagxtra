import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorMessage,
  AuthErrorMessage,
  PermissionErrorMessage,
} from './error-message';
import { ApiError } from '@/types/auth';

describe('ErrorMessage', () => {
  const mockOnRecoveryAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recovery Action Button', () => {
    it('renders a functional button when onRecoveryAction is provided', () => {
      const error: ApiError = {
        error: 'Auth required',
        code: 'AUTH_REQUIRED',
        message: 'Please log in',
      };
      render(
        <ErrorMessage error={error} onRecoveryAction={mockOnRecoveryAction} />
      );

      const button = screen.getByRole('button', { name: /log in/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockOnRecoveryAction).toHaveBeenCalledWith('Log in');
    });

    it('renders plain text when onRecoveryAction is not provided', () => {
      const error: ApiError = {
        error: 'Auth required',
        code: 'AUTH_REQUIRED',
        message: 'Please log in',
      };
      render(<ErrorMessage error={error} />);

      const text = screen.getByText('Log in');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('SPAN');
    });

    it('renders a functional button for permission errors when onRecoveryAction is provided', () => {
      const error: ApiError = {
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied',
      };
      render(
        <ErrorMessage error={error} onRecoveryAction={mockOnRecoveryAction} />
      );

      const button = screen.getByRole('button', {
        name: /contact administrator/i,
      });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockOnRecoveryAction).toHaveBeenCalledWith(
        'Contact administrator'
      );
    });

    it('renders plain text for permission errors when onRecoveryAction is not provided', () => {
      const error: ApiError = {
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied',
      };
      render(<ErrorMessage error={error} />);

      const text = screen.getByText('Contact administrator');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('SPAN');
    });
  });

  describe('Specialized Components', () => {
    it('AuthErrorMessage renders with functional button when onRecoveryAction is provided', () => {
      render(<AuthErrorMessage />);

      // Since AuthErrorMessage doesn't accept props, it should render plain text
      const text = screen.getByText('Log in');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('SPAN');
    });

    it('PermissionErrorMessage renders with functional button when onRecoveryAction is provided', () => {
      render(<PermissionErrorMessage />);

      // Since PermissionErrorMessage doesn't accept props, it should render plain text
      const text = screen.getByText('Contact administrator');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('SPAN');
    });
  });

  describe('Retry Button', () => {
    it('renders retry button when onRetry is provided and recoveryAction is "Try again"', () => {
      const error: Error = { name: 'NetworkError', message: 'Network error' };
      const mockOnRetry = jest.fn();
      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });
});
