import { useState, useEffect, useCallback } from 'react';
import {
  AuthFlowState,
  AuthFlowScreen,
  UserRole,
  AuthFlowAction,
  STORAGE_KEYS,
  ANIMATION_DURATIONS,
  VALID_USER_ROLES,
} from '@/types/auth';

/**
 * Custom hook for managing the authentication flow state
 * Handles screen navigation, role selection, and persistence
 *
 * @returns Object containing flow state and control functions
 */
export const useAuthFlow = () => {
  // Initialize state with localStorage persistence (client-side only)
  const [state, setState] = useState<AuthFlowState>(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return {
        currentScreen: 'splash',
        selectedRole: null,
        isTransitioning: false,
        flowStartTime: Date.now(),
      };
    }

    const rawRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
    // Use centralized VALID_USER_ROLES constant for runtime validation
    // This ensures consistency with the UserRole type definition
    const savedRole =
      rawRole && VALID_USER_ROLES.includes(rawRole as UserRole)
        ? (rawRole as UserRole)
        : null;
    const savedStartTime = localStorage.getItem(STORAGE_KEYS.FLOW_START_TIME);

    const parsed = savedStartTime ? Number.parseInt(savedStartTime, 10) : NaN;

    return {
      currentScreen: 'splash',
      selectedRole: savedRole,
      isTransitioning: false,
      flowStartTime: Number.isNaN(parsed) ? Date.now() : parsed,
    };
  });

  /**
   * Reducer function for state updates
   */
  const flowReducer = useCallback(
    (state: AuthFlowState, action: AuthFlowAction): AuthFlowState => {
      switch (action.type) {
        case 'SET_SCREEN':
          return { ...state, currentScreen: action.payload };
        case 'SET_ROLE':
          return { ...state, selectedRole: action.payload };
        case 'SET_TRANSITIONING':
          return { ...state, isTransitioning: action.payload };
        case 'RESET_FLOW':
          return {
            currentScreen: 'splash',
            selectedRole: null,
            isTransitioning: false,
            flowStartTime: Date.now(),
          };
        default:
          return state;
      }
    },
    []
  );

  /**
   * Dispatch function for state updates with side effects
   */
  const dispatch = useCallback(
    (action: AuthFlowAction) => {
      setState(prevState => {
        const newState = flowReducer(prevState, action);

        // Persist role selection to localStorage (client-side only)
        if (
          action.type === 'SET_ROLE' &&
          typeof window !== 'undefined' &&
          typeof window.localStorage !== 'undefined'
        ) {
          if (action.payload) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, action.payload);
          } else {
            localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
          }
        }

        // Persist flow start time (client-side only)
        if (
          action.type === 'RESET_FLOW' &&
          typeof window !== 'undefined' &&
          typeof window.localStorage !== 'undefined'
        ) {
          localStorage.setItem(
            STORAGE_KEYS.FLOW_START_TIME,
            newState.flowStartTime.toString()
          );
        }

        return newState;
      });
    },
    [flowReducer]
  );

  /**
   * Navigate to the next screen in the flow
   */
  const goToNextScreen = useCallback(
    (screen?: AuthFlowScreen) => {
      const current = screen || state.currentScreen;
      dispatch({ type: 'SET_TRANSITIONING', payload: true });

      setTimeout(() => {
        switch (current) {
          case 'splash':
            dispatch({ type: 'SET_SCREEN', payload: 'onboarding' });
            break;
          case 'onboarding':
            dispatch({ type: 'SET_SCREEN', payload: 'role-selection' });
            break;
          case 'role-selection':
            dispatch({ type: 'SET_SCREEN', payload: 'auth' });
            break;
          default:
            break;
        }

        setTimeout(() => {
          dispatch({ type: 'SET_TRANSITIONING', payload: false });
        }, ANIMATION_DURATIONS.SCREEN_TRANSITION);
      }, 100); // Small delay to ensure transition state is set
    },
    [dispatch, state.currentScreen]
  );

  /**
   * Navigate to the previous screen in the flow
   */
  const goToPreviousScreen = useCallback(() => {
    const current = state.currentScreen;
    dispatch({ type: 'SET_TRANSITIONING', payload: true });

    setTimeout(() => {
      switch (current) {
        case 'onboarding':
          dispatch({ type: 'SET_SCREEN', payload: 'splash' });
          break;
        case 'role-selection':
          dispatch({ type: 'SET_SCREEN', payload: 'onboarding' });
          break;
        default:
          break;
      }

      setTimeout(() => {
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }, ANIMATION_DURATIONS.SCREEN_TRANSITION);
    }, 100);
  }, [state.currentScreen, dispatch]);

  /**
   * Set the selected role
   */
  const setSelectedRole = useCallback(
    (role: UserRole | null) => {
      dispatch({ type: 'SET_ROLE', payload: role });
    },
    [dispatch]
  );

  /**
   * Reset the entire flow
   */
  const resetFlow = useCallback(() => {
    // Clear localStorage (browser-only)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
      localStorage.removeItem(STORAGE_KEYS.FLOW_START_TIME);
    }

    dispatch({ type: 'RESET_FLOW' });
  }, [dispatch]);

  /**
   * Auto-advance from splash to onboarding after 2 seconds
   */
  useEffect(() => {
    if (state.currentScreen === 'splash') {
      const timer = setTimeout(() => {
        goToNextScreen();
      }, ANIMATION_DURATIONS.SPLASH_DISPLAY);

      return () => clearTimeout(timer);
    }
  }, [state.currentScreen, goToNextScreen]);

  /**
   * Computed values for easier consumption
   */
  const canGoNext = (() => {
    switch (state.currentScreen) {
      case 'splash':
        return true; // Auto-advances
      case 'onboarding':
        return true;
      case 'role-selection':
        return state.selectedRole !== null;
      case 'auth':
        return false; // End of flow
      default:
        return false;
    }
  })();

  const canGoBack = (() => {
    return ['onboarding', 'role-selection'].includes(state.currentScreen);
  })();

  const currentStepIndex = (() => {
    switch (state.currentScreen) {
      case 'splash':
        return 0;
      case 'onboarding':
        return 1;
      case 'role-selection':
        return 2;
      case 'auth':
        return 3;
      default:
        return 0;
    }
  })();

  return {
    // State
    currentScreen: state.currentScreen,
    selectedRole: state.selectedRole,
    isTransitioning: state.isTransitioning,
    flowStartTime: state.flowStartTime,

    // Actions
    goToNextScreen,
    goToPreviousScreen,
    setSelectedRole,
    resetFlow,

    // Computed values
    canGoNext,
    canGoBack,
    currentStepIndex,
    totalSteps: 4,
  };
};
