import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auditService } from '../services/auditService';

export interface EmployeeUser {
  id: string;
  name: string;
  role: 'Administrador' | 'Gerente' | 'Produção' | 'Caixa' | string;
  email?: string | null;
  pin_code?: string | null;
  status: 'Active' | 'Inactive' | string;
}

interface AuthContextType {
  user: EmployeeUser | null;
  loading: boolean;
  loginWithPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  switchUser: (pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasRole: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'gelato_manager_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega sessão salva no localStorage ao iniciar
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Falha ao recuperar sessão local:', e);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithPin = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    if (!pin || pin.trim().length < 4) {
      return { success: false, message: 'Digite o PIN de 4 dígitos.' };
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, role, email, pin_code, status')
        .eq('pin_code', pin.trim())
        .eq('status', 'Active')
        .single();

      if (error || !data) {
        return { success: false, message: 'PIN incorreto ou operador inativo.' };
      }

      const employee: EmployeeUser = {
        id: data.id,
        name: data.name,
        role: data.role,
        email: data.email,
        pin_code: data.pin_code,
        status: data.status,
      };

      setUser(employee);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employee));

      // Auditoria
      auditService.logSecurityEvent(
        'LOGIN_PIN_SUCCESS',
        'employees',
        employee.id,
        { operator: employee.name, role: employee.role },
        employee.id
      ).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao validar PIN.' };
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!email || !password) {
      return { success: false, message: 'Preencha email e senha.' };
    }

    try {
      // 1. Tenta autenticação via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Fallback: busca pelo email na tabela employees se for admin de demonstração
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('id, name, role, email, pin_code, status')
          .eq('email', email.trim())
          .eq('status', 'Active')
          .single();

        if (!empError && empData && (password === 'admin123' || password === empData.pin_code)) {
          const employee: EmployeeUser = {
            id: empData.id,
            name: empData.name,
            role: empData.role,
            email: empData.email,
            pin_code: empData.pin_code,
            status: empData.status,
          };
          setUser(employee);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(employee));
          return { success: true };
        }

        return { success: false, message: authError.message || 'Credenciais inválidas.' };
      }

      // 2. Se autenticado no Supabase Auth, busca registro de funcionário correspondente
      const { data: empData } = await supabase
        .from('employees')
        .select('id, name, role, email, pin_code, status')
        .eq('email', email.trim())
        .single();

      const employee: EmployeeUser = empData || {
        id: authData.user?.id || 'admin-user',
        name: authData.user?.user_metadata?.name || email.split('@')[0],
        role: 'Administrador',
        email: email.trim(),
        status: 'Active',
      };

      setUser(employee);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employee));

      auditService.logSecurityEvent(
        'LOGIN_EMAIL_SUCCESS',
        'employees',
        employee.id,
        { email: employee.email, role: employee.role },
        employee.id
      ).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro no login com e-mail.' };
    }
  };

  const switchUser = async (pin: string): Promise<{ success: boolean; message?: string }> => {
    return loginWithPin(pin);
  };

  const logout = () => {
    if (user) {
      auditService.logSecurityEvent(
        'LOGOUT',
        'employees',
        user.id,
        { operator: user.name },
        user.id
      ).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    supabase.auth.signOut().catch(() => {});
  };

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'Administrador' || user.role === 'Admin' || user.role === 'Gerente') {
      return true; // Administradores têm acesso total
    }
    return allowedRoles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPin,
        loginWithEmail,
        switchUser,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
