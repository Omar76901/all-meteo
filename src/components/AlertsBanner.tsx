import type { AlertSeverity, WeatherAlert } from '../domain/alerts';

const STYLE: Record<AlertSeverity, string> = {
  rosso: 'border-rose-500/60 bg-rose-500/10 text-rose-300',
  arancione: 'border-orange-500/60 bg-orange-500/10 text-orange-300',
  giallo: 'border-amber-400/60 bg-amber-400/10 text-amber-300',
};

export function AlertsBanner({ alerts }: { alerts: WeatherAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-label="Allerte meteo">
      {alerts.map(a => (
        <div key={a.id} className={`border rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm ${STYLE[a.severity]}`}>
          <span className="text-xl" aria-hidden>{a.icon}</span>
          <div className="min-w-0">
            <p className="font-bold uppercase text-[11px] tracking-wider">Allerta {a.severity} · {a.title}</p>
            <p className="text-xs opacity-90">{a.description} · stima dal consenso delle fonti</p>
          </div>
        </div>
      ))}
    </section>
  );
}
