import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeSetting = 'dark' | 'light' | 'auto';
export type Theme = 'dark' | 'light';

export const THEME_SETTINGS: ThemeSetting[] = ['dark', 'light', 'auto'];
const THEME_KEY = 'allmeteo:theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#0b1120', light: '#f1f5f9' };

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_SETTINGS.includes(v as ThemeSetting) ? (v as ThemeSetting) : 'dark';
  } catch {
    return 'dark';
  }
}

const systemLight = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;

interface ThemeContextValue { setting: ThemeSetting; theme: Theme; setSetting: (s: ThemeSetting) => void }

const ThemeContext = createContext<ThemeContextValue>({ setting: 'dark', theme: 'dark', setSetting: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setState] = useState<ThemeSetting>(readSetting);
  const [prefersLight, setPrefersLight] = useState(systemLight);
  const theme: Theme = setting === 'auto' ? (prefersLight ? 'light' : 'dark') : setting;

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setPrefersLight(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // il CSS (index.css) ridefinisce la palette in base a questo attributo
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const setSetting = (s: ThemeSetting) => {
    setState(s);
    try {
      localStorage.setItem(THEME_KEY, s);
    } catch {
      // localStorage non disponibile: la scelta vale fino alla chiusura
    }
  };

  return <ThemeContext.Provider value={{ setting, theme, setSetting }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
