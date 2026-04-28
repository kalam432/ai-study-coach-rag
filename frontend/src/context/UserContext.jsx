import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  userId: null,
  sessions: [],
  performance: null,
  chatHistory: [],
  loading: false,
  error: null,
  darkMode: false,
};

// Action types
const actionTypes = {
  SET_USER: 'SET_USER',
  SET_SESSIONS: 'SET_SESSIONS',
  ADD_SESSION: 'ADD_SESSION',
  SET_PERFORMANCE: 'SET_PERFORMANCE',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  CLEAR_CHAT: 'CLEAR_CHAT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
};

// Reducer function
const userReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        userId: action.payload.userId,
        error: null,
      };

    case actionTypes.SET_SESSIONS:
      return {
        ...state,
        sessions: action.payload,
        error: null,
      };

    case actionTypes.ADD_SESSION:
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
        error: null,
      };

    case actionTypes.SET_PERFORMANCE:
      return {
        ...state,
        performance: action.payload,
        error: null,
      };

    case actionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
        error: null,
      };

    case actionTypes.CLEAR_CHAT:
      return {
        ...state,
        chatHistory: [],
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case actionTypes.TOGGLE_DARK_MODE:
      return {
        ...state,
        darkMode: !state.darkMode,
      };

    default:
      return state;
  }
};

// Create context
const UserContext = createContext();

// Context provider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('studyCoachUser');
    const savedDarkMode = localStorage.getItem('studyCoachDarkMode');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        dispatch({
          type: actionTypes.SET_USER,
          payload: userData,
        });
      } catch (error) {
        console.error('Error loading saved user data:', error);
        localStorage.removeItem('studyCoachUser');
      }
    }

    if (savedDarkMode) {
      const isDarkMode = savedDarkMode === 'true';
      dispatch({ type: actionTypes.TOGGLE_DARK_MODE });
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Save user data to localStorage when user changes
  useEffect(() => {
    if (state.user && state.userId) {
      localStorage.setItem('studyCoachUser', JSON.stringify({
        user: state.user,
        userId: state.userId,
      }));
    }
  }, [state.user, state.userId]);

  // Handle dark mode changes
  useEffect(() => {
    localStorage.setItem('studyCoachDarkMode', state.darkMode.toString());
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Action creators
  const actions = {
    setUser: (user, userId) => {
      dispatch({
        type: actionTypes.SET_USER,
        payload: { user, userId },
      });
    },

    setSessions: (sessions) => {
      dispatch({
        type: actionTypes.SET_SESSIONS,
        payload: sessions,
      });
    },

    addSession: (session) => {
      dispatch({
        type: actionTypes.ADD_SESSION,
        payload: session,
      });
    },

    setPerformance: (performance) => {
      dispatch({
        type: actionTypes.SET_PERFORMANCE,
        payload: performance,
      });
    },

    addChatMessage: (message) => {
      dispatch({
        type: actionTypes.ADD_CHAT_MESSAGE,
        payload: {
          ...message,
          timestamp: new Date().toISOString(),
          id: Date.now() + Math.random(),
        },
      });
    },

    clearChat: () => {
      dispatch({ type: actionTypes.CLEAR_CHAT });
    },

    setLoading: (loading) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: loading,
      });
    },

    setError: (error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error,
      });
    },

    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    toggleDarkMode: () => {
      dispatch({ type: actionTypes.TOGGLE_DARK_MODE });
    },

    logout: () => {
      localStorage.removeItem('studyCoachUser');
      dispatch({
        type: actionTypes.SET_USER,
        payload: { user: null, userId: null },
      });
      dispatch({ type: actionTypes.SET_SESSIONS, payload: [] });
      dispatch({ type: actionTypes.SET_PERFORMANCE, payload: null });
      dispatch({ type: actionTypes.CLEAR_CHAT });
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;