import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, type AuthUser, type LoginResponse } from "./api";
import { storage } from "@/lib/storage";

type ActiveHotel = {
  id: string;
  name: string;
  slug: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  activeHotel: ActiveHotel | null;
  isAuthenticating: boolean;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  setActiveHotel: (hotel: ActiveHotel | null) => void;
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const ACTIVE_HOTEL_KEY = "active_hotel";

const initialToken = storage.get<string | null>(AUTH_TOKEN_KEY);
const initialUser = storage.get<AuthUser | null>(AUTH_USER_KEY);
const initialHotel = storage.get<ActiveHotel | null>(ACTIVE_HOTEL_KEY);

const resolveInitialHotel = (user: AuthUser | null, storedHotel: ActiveHotel | null): ActiveHotel | null => {
  if (!user) return null;
  if (user.role === "MANAGER") {
    return user.hotel ? { ...user.hotel } : null;
  }
  if (user.role === "ADMIN") {
    if (user.hotel) {
      return { ...user.hotel };
    }
    return storedHotel ?? null;
  }
  return null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    token: initialToken ?? null,
    user: initialUser ?? null,
    activeHotel: resolveInitialHotel(initialUser ?? null, initialHotel ?? null),
    isAuthenticating: false,
  });

  const persistState = useCallback((token: string | null, user: AuthUser | null, activeHotel: ActiveHotel | null) => {
    if (token) {
      storage.set(AUTH_TOKEN_KEY, token);
    } else {
      storage.remove(AUTH_TOKEN_KEY);
    }
    if (user) {
      storage.set(AUTH_USER_KEY, user);
    } else {
      storage.remove(AUTH_USER_KEY);
    }
    if (activeHotel) {
      storage.set(ACTIVE_HOTEL_KEY, activeHotel);
    } else {
      storage.remove(ACTIVE_HOTEL_KEY);
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, isAuthenticating: true }));
      try {
        const response = await loginRequest(credentials);
        const nextHotel = resolveInitialHotel(response.user, null);
        setState({
          token: response.token,
          user: response.user,
          activeHotel: nextHotel,
          isAuthenticating: false,
        });
        persistState(response.token, response.user, nextHotel);
        return response;
      } catch (error) {
        setState((prev) => ({ ...prev, isAuthenticating: false }));
        throw error;
      }
    },
    [persistState],
  );

  const logout = useCallback(() => {
    setState({ token: null, user: null, activeHotel: null, isAuthenticating: false });
    persistState(null, null, null);
  }, [persistState]);

  const setActiveHotel = useCallback(
    (hotel: ActiveHotel | null) => {
      setState((prev) => ({ ...prev, activeHotel: hotel }));
      if (hotel) {
        storage.set(ACTIVE_HOTEL_KEY, hotel);
      } else {
        storage.remove(ACTIVE_HOTEL_KEY);
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(state.token && state.user);
    const isAdmin = state.user?.role === "ADMIN";

    return {
      ...state,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      setActiveHotel,
    };
  }, [state, login, logout, setActiveHotel]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRequireHotel = () => {
  const { activeHotel, isAdmin } = useAuth();
  if (isAdmin && !activeHotel) {
    throw new Error("Debe seleccionar un hotel para continuar");
  }
  return activeHotel;
};
