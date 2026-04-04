import { createContext, useContext, useState, type ReactNode } from 'react';

interface GlobalFiltersContextValue {
  beerShevaOnly: boolean;
  setBeerShevaOnly: (value: boolean) => void;
  hideMidnight: boolean;
  setHideMidnight: (value: boolean) => void;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextValue>({
  beerShevaOnly: true,
  setBeerShevaOnly: () => {},
  hideMidnight: true,
  setHideMidnight: () => {},
});

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [beerShevaOnly, setBeerShevaOnly] = useState(true);
  const [hideMidnight, setHideMidnight] = useState(true);

  return (
    <GlobalFiltersContext.Provider value={{ beerShevaOnly, setBeerShevaOnly, hideMidnight, setHideMidnight }}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  return useContext(GlobalFiltersContext);
}
