import React, { useEffect, useRef } from 'react';
import { Project, ProjectStage } from '../types';
import { FORMAT_CURRENCY } from '../constants';

// Define Leaflet types locally since we are loading via CDN
declare global {
  interface Window {
    L: any;
  }
}

interface ProjectMapProps {
  projects: Project[];
}

export const ProjectMap: React.FC<ProjectMapProps> = ({ projects }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Mock Geocoding logic (Simulating Lat/Lng based on City name for demo)
  // In a real app, this would use the Google Maps Geocoding API or store lat/lng in the DB
  const getCoordinates = (project: Project): [number, number] => {
    const city = project.city?.toLowerCase() || '';
    if (city.includes('london')) return [51.505, -0.09];
    if (city.includes('manchester')) return [53.4808, -2.2426];
    if (city.includes('southampton')) return [50.9097, -1.4044];
    if (city.includes('exeter')) return [50.7184, -3.5339];
    if (city.includes('birmingham')) return [52.4862, -1.8904];
    
    // Random offset for unknown locations to scatter them around the UK
    return [52.0 + (Math.random() * 2), -1.0 + (Math.random() * 2)];
  };

  const getStageColor = (stage: ProjectStage): string => {
    switch(stage) {
      case ProjectStage.ON_SITE: return '#22c55e'; // Green
      case ProjectStage.PRE_START: return '#a855f7'; // Purple
      case ProjectStage.NEGOTIATION: return '#eab308'; // Yellow
      case ProjectStage.CLOSING_OUT: return '#06b6d4'; // Cyan
      default: return '#64748b'; // Gray
    }
  };

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && window.L) {
      // Initialize Map
      mapRef.current = window.L.map(mapContainerRef.current).setView([52.5, -1.5], 6);

      // Add Tile Layer (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Custom Icon Creator
      const createCustomIcon = (color: string) => {
        return window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
      };

      // Add Markers
      projects.forEach(project => {
        const coords = getCoordinates(project);
        const color = getStageColor(project.stage);
        
        const marker = window.L.marker(coords, {
          icon: createCustomIcon(color)
        }).addTo(mapRef.current);

        const popupContent = `
          <div class="font-sans p-1">
            <h3 class="font-bold text-sm text-gray-900 mb-1">${project.name}</h3>
            <p class="text-xs text-gray-500 mb-1">${project.address}, ${project.city}</p>
            <div class="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                <span class="text-xs font-semibold" style="color: ${color}">${project.stage}</span>
                <span class="text-xs font-bold text-gray-900">${FORMAT_CURRENCY(project.contractValueP)}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [projects]);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white relative z-0">
        <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '500px' }} />
        
        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 z-[1000] text-xs">
            <h4 className="font-bold text-gray-700 mb-2">Project Status</h4>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>On Site</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Pre-Start</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Negotiation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span>Closing Out</span>
                </div>
            </div>
        </div>
    </div>
  );
};