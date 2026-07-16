import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { fetchRadarFrames, type RadarFrame } from '../api/rainviewer';

interface Props { lat: number; lon: number }

export function RadarMap({ lat, lon }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const layersRef = useRef<L.TileLayer[]>([]);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([lat, lon], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 12,
    }).addTo(map);
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 7, color: '#e0f2fe', weight: 2, fillColor: '#0ea5e9', fillOpacity: 0.9,
    }).addTo(map);
    mapRef.current = map;

    fetchRadarFrames()
      .then(({ host, frames, pastCount }) => {
        if (cancelled) return;
        layersRef.current = frames.map(f =>
          L.tileLayer(`${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0, maxZoom: 12 }).addTo(map));
        setFrames(frames);
        setFrameIdx(Math.max(0, pastCount - 1));
      })
      .catch(() => { if (!cancelled) setError(true); });

    return () => { cancelled = true; map.remove(); mapRef.current = null; markerRef.current = null; layersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <section className={expanded ? 'fixed inset-0 z-50 bg-slate-950 p-3 flex flex-col gap-2' : 'panel'}>
      <div className="flex items-center justify-between">
        <p className="panel-title !mb-0">Radar precipitazioni · {error ? 'non disponibile' : frameLabel}</p>
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
    </section>
  );
}
