/**
 * Authentication Flow Types
 * Defines TypeScript interfaces and types for the BagXtra authentication flow
 */

/**
 * User roles available in the application
 * This is the single source of truth for all user roles in the system
 */
export type UserRole = 'shopper' | 'traveler' | 'vendor' | 'admin';

/**
 * Runtime constant for UserRole validation
 * Ensures compile-time and runtime type safety are aligned
 * Use this constant instead of hardcoded arrays to maintain consistency
 */
export const VALID_USER_ROLES: readonly UserRole[] = [
  'shopper',
  'traveler',
  'vendor',
  'admin',
] as const;

/**
 * Screens in the authentication flow
 */
export type AuthFlowScreen =
  | 'splash'
  | 'onboarding'
  | 'role-selection'
  | 'auth';

/**
 * State interface for the authentication flow
 */
export interface AuthFlowState {
  /** Current screen being displayed */
  currentScreen: AuthFlowScreen;
  /** Selected user role (null if not selected) */
  selectedRole: UserRole | null;
  /** Whether a screen transition is in progress */
  isTransitioning: boolean;
  /** Timestamp when the flow started (for analytics) */
  flowStartTime: number;
}

/**
 * Configuration for role selection options
 */
export interface RoleOption {
  /** Unique identifier for the role */
  id: UserRole;
  /** Display title for the role */
  title: string;
  /** Description text explaining the role */
  description: string;
  /** Icon component for visual representation */
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Props for the RoleCard component
 */
export interface RoleCardProps {
  /** Role configuration */
  role: RoleOption;
  /** Whether this role is currently selected */
  isSelected: boolean;
  /** Callback when the role is selected */
  onSelect: (roleId: UserRole) => void;
  /** Whether the card is disabled */
  disabled?: boolean;
}

/**
 * Props for the ProgressIndicator component
 */
export interface ProgressIndicatorProps {
  /** Current step (0-based index) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * Local storage keys for persistence
 */
export const STORAGE_KEYS = {
  SELECTED_ROLE: 'bagxtra_selected_role',
  FLOW_START_TIME: 'bagxtra_flow_start_time',
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  SPLASH_DISPLAY: 2000, // 2 seconds as requested
  SCREEN_TRANSITION: 500,
  SPLASH_FADE_OUT: 800,
} as const;

/**
 * Flow navigation actions
 */
export type AuthFlowAction =
  | { type: 'SET_SCREEN'; payload: AuthFlowScreen }
  | { type: 'SET_ROLE'; payload: UserRole | null }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'RESET_FLOW' };
