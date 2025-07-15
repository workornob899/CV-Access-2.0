import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !user,
    retry: false,
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("PUT", "/api/user/email", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await apiRequest("PUT", "/api/user/password", { currentPassword, newPassword });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateEmail = async (email: string) => {
    await updateEmailMutation.mutateAsync(email);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateEmail,
        updatePassword,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
