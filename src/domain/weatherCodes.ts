export type WeatherCategory = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherInfo {
  description: string;
  icon: string;
  category: WeatherCategory;
}

const W = (description: string, icon: string, category: WeatherCategory): WeatherInfo =>
  ({ description, icon, category });

const WMO: Record<number, WeatherInfo> = {
  0: W('Sereno', '☀️', 'clear'),
  1: W('Prevalentemente sereno', '🌤️', 'clear'),
  2: W('Parzialmente nuvoloso', '⛅', 'cloudy'),
  3: W('Coperto', '☁️', 'cloudy'),
  45: W('Nebbia', '🌫️', 'fog'),
  48: W('Nebbia con brina', '🌫️', 'fog'),
  51: W('Pioviggine leggera', '🌦️', 'rain'),
  53: W('Pioviggine', '🌦️', 'rain'),
  55: W('Pioviggine intensa', '🌧️', 'rain'),
  56: W('Pioviggine gelata', '🌧️', 'rain'),
  57: W('Pioviggine gelata intensa', '🌧️', 'rain'),
  61: W('Pioggia debole', '🌧️', 'rain'),
  63: W('Pioggia', '🌧️', 'rain'),
  65: W('Pioggia intensa', '🌧️', 'rain'),
  66: W('Pioggia gelata', '🌧️', 'rain'),
  67: W('Pioggia gelata intensa', '🌧️', 'rain'),
  71: W('Neve debole', '🌨️', 'snow'),
  73: W('Neve', '🌨️', 'snow'),
  75: W('Neve intensa', '❄️', 'snow'),
  77: W('Nevischio', '🌨️', 'snow'),
  80: W('Rovesci deboli', '🌦️', 'rain'),
  81: W('Rovesci', '🌧️', 'rain'),
  82: W('Rovesci violenti', '⛈️', 'rain'),
  85: W('Rovesci di neve', '🌨️', 'snow'),
  86: W('Rovesci di neve intensi', '❄️', 'snow'),
  95: W('Temporale', '⛈️', 'storm'),
  96: W('Temporale con grandine', '⛈️', 'storm'),
  99: W('Temporale con grandine forte', '⛈️', 'storm'),
};

const FALLBACK = W('Variabile', '🌥️', 'cloudy');

export function getWeatherInfo(code: number | null): WeatherInfo {
  return code === null ? FALLBACK : (WMO[code] ?? FALLBACK);
}
