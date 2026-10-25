import { createContext, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_UNITS, parseUnits, type Units } from '../domain/units';

const UNITS_KEY = 'allmeteo:units';

function readUnits(): Units {
  try {
    return parseUnits(JSON.parse(localStorage.getItem(UNITS_KEY) ?? 'null'));
  } catch {
    return DEFAULT_UNITS;
  }
}

interface UnitsContextValue { units: Units; setUnits: (u: Units) => void }

// senza provider (es. nei test dei componenti) valgono le unità di default
const UnitsContext = createContext<UnitsContextValue>({ units: DEFAULT_UNITS, setUnits: () => {} });

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setState] = useState<Units>(readUnits);
  const setUnits = (u: Units) => {
    setState(u);
    try {
      localStorage.setItem(UNITS_KEY, JSON.stringify(u));
    } catch {
      // localStorage non disponibile: la scelta vale fino alla chiusura
    }
  };
  return <UnitsContext.Provider value={{ units, setUnits }}>{children}</UnitsContext.Provider>;
}

export const useUnits = () => useContext(UnitsContext);
