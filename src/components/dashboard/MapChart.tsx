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
      style: config.mapStyle || 'mapbox://styles/mapbox/light-v11',
      center: config.center || [0, 0],
      zoom: config.zoom || 2,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add markers if provided
    if (config.markers && config.markers.length > 0) {
      config.markers.forEach((marker) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = marker.color || '#3b82f6';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div>
            <h3 style="font-weight: bold; margin: 0 0 8px 0;">${marker.title}</h3>
            ${marker.description ? `<p style="margin: 0; font-size: 14px;">${marker.description}</p>` : ''}
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

        map.current!.addLayer({
          id: 'geojson-layer',
          type: 'fill',
          source: 'geojson-data',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.6,
            'fill-outline-color': '#1e40af'
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