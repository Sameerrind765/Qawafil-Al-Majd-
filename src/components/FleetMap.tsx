import React, { useState } from 'react';
import { Vehicle } from '../types';
import { SAUDI_LOGISTICS_HUBS } from '../data';
import { MapPin, Truck, Radio, Compass, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  lang: 'en' | 'ar';
}

export default function FleetMap({ vehicles, selectedVehicle, onSelectVehicle, lang }: FleetMapProps) {
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);

  // Saudi Arabia coordinates boundaries representation for SVG mapping
  // Min Lat: 16.0, Max Lat: 32.5
  // Min Lng: 34.0, Max Lng: 56.0
  const latMin = 16.0;
  const latMax = 32.5;
  const lngMin = 34.0;
  const lngMax = 56.0;

  // Screen/SVG dimensions
  const mapWidth = 900;
  const mapHeight = 650;

  const getCoordinates = (lat: number, lng: number) => {
    // Mercator-like custom projection scale for Saudi bounds
    const x = ((lng - lngMin) / (lngMax - lngMin)) * mapWidth;
    // SVGs are inverted Y
    const y = mapHeight - ((lat - latMin) / (latMax - latMin)) * mapHeight + 50;
    return { x, y };
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 flex flex-col h-full select-none">
      {/* Top Map Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-sans text-xs text-slate-800 uppercase tracking-wider font-bold">
            {lang === 'en' ? 'Live Telemetry System' : 'الراصد الملاحي المباشر'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            {lang === 'en' ? 'Hubs' : 'المراكز'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-brand-primary inline-block" />
            {lang === 'en' ? 'Active Trucks' : 'الناقلات'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            {lang === 'en' ? 'Maintenance' : 'ورش فنية'}
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 min-h-[380px] bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
        {/* Abstract Saudi Arabia Map Background (Gulf Coast + Red Sea lines) */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 right-[8%] w-[350px] h-[350px] rounded-full border border-dashed border-slate-200" />
          <div className="absolute bottom-1/3 left-[15%] w-[450px] h-[450px] rounded-full border border-dashed border-slate-200" />
        </div>

        <svg
          viewBox={`20 20 ${mapWidth - 40} ${mapHeight - 65}`}
          className="w-full h-full max-h-[500px]"
        >
          {/* Main Transit Highways representing high-volume cargo supply routes */}
          {/* Loop over cities to lay custom highways for visualization */}
          <g stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,6" opacity="0.35">
            {/* Riyadh - Jeddah Lane */}
            <path d={`M 510, 360 C 450, 420 300, 480 215, 488`} />
            {/* Riyadh - Dammam Lane */}
            <path d="M 510, 360 L 650, 290" />
            {/* Jeddah - Mecca - Medina Lane */}
            <path d="M 215, 488 C 220, 500 240, 520 230, 488" />
            <path d="M 215, 488 L 210, 310" />
            {/* Riyadh - Jubail - Dammam */}
            <path d="M 510, 360 L 632, 260 L 650, 290" stroke="#3b82f6" strokeWidth="1" opacity="0.35" />
          </g>

          {/* Draw Saudi Logistics Hubs */}
          {SAUDI_LOGISTICS_HUBS.map((hub) => {
            const pos = getCoordinates(hub.lat, hub.lng);
            const isHovered = hoveredHub === hub.city;
            return (
              <g
                key={hub.city}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredHub(hub.city)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                {/* Visual ripple and highlight */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? 14 : 7}
                  className="fill-amber-500/10 stroke-amber-500/40"
                  strokeWidth={isHovered ? 2 : 1}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? 6 : 3.5}
                  className="fill-amber-500 stroke-white"
                  strokeWidth={1}
                />
                
                {/* Elegant City Name Tags */}
                <text
                  x={pos.x + 10}
                  y={pos.y + 4}
                  className="fill-slate-700 font-sans text-[11px] font-bold"
                >
                  {lang === 'en' ? hub.city : hub.arName}
                </text>
              </g>
            );
          })}

          {/* Draw Live Vehicles */}
          {vehicles.map((v) => {
            const pos = getCoordinates(v.location.lat, v.location.lng);
            const isSelected = selectedVehicle?.id === v.id;
            
            // Map statuses to distinctive Saudi visual theme colors
            let statusColor = 'fill-emerald-500 stroke-emerald-600';
            if (v.status === 'Maintenance') {
              statusColor = 'fill-rose-500 stroke-rose-600';
            } else if (v.status === 'In Transit') {
              statusColor = 'fill-blue-600 stroke-blue-700';
            } else if (v.status === 'Off Duty') {
              statusColor = 'fill-slate-400 stroke-slate-500';
            }

            return (
              <g
                key={v.id}
                className="cursor-pointer transition-transform duration-300 transform hover:scale-125"
                onClick={() => onSelectVehicle(v)}
              >
                {/* Active radar pulsed beacon */}
                {isSelected && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="22"
                      className="fill-none stroke-blue-500/50"
                      strokeWidth="1.5"
                    >
                      <animate
                        attributeName="r"
                        values="5;28;5"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="12"
                      className="fill-blue-500/10 stroke-blue-500"
                      strokeWidth="1"
                    />
                  </>
                )}

                {/* Truck marker representing the physical fleet vehicle on the ground */}
                <rect
                  x={pos.x - 7}
                  y={pos.y - 7}
                  width="14"
                  height="14"
                  rx="3"
                  className={`${statusColor} transition-colors duration-300`}
                  strokeWidth="1.5"
                />

                {/* Micro compass direction icon inside marker */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  className="fill-white"
                />

                {/* Label tag above marker for selected item */}
                {isSelected && (
                  <g>
                    <rect
                      x={pos.x - 45}
                      y={pos.y - 32}
                      width="90"
                      height="18"
                      rx="4"
                      className="fill-white stroke-blue-500 shadow-lg"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 19}
                      textAnchor="middle"
                      className="fill-blue-700 font-mono text-[9px] font-bold"
                    >
                      {v.id} | {v.fuelLevel}% ⛽
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected vehicle quick HUD (overlay) */}
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 bg-white/95 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-light border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800 font-mono">{selectedVehicle.id}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-100">
                    {selectedVehicle.plateNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  {selectedVehicle.driverName} • {selectedVehicle.driverPhone}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">{lang === 'en' ? 'Status' : 'الحالة'}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono ${
                  selectedVehicle.status === 'Available' ? 'text-emerald-600' :
                  selectedVehicle.status === 'In Transit' ? 'text-brand-primary' :
                  selectedVehicle.status === 'Maintenance' ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedVehicle.status === 'Available' ? 'bg-emerald-500' :
                    selectedVehicle.status === 'In Transit' ? 'bg-brand-light0' :
                    selectedVehicle.status === 'Maintenance' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  {selectedVehicle.status}
                </span>
              </div>

              <div className="text-right border-l border-slate-100 pl-4">
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">{lang === 'en' ? 'Fuel / Power' : 'مؤشر الوقود'}</span>
                <span className="text-xs font-bold text-brand-primary font-mono">{selectedVehicle.fuelLevel}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
