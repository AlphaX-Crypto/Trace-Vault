import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationSignalItem } from './geoTypes';

export interface GeospatialMapProps {
  signals: LocationSignalItem[];
  selectedSignalId?: string;
  onSelectSignal: (signalId: string) => void;
  filteredRail?: string;
  filteredSignalType?: string;
  height?: number | string;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({
  signals,
  selectedSignalId,
  onSelectSignal,
  filteredRail = 'All',
  filteredSignalType = 'All',
  height = 560
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(5);

  // Filter signals based on props
  const visibleSignals = signals.filter((s) => {
    if (filteredRail !== 'All' && s.rail !== filteredRail) return false;
    if (filteredSignalType !== 'All' && s.signalType !== filteredSignalType) return false;
    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Default center on India
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // ESRI World Dark Gray Base & Reference layers (official, watermark-free professional GIS cartography)
    L.tileLayer(
      'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
      }
    ).addTo(map);

    L.tileLayer(
      'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        opacity: 0.85
      }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapRef.current = map;

    const handleZoom = () => {
      if (mapRef.current) {
        setZoomLevel(mapRef.current.getZoom());
      }
    };

    map.on('zoomend', handleZoom);

    // Initial resize trigger to ensure tiles tile properly
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.off('zoomend', handleZoom);
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Markers & Layers when visible signals or selected signal change
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();

    const getPinColor = (type: string, isAnomaly: boolean) => {
      if (isAnomaly) return '#ef4444';
      switch (type) {
        case 'MERCHANT_LOCATION':
          return '#f59e0b';
        case 'TERMINAL_LOCATION':
          return '#a855f7';
        case 'HISTORICAL_BASELINE':
          return '#38bdf8';
        case 'TRANSACTION_LOCATION':
        default:
          return '#2dd4bf';
      }
    };

    // 1. Plot signals
    visibleSignals.forEach((signal) => {
      const isSelected = signal.id === selectedSignalId;
      const isAnomaly = !!signal.isAnomaly;
      const pinColor = getPinColor(signal.signalType, isAnomaly);

      const html = `
        <div class="geo-marker-pin ${isSelected ? 'marker-selected' : ''} ${isAnomaly ? 'marker-anomaly' : ''}" style="--marker-color: ${pinColor}">
          <div class="marker-core"></div>
          <div class="marker-badge font-mono">${signal.relatedTransactionId || signal.id}</div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'geo-leaflet-marker-wrap',
        html,
        iconSize: [120, 28],
        iconAnchor: [8, 14]
      });

      const marker = L.marker([signal.latitude, signal.longitude], { icon });
      marker.on('click', () => {
        onSelectSignal(signal.id);
      });
      marker.addTo(lg);

      // Accuracy halo for selected or anomalous signals
      if (isSelected || isAnomaly) {
        const accuracy = signal.accuracyMeters ?? 40;
        L.circle([signal.latitude, signal.longitude], {
          radius: Math.max(accuracy * 800, 35000),
          color: isAnomaly ? '#ef4444' : '#2dd4bf',
          fillColor: isAnomaly ? '#ef4444' : '#2dd4bf',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(lg);
      }
    });

    // 2. Location Inconsistency Vector: Bengaluru (GEO-SIG-001) to Mumbai (GEO-SIG-003)
    const sigBlr = visibleSignals.find((s) => s.id === 'GEO-SIG-001' || s.city.includes('Bengaluru'));
    const sigMum = visibleSignals.find((s) => s.id === 'GEO-SIG-003' || s.city.includes('Mumbai'));

    if (sigBlr && sigMum) {
      L.polyline(
        [
          [sigBlr.latitude, sigBlr.longitude],
          [sigMum.latitude, sigMum.longitude]
        ],
        {
          color: '#ef4444',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.85
        }
      ).addTo(lg);

      // Midpoint Speed Telemetry Badge
      const midLat = (sigBlr.latitude + sigMum.latitude) / 2;
      const midLon = (sigBlr.longitude + sigMum.longitude) / 2;

      const badgeHtml = `
        <div class="geo-speed-badge font-mono">
          ~840 km in 3m 48s • Inconsistency
        </div>
      `;

      const badgeIcon = L.divIcon({
        className: 'geo-speed-badge-wrap',
        html: badgeHtml,
        iconSize: [240, 24],
        iconAnchor: [120, 12]
      });

      L.marker([midLat, midLon], { icon: badgeIcon, interactive: false }).addTo(lg);
    }

    // 3. Intra-City Transit in Bengaluru (GEO-SIG-001 to GEO-SIG-002)
    const b1 = visibleSignals.find((s) => s.id === 'GEO-SIG-001');
    const b2 = visibleSignals.find((s) => s.id === 'GEO-SIG-002');
    if (b1 && b2) {
      L.polyline(
        [
          [b1.latitude, b1.longitude],
          [b2.latitude, b2.longitude]
        ],
        {
          color: '#2dd4bf',
          weight: 1.5,
          dashArray: '3, 3',
          opacity: 0.6
        }
      ).addTo(lg);
    }
  }, [visibleSignals, selectedSignalId, onSelectSignal]);

  // Smooth Pan when selected signal changes
  useEffect(() => {
    if (!mapRef.current || !selectedSignalId) return;
    const target = signals.find((s) => s.id === selectedSignalId);
    if (target) {
      mapRef.current.panTo([target.latitude, target.longitude], { animate: true, duration: 0.6 });
    }
  }, [selectedSignalId, signals]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.setView([20.5937, 78.9629], 5, { animate: true });
  };

  const heightStr = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="geospatial-map-container" style={{ height: heightStr, minHeight: heightStr }}>
      {/* Top Map Bar with Controls & Provenance Tag */}
      <div className="map-overlay-header">
        <div className="map-badge-group">
          <span className="map-tag font-mono">AUTHORIZED CARTOGRAPHY</span>
          <span className="demo-data-badge font-mono">DEMO / SYNTHETIC DATA</span>
        </div>

        <div className="map-controls-group">
          <button type="button" onClick={handleZoomIn} className="btn-map-control" title="Zoom In">
            +
          </button>
          <button type="button" onClick={handleZoomOut} className="btn-map-control" title="Zoom Out">
            −
          </button>
          <button type="button" onClick={handleReset} className="btn-map-control" title="Reset View">
            ⟲
          </button>
          <span className="zoom-level-label font-mono">Z{zoomLevel}</span>
        </div>
      </div>

      {/* Real Interactive Leaflet Map Div */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" style={{ width: '100%', height: heightStr }} />

      {/* Map Legend Dock */}
      <div className="map-legend-dock font-sans">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#2dd4bf' }} />
          <span>Transaction Location</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }} />
          <span>Merchant Location</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#a855f7' }} />
          <span>Terminal / ATM</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#38bdf8' }} />
          <span>Historical Baseline</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }} />
          <span>Location Inconsistency Vector</span>
        </div>
      </div>

      <style>{`
        .geospatial-map-container {
          position: relative;
          width: 100%;
          background: #0d1017;
          border-radius: 8px;
          overflow: hidden;
        }

        .leaflet-map-canvas {
          width: 100%;
          background: #0d1017 !important;
          z-index: 1;
        }

        .leaflet-container {
          background: #0d1017 !important;
          font-family: inherit;
        }

        .map-overlay-header {
          position: absolute;
          top: 14px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 500;
          pointer-events: none;
        }

        .map-badge-group {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .map-tag {
          font-size: 10px;
          color: #24c7c9;
          background: rgba(15, 19, 26, 0.94);
          border: 1px solid rgba(36, 199, 201, 0.35);
          padding: 4px 9px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .demo-data-badge {
          font-size: 10px;
          color: #f59e0b;
          background: rgba(15, 19, 26, 0.94);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 4px 9px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          font-weight: 600;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .map-controls-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 19, 26, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 4px 7px;
          pointer-events: auto;
          backdrop-filter: blur(6px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .btn-map-control {
          background: #171d26;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-map-control:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
          background: #1d2430;
        }

        .zoom-level-label {
          font-size: 10.5px;
          color: #64748b;
          padding: 0 5px;
        }

        .map-legend-dock {
          position: absolute;
          bottom: 14px;
          left: 16px;
          background: rgba(15, 19, 26, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 7px 14px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 500;
          font-size: 11px;
          color: #94a3b8;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        /* Leaflet Custom Marker & Badge Styles */
        .geo-leaflet-marker-wrap {
          background: transparent !important;
          border: none !important;
        }

        .geo-marker-pin {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease;
        }

        .geo-marker-pin:hover {
          transform: scale(1.08);
        }

        .marker-core {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--marker-color, #2dd4bf);
          box-shadow: 0 0 10px var(--marker-color, #2dd4bf);
          border: 2px solid #0d1017;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .marker-badge {
          background: rgba(13, 16, 23, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #e2e8f0;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.2px;
        }

        .marker-selected .marker-core {
          width: 15px;
          height: 15px;
          box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.3), 0 0 14px #2dd4bf;
        }

        .marker-selected .marker-badge {
          border-color: #2dd4bf;
          color: #2dd4bf;
          background: rgba(13, 16, 23, 0.98);
        }

        .marker-anomaly .marker-core {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 14px #ef4444;
        }

        .marker-anomaly .marker-badge {
          border-color: #ef4444;
          color: #f87171;
        }

        .geo-speed-badge-wrap {
          background: transparent !important;
          border: none !important;
        }

        .geo-speed-badge {
          background: rgba(19, 23, 30, 0.96);
          border: 1px solid #ef4444;
          color: #f87171;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 4px;
          text-align: center;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
          letter-spacing: 0.3px;
        }
      `}</style>
    </div>
  );
};
