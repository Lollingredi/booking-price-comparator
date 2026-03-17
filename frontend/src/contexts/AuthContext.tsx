import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "../api/auth";
import { hotelsApi } from "../api/hotels";
import type { User, ComparisonRow } from "../types";
import { DEMO_USER, generateDemoComparisonForHotel, buildDemoHotelFromItaly } from "../demo/demoData";
import type { ItalyHotel } from "../demo/italyHotels";
import { getCompetitorsWithin20km } from "../demo/italyHotels";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  needsOnboarding: boolean;
  demoComparison: ComparisonRow[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  loginDemo: (hotel?: ItalyHotel, competitors?: ItalyHotel[]) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [demoComparison, setDemoComparison] = useState<ComparisonRow[]>([]);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      try {
        await hotelsApi.getMine();
        setNeedsOnboarding(false);
      } catch {
        setNeedsOnboarding(true);
      }
    } catch {
      setUser(null);
      setNeedsOnboarding(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    await fetchMe();
  };

  const register = async (email: string, password: string, full_name: string) => {
    const { data } = await authApi.register(email, password, full_name);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    await fetchMe();
  };

  const loginDemo = useCallback((hotel?: ItalyHotel, competitors?: ItalyHotel[]) => {
    setUser({ ...DEMO_USER, full_name: hotel ? `Demo – ${hotel.city}` : DEMO_USER.full_name });
    setIsDemoMode(true);
    if (hotel) {
      const comps = competitors ?? getCompetitorsWithin20km(hotel);
      const comparison = generateDemoComparisonForHotel(hotel, comps);
      setDemoComparison(comparison);
      (window as any).__demoHotel = buildDemoHotelFromItaly(hotel, comps);
    } else {
      // fallback: use default static data (imported lazily to avoid circular deps)
      import("../demo/demoData").then(({ DEMO_COMPARISON }) => setDemoComparison(DEMO_COMPARISON));
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsDemoMode(false);
    setNeedsOnboarding(false);
    setDemoComparison([]);
    (window as any).__demoHotel = undefined;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isDemoMode, needsOnboarding, demoComparison, login, register, loginDemo, completeOnboarding, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
