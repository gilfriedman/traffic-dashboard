import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface GlobalFiltersContextValue {
  beerShevaOnly: boolean;
  setBeerShevaOnly: (value: boolean) => void;
  hideMidnight: boolean;
  setHideMidnight: (value: boolean) => void;
}

// Both toggles default to on. Only the non-default (off) state is reflected in the
// URL — `all=1` shows every neighborhood, `midnight=1` shows the midnight hour.
const SHOW_ALL_NEIGHBORHOODS_PARAM = 'all';
const SHOW_MIDNIGHT_PARAM = 'midnight';

const GlobalFiltersContext = createContext<GlobalFiltersContextValue>({
  beerShevaOnly: true,
  setBeerShevaOnly: () => {},
  hideMidnight: true,
  setHideMidnight: () => {},
});

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [beerShevaOnly, setBeerShevaOnlyState] = useState(
    () => searchParams.get(SHOW_ALL_NEIGHBORHOODS_PARAM) !== '1'
  );
  const [hideMidnight, setHideMidnightState] = useState(
    () => searchParams.get(SHOW_MIDNIGHT_PARAM) !== '1'
  );

  const updateOffByDefaultParam = useCallback(
    (key: string, isOn: boolean) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (isOn) {
            updated.delete(key);
          } else {
            updated.set(key, '1');
          }
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setBeerShevaOnly = useCallback(
    (value: boolean) => {
      setBeerShevaOnlyState(value);
      updateOffByDefaultParam(SHOW_ALL_NEIGHBORHOODS_PARAM, value);
    },
    [updateOffByDefaultParam]
  );

  const setHideMidnight = useCallback(
    (value: boolean) => {
      setHideMidnightState(value);
      updateOffByDefaultParam(SHOW_MIDNIGHT_PARAM, value);
    },
    [updateOffByDefaultParam]
  );

  return (
    <GlobalFiltersContext.Provider value={{ beerShevaOnly, setBeerShevaOnly, hideMidnight, setHideMidnight }}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  return useContext(GlobalFiltersContext);
}
