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

    // Add markers if provided
    if (config.markers && config.markers.length > 0) {
      config.markers.forEach((marker) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = marker.color || 'hsl(15, 85%, 60%)'; // Theme orange
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid hsl(220, 85%, 25%)'; // Theme navy
        el.style.boxShadow = '0 4px 12px hsla(220, 85%, 25%, 0.4)';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s ease';

        const popup = new mapboxgl.Popup({ 
          offset: 30,
          className: 'custom-popup'
        }).setHTML(
          `<div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 8px;
            border-radius: 6px;
          ">
            <h3 style="
              font-weight: 600; 
              margin: 0 0 8px 0; 
              color: hsl(220, 85%, 25%);
              font-size: 16px;
            ">${marker.title}</h3>
            ${marker.description ? `<p style="
              margin: 0; 
              font-size: 14px; 
              color: hsl(220, 20%, 50%);
              line-height: 1.4;
            ">${marker.description}</p>` : ''}
          </div>`
        );

        new mapboxgl.Marker(el)
          .setLngLat(marker.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
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