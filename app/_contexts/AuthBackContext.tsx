import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from 'react';

type AuthBackOptions = {
  show: boolean;
  onBack: () => void;
  disabled?: boolean;
};

type AuthBackContextType = {
  backOptions: AuthBackOptions;
  setBackOptions: (options: AuthBackOptions) => void;
};

const defaultOptions: AuthBackOptions = {
  show: false,
  onBack: () => {},
};

const AuthBackContext = createContext<AuthBackContextType | undefined>(
  undefined
);

export function AuthBackProvider({ children }: { children: React.ReactNode }) {
  const [backOptions, setBackOptionsState] = useState<AuthBackOptions>(
    defaultOptions
  );

  const setBackOptions = useCallback((options: AuthBackOptions) => {
    setBackOptionsState(options);
  }, []);

  const value = useMemo(
    () => ({ backOptions, setBackOptions }),
    [backOptions, setBackOptions]
  );

  return (
    <AuthBackContext.Provider value={value}>
      {children}
    </AuthBackContext.Provider>
  );
}

export function useAuthBack() {
  const ctx = useContext(AuthBackContext);
  if (ctx === undefined) {
    throw new Error('useAuthBack must be used within AuthBackProvider');
  }
  return ctx;
}
