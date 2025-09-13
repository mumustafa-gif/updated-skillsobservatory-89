import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface MapChartProps {
  config: {
    title: {
      text: string;
      subtext?: string;
    };
    mapStyle?: string;
    center?: [number, number];
    zoom?: number;
    markers?: Array<{
      coordinates: [number, number];
      title: string;
      description?: string;
      color?: string;
    }>;
    heatmapData?: Array<{
      coordinates: [number, number];
      weight: number;
    }>;
    geoJsonData?: any;
  };
  loading?: boolean;
}

const MapChart: React.FC<MapChartProps> = ({ config, loading = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Coordinate validation function
  const validateCoordinates = (coordinates: [number, number]): boolean => {
    const [lng, lat] = coordinates;
    // UAE bounds: longitude 51.0-56.4, latitude 22.5-26.1
    return lng >= 51.0 && lng <= 56.4 && lat >= 22.5 && lat <= 26.1;
  };
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          setTokenError('Failed to get Mapbox token');
          console.error('Mapbox token error:', error);
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setTokenError('No Mapbox token found');
        }
      } catch (err) {
        setTokenError('Failed to fetch Mapbox token');
        console.error('Error fetching Mapbox token:', err);
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || loading || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.mapStyle || 'mapbox://styles/mapbox/outdoors-v12', // Force colorful outdoor terrain style
      center: config.center || [54.3773, 24.4539], // UAE center
      zoom: config.zoom || 6,
      projection: 'mercator',
    });

    console.log('MapChart initialized with style:', config.mapStyle || 'mapbox://styles/mapbox/outdoors-v12');

    // Add map style controls for user interaction
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add style switcher for different visual modes
    const styleOptions = [
      { name: 'Terrain', style: 'mapbox://styles/mapbox/outdoors-v12' },
      { name: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
      { name: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
    ];

    // Create style switcher if not already added
    if (map.current && !document.querySelector('.mapboxgl-ctrl-group .style-switcher')) {
      const styleControl = document.createElement('div');
      styleControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group style-switcher';
      styleControl.innerHTML = `
        <select style="
          background: white; 
          border: none; 
          padding: 6px; 
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
        ">
          ${styleOptions.map(option => 
            `<option value="${option.style}">${option.name}</option>`
          ).join('')}
        </select>
      `;
      
      const select = styleControl.querySelector('select');
      if (select) {
        select.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;
          map.current?.setStyle(target.value);
        });
      }
      
      document.querySelector('.mapboxgl-ctrl-top-right')?.appendChild(styleControl);
    }

    // Add CSS for pulse animation and marker positioning
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8);
        }
        50% {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(255, 255, 255, 0.6);
        }
        100% {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8);
        }
      }
      
      .mapboxgl-marker {
        transition: box-shadow 0.2s ease, opacity 0.2s ease !important;
      }
      
      .mapboxgl-popup-content {
        border-radius: 12px !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        z-index: 10000 !important;
      }
      
      .mapboxgl-popup {
        z-index: 10000 !important;
      }
      
      .mapboxgl-popup-tip {
        border-top-color: rgba(255, 255, 255, 0.9) !important;
        z-index: 10000 !important;
      }
      
      .mapboxgl-popup-close-button {
        width: 20px !important;
        height: 20px !important;
        font-size: 14px !important;
        font-weight: bold !important;
        color: #666 !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        top: 6px !important;
        right: 6px !important;
      }
      
      .mapboxgl-popup-close-button:hover {
        background: rgba(255, 255, 255, 1) !important;
        color: #333 !important;
        border-color: rgba(0, 0, 0, 0.2) !important;
        transform: scale(1.1) !important;
      }
    `;
    document.head.appendChild(pulseStyle);

    // Add markers if provided
    if (config.markers && config.markers.length > 0) {
      config.markers.forEach((marker, index) => {
        // Validate coordinates
        if (!validateCoordinates(marker.coordinates)) {
          console.warn(`Invalid coordinates for marker ${marker.title}:`, marker.coordinates);
          return; // Skip invalid markers
        }
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = marker.color || 'hsl(15, 85%, 60%)';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.border = '4px solid white';
        el.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8)';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.3s ease';
        el.style.position = 'relative';
        el.style.zIndex = '1000';

        // Add pulse animation
        el.style.animation = 'pulse 2s infinite';

        // Add hover effects that don't change marker position
        el.addEventListener('mouseenter', () => {
          el.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.9)';
          el.style.zIndex = '1001';
          el.style.opacity = '0.9';
        });

        el.addEventListener('mouseleave', () => {
          el.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8)';
          el.style.zIndex = '1000';
          el.style.opacity = '1';
        });

        // Compact popup with better fit
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          className: 'custom-popup',
          closeButton: true,
          closeOnClick: false,
          maxWidth: '280px'
        }).setHTML(
          `<div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(0, 0, 0, 0.1);
            position: relative;
          ">
            <div style="
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 2px solid ${marker.color || 'hsl(15, 85%, 60%)'};
            ">
              <div style="
                width: 10px;
                height: 10px;
                background-color: ${marker.color || 'hsl(15, 85%, 60%)'};
                border-radius: 50%;
                margin-right: 8px;
              "></div>
              <h3 style="
                font-weight: 700; 
                margin: 0; 
                color: hsl(220, 85%, 25%);
                font-size: 16px;
                letter-spacing: -0.025em;
              ">${marker.title}</h3>
            </div>
            ${marker.description ? `<div style="
              margin: 0 0 10px 0; 
              font-size: 13px; 
              color: hsl(220, 20%, 40%);
              line-height: 1.4;
              font-weight: 400;
            ">${marker.description}</div>` : ''}
            <div style="
              background: linear-gradient(135deg, ${marker.color || 'hsl(15, 85%, 60%)'}15, ${marker.color || 'hsl(15, 85%, 60%)'}08);
              padding: 8px;
              border-radius: 6px;
              border-left: 3px solid ${marker.color || 'hsl(15, 85%, 60%)'};
              margin-bottom: 8px;
            ">
              <div style="
                font-size: 11px;
                color: hsl(220, 20%, 50%);
                font-weight: 500;
                margin-bottom: 2px;
              ">📍 ${marker.coordinates[0].toFixed(3)}, ${marker.coordinates[1].toFixed(3)}</div>
            </div>
          </div>`
        );

        const markerElement = new mapboxgl.Marker(el)
          .setLngLat(marker.coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        // Handle popup events to manage marker layering
        popup.on('open', () => {
          // Dim other markers when this popup opens
          const allMarkers = document.querySelectorAll('.mapboxgl-marker');
          allMarkers.forEach(m => {
            if (m !== el) {
              (m as HTMLElement).style.opacity = '0.6';
              (m as HTMLElement).style.zIndex = '100';
            }
          });
          // Ensure current marker is on top
          el.style.zIndex = '1000';
        });

        popup.on('close', () => {
          // Restore all markers when popup closes
          const allMarkers = document.querySelectorAll('.mapboxgl-marker');
          allMarkers.forEach(m => {
            (m as HTMLElement).style.opacity = '1';
            (m as HTMLElement).style.zIndex = '500';
          });
        });
      });
    }

    // Add GeoJSON data if provided
    if (config.geoJsonData) {
      map.current.on('load', () => {
        map.current!.addSource('geojson-data', {
          type: 'geojson',
          data: config.geoJsonData
        });

        // Add choropleth visualization with theme colors
        map.current!.addLayer({
          id: 'geojson-fill',
          type: 'fill',
          source: 'geojson-data',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'value', ['get', 'properties']],
              0, 'hsl(220, 15%, 96%)',  // Light gray for low values
              25, 'hsl(200, 70%, 75%)', // Light blue
              50, 'hsl(200, 70%, 45%)', // Medium blue
              75, 'hsl(220, 85%, 45%)', // Navy blue
              100, 'hsl(220, 85%, 25%)' // Dark navy for high values
            ],
            'fill-opacity': 0.8
          }
        });

        // Add border layer for better definition
        map.current!.addLayer({
          id: 'geojson-border',
          type: 'line',
          source: 'geojson-data',
          paint: {
            'line-color': 'hsl(220, 85%, 25%)',
            'line-width': 2,
            'line-opacity': 0.9
          }
        });
      });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [config, loading, mapboxToken]);

  if (loading) {
    return (
      <Card className="h-[500px]">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{config.title.text}</span>
        </CardTitle>
        {config.title.subtext && (
          <p className="text-sm text-muted-foreground">{config.title.subtext}</p>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div 
          ref={mapContainer} 
          className="w-full h-[500px] rounded-lg overflow-hidden"
          style={{ minHeight: '500px' }}
        />
        
        {/* Token status message */}
        {tokenError ? (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Configuration Required:</strong> {tokenError}
              <br />
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 underline"
              >
                Get your Mapbox token here
              </a> and add it to your Supabase Edge Function Secrets.
            </p>
          </div>
        ) : !mapboxToken ? (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Loading map configuration...
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MapChart;