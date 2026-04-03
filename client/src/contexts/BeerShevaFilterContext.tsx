import { createContext, useContext, useState, type ReactNode } from 'react';

interface BeerShevaFilterContextValue {
  beerShevaOnly: boolean;
  setBeerShevaOnly: (value: boolean) => void;
}

const BeerShevaFilterContext = createContext<BeerShevaFilterContextValue>({
  beerShevaOnly: true,
  setBeerShevaOnly: () => {},
});

export function BeerShevaFilterProvider({ children }: { children: ReactNode }) {
  const [beerShevaOnly, setBeerShevaOnly] = useState(true);

  return (
    <BeerShevaFilterContext.Provider value={{ beerShevaOnly, setBeerShevaOnly }}>
      {children}
    </BeerShevaFilterContext.Provider>
  );
}

export function useBeerShevaFilter() {
  return useContext(BeerShevaFilterContext);
}
