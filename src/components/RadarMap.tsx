import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { fetchRadarFrames, formatSpan, radarAge, type RadarFrame } from '../api/rainviewer';
import { useTheme, type Theme } from '../state/theme';

/** RainViewer pubblica un nuovo frame ogni 10 minuti. */
const RADAR_REFRESH_MS = 10 * 60 * 1000;

/** CARTO ora richiede una API key: le basemap Esri Gray Canvas sono senza chiave, in versione scura e chiara. */
const esriUrl = (theme: Theme, layer: 'Base' | 'Reference') =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${theme === 'light' ? 'Light' : 'Dark'}_Gray_${layer}/MapServer/tile/{z}/{y}/{x}`;

interface Props { lat: number; lon: number }

export function RadarMap({ lat, lon }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const layersRef = useRef<L.TileLayer[]>([]);
  const baseRef = useRef<L.TileLayer | null>(null);
  const labelsRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [pastCount, setPastCount] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, maxZoom: 12 }).setView([lat, lon], 7);
    baseRef.current = L.tileLayer(esriUrl(theme, 'Base'), {
      attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap', maxNativeZoom: 16, maxZoom: 12,
    }).addTo(map);
    // etichette sopra il radar, così i nomi delle città restano leggibili
    map.createPane('labels').style.zIndex = '450';
    map.getPane('labels')!.style.pointerEvents = 'none';
    labelsRef.current = L.tileLayer(esriUrl(theme, 'Reference'), {
      pane: 'labels', maxNativeZoom: 16, maxZoom: 12,
    }).addTo(map);
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 7, color: '#e0f2fe', weight: 2, fillColor: '#0ea5e9', fillOpacity: 0.9,
    }).addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; layersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    baseRef.current?.setUrl(esriUrl(theme, 'Base'));
    labelsRef.current?.setUrl(esriUrl(theme, 'Reference'));
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const load = () => fetchRadarFrames()
      .then(({ host, frames, pastCount }) => {
        const map = mapRef.current;
        if (cancelled || !map) return;
        layersRef.current.forEach(l => l.remove());
        layersRef.current = frames.map(f =>
          // RainViewer serve le tile solo fino a zoom 7: oltre Leaflet ingrandisce quelle
          L.tileLayer(`${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0, maxNativeZoom: 7, maxZoom: 12 }).addTo(map));
        setFrames(frames);
        setPastCount(pastCount);
        setFrameIdx(Math.max(0, pastCount - 1));
        setError(false);
      })
      // se fallisce un aggiornamento restano i frame già caricati
      .catch(() => { if (!cancelled && layersRef.current.length === 0) setError(true); });
    void load();
    const refresh = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, RADAR_REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => { cancelled = true; clearInterval(refresh); clearInterval(tick); };
  }, []);

  useEffect(() => {
    mapRef.current?.setView([lat, lon]);
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  useEffect(() => {
    layersRef.current.forEach((l, i) => l.setOpacity(i === frameIdx ? 0.75 : 0));
  }, [frameIdx, frames]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => setFrameIdx(i => (i + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  useEffect(() => {
    // dopo il cambio di dimensioni il container va rimisurato
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [expanded]);

  const frame = frames[frameIdx];
  const frameLabel = frame
    ? new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(frame.time * 1000))
    : '…';
  const latest = pastCount > 0 ? frames[pastCount - 1] : undefined;
  const age = latest ? radarAge(latest.time, now) : null;

  return (
    <section className={expanded ? 'fixed inset-0 z-50 bg-slate-950 p-3 flex flex-col gap-2' : 'panel'}>
      <div className="flex items-center justify-between">
        <p className="panel-title !mb-0">
          Radar precipitazioni · {error ? 'non disponibile' : frameLabel}
          {age && !error && (
            <span className={age.stale ? 'text-amber-400' : 'text-slate-500'}>
              {' · '}ultimo dato {age.label}{age.stale && ' (in ritardo)'}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {!error && (
            <button
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? 'Pausa' : 'Riproduci'}
              className="px-2 py-1 rounded border border-slate-700 text-xs hover:border-sky-500"
            >
              {playing ? '⏸' : '▶'}
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Chiudi radar' : 'Espandi radar'}
            className="px-2 py-1 rounded border border-slate-700 text-xs hover:border-sky-500"
          >
            {expanded ? '✕' : '⛶'}
          </button>
        </div>
      </div>
      <div className={expanded ? 'relative flex-1' : 'relative h-64'}>
        <div ref={containerRef} className="absolute inset-0 rounded-lg" />
        {!expanded && !error && (
          <button
            aria-label="Espandi radar a schermo pieno"
            className="absolute inset-0 z-[400] cursor-zoom-in"
            onClick={() => setExpanded(true)}
          />
        )}
        {error && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            Radar momentaneamente non disponibile
          </p>
        )}
      </div>
      {!error && frames.length > 0 && (
        <div className="pt-2">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            step={1}
            value={frameIdx}
            aria-label="Timeline radar: trascina per muoverti tra i frame"
            onChange={e => { setPlaying(false); setFrameIdx(Number(e.target.value)); }}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-wider">
            <span>{latest ? formatSpan(latest.time - frames[0].time) : ''}</span>
            <span>{frameIdx < pastCount ? 'osservato' : 'previsione'}</span>
            <span>{frames.length > pastCount ? '+30min' : 'ora'}</span>
          </div>
        </div>
      )}
    </section>
  );
}
