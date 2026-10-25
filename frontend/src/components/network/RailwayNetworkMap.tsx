'use client';

import React, { useState } from 'react';
import { Train } from 'lucide-react';

interface StationNode {
  code: string;
  name: string;
  x: number;
  y: number;
  labelPosition: 'top' | 'right' | 'bottom' | 'left';
  type: 'hub' | 'junction' | 'terminal';
  status: 'active' | 'delayed' | 'disrupted';
  corridor: string;
  details: string;
  services: string[];
}

const SCHEMATIC_STATIONS: StationNode[] = [
  {
    code: 'NDLS',
    name: 'New Delhi',
    x: 320,
    y: 70,
    labelPosition: 'top',
    type: 'hub',
    status: 'active',
    corridor: 'Northern Hub',
    details: 'Primary national operations terminus. Interlocks Northern, Western & Eastern trunks.',
    services: ['12301 Howrah Rajdhani', '12951 Mumbai Tejas', '12002 Bhopal Shatabdi', '12626 Kerala Express', '22692 SBC Rajdhani'],
  },
  {
    code: 'CNB',
    name: 'Kanpur Central',
    x: 430,
    y: 135,
    labelPosition: 'top',
    type: 'junction',
    status: 'disrupted',
    corridor: 'Eastern Trunk (Train 12301)',
    details: 'Signal Malfunction C-01 Active (+45m). Manual pilot caution orders in force.',
    services: ['12301 Howrah Rajdhani'],
  },
  {
    code: 'PRYJ',
    name: 'Prayagraj Jn',
    x: 510,
    y: 180,
    labelPosition: 'bottom',
    type: 'junction',
    status: 'delayed',
    corridor: 'Eastern Trunk (Train 12301)',
    details: 'Downstream headway cascade advisory (+35m delay propagation from CNB block).',
    services: ['12301 Howrah Rajdhani'],
  },
  {
    code: 'HWH',
    name: 'Howrah Junction',
    x: 600,
    y: 220,
    labelPosition: 'right',
    type: 'terminal',
    status: 'active',
    corridor: 'Eastern Trunk Terminal',
    details: 'Eastern corridor terminal. 23 platforms operating nominal turnaround scheduling.',
    services: ['12301 Howrah Rajdhani'],
  },
  {
    code: 'MMCT',
    name: 'Mumbai Central',
    x: 160,
    y: 240,
    labelPosition: 'left',
    type: 'terminal',
    status: 'active',
    corridor: 'Western Trunk Terminal',
    details: 'Western terminus for Train 12951 Tejas Rajdhani. On-time corridor clearance.',
    services: ['12951 Mumbai Tejas Rajdhani'],
  },
  {
    code: 'BPL',
    name: 'Bhopal Jn',
    x: 320,
    y: 210,
    labelPosition: 'left',
    type: 'hub',
    status: 'active',
    corridor: 'Central Trunk Junction',
    details: 'Central interlock junction connecting Grand Trunk, Shatabdi, and Western corridors.',
    services: ['12002 Bhopal Shatabdi', '12626 Kerala Express', '22692 SBC Rajdhani', '12951 Mumbai Tejas'],
  },
  {
    code: 'MAS',
    name: 'Chennai Central',
    x: 410,
    y: 310,
    labelPosition: 'right',
    type: 'hub',
    status: 'active',
    corridor: 'Southern Trunk Hub',
    details: 'Grand Trunk southern hub. Normal headway on Grand Trunk route 12626.',
    services: ['12626 Kerala Express', '22692 SBC Rajdhani'],
  },
  {
    code: 'SBC',
    name: 'Bengaluru City',
    x: 320,
    y: 370,
    labelPosition: 'left',
    type: 'terminal',
    status: 'active',
    corridor: 'South Western Terminal',
    details: 'South Western division terminus for Train 22692 Bengaluru Rajdhani.',
    services: ['22692 SBC Rajdhani'],
  },
  {
    code: 'TVC',
    name: 'Thiruvananthapuram',
    x: 270,
    y: 430,
    labelPosition: 'bottom',
    type: 'terminal',
    status: 'active',
    corridor: 'Southernmost Corridor End',
    details: 'Terminal point for Train 12626 Kerala Express. End-of-line rake inspection bay.',
    services: ['12626 Kerala Express'],
  },
];

export function RailwayNetworkMap({ className = '' }: { className?: string }) {
  const [selectedStation, setSelectedStation] = useState<StationNode | null>(null);

  return (
    <div className={`relative flex flex-col rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm transition-colors ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
            <h3 className="font-display font-extrabold text-base tracking-wide text-[#242521] dark:text-[#F0E9DC] uppercase">
              Corridor Route Schematic
            </h3>
            <span className="rounded font-mono text-[9px] font-bold px-1.5 py-0.5 border border-[#E9663B]/30 bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D]">
              ILLUSTRATIVE SCHEMATIC • DEMO DATA
            </span>
          </div>
          <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
            Schematic topology of active simulation corridors and mock station headway
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#5E6059] dark:text-[#A39F93]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
            Active Trunk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C57613] dark:bg-[#E6962C]" />
            Cascade Delay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C83C2A] dark:bg-[#F45846]" />
            Disrupted Block
          </span>
        </div>
      </div>

      {/* Schematic Canvas Container */}
      <div className="relative w-full h-[340px] sm:h-[380px] flex items-center justify-center overflow-hidden rounded-xl bg-[#F4F0E7]/60 dark:bg-[#171815]/60 border border-[#E6DFD3] dark:border-[#272823]">
        {/* Schematic Technical Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="schematic-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[#D9D0C1] dark:text-[#353731]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#schematic-grid)" />
        </svg>

        {/* Route Diagram Vector */}
        <svg
          viewBox="100 30 550 430"
          className="w-full h-full max-h-[380px] select-none p-2"
          role="img"
          aria-label="Schematic diagram of active railway corridors"
        >
          {/* TRACK LINES */}

          {/* 1. Eastern Trunk: NDLS (320,70) -> CNB (430,135) -> PRYJ (510,180) -> HWH (600,220) */}
          <path
            d="M 320 70 L 430 135 L 510 180 L 600 220"
            fill="none"
            stroke="#C83C2A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-[#F45846] opacity-90"
          />
          {/* Inner track tie markings */}
          <path
            d="M 320 70 L 430 135 L 510 180 L 600 220"
            fill="none"
            stroke="#FAF8F4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="dark:stroke-[#242521]"
          />

          {/* 2. Central Spine: NDLS (320,70) -> BPL (320,210) */}
          <path
            d="M 320 70 L 320 210"
            fill="none"
            stroke="#4A685F"
            strokeWidth="4"
            strokeLinecap="round"
            className="dark:stroke-[#88A69A]"
          />
          <path
            d="M 320 70 L 320 210"
            fill="none"
            stroke="#FAF8F4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="dark:stroke-[#242521]"
          />

          {/* 3. Western Trunk: NDLS (320,70) -> BPL (320,210) -> MMCT (160,240) */}
          <path
            d="M 320 210 L 160 240"
            fill="none"
            stroke="#4A685F"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-[#88A69A]"
          />

          {/* 4. Southern Trunk: BPL (320,210) -> MAS (410,310) -> SBC (320,370) -> TVC (270,430) */}
          <path
            d="M 320 210 L 410 310 L 320 370 L 270 430"
            fill="none"
            stroke="#4A685F"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-[#88A69A]"
          />
          <path
            d="M 320 210 L 410 310 L 320 370 L 270 430"
            fill="none"
            stroke="#FAF8F4"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="dark:stroke-[#242521]"
          />

          {/* Corridor Track Labels */}
          <text x="515" y="145" className="fill-[#C83C2A] dark:fill-[#F45846] font-mono text-[9px] font-bold select-none">
            Eastern Trunk (12301)
          </text>
          <text x="145" y="215" className="fill-[#4A685F] dark:fill-[#88A69A] font-mono text-[9px] font-bold select-none">
            Western Trunk (12951)
          </text>
          <text x="385" y="380" className="fill-[#4A685F] dark:fill-[#88A69A] font-mono text-[9px] font-bold select-none">
            Southern Trunk (12626 / 22692)
          </text>

          {/* Simulated Train Marker on Eastern Line (Near Kanpur Disruption C-01) */}
          <g className="transition-all duration-300">
            <circle
              cx="430"
              cy="135"
              r="14"
              className="fill-[#C83C2A]/15 dark:fill-[#F45846]/20 animate-pulse motion-reduce:animate-none"
            />
            <rect
              x="422"
              y="127"
              width="16"
              height="16"
              rx="4"
              className="fill-[#C83C2A] dark:fill-[#F45846] stroke-2 stroke-white dark:stroke-[#171815]"
            />
            <text x="430" y="138" textAnchor="middle" className="fill-white font-mono text-[8px] font-bold select-none">
              12301
            </text>
          </g>

          {/* Simulated Train Marker on Western Trunk (Train 12951) */}
          <g>
            <rect
              x="232"
              y="220"
              width="14"
              height="14"
              rx="3"
              className="fill-[#4A685F] dark:fill-[#88A69A] stroke-2 stroke-white dark:stroke-[#171815]"
            />
            <text x="239" y="230" textAnchor="middle" className="fill-white font-mono text-[7px] font-bold select-none">
              12951
            </text>
          </g>

          {/* STATION NODES */}
          {SCHEMATIC_STATIONS.map((station) => {
            const isSelected = selectedStation?.code === station.code;
            const isDisrupted = station.status === 'disrupted';
            const isDelayed = station.status === 'delayed';

            const nodeFill = isDisrupted
              ? '#C83C2A'
              : isDelayed
              ? '#C57613'
              : '#242521';

            // Calculate label position coordinates
            let labelX = station.x;
            let labelY = station.y;
            let textAnchor: 'start' | 'middle' | 'end' = 'start';

            if (station.labelPosition === 'top') {
              labelY = station.y - 12;
              textAnchor = 'middle';
            } else if (station.labelPosition === 'bottom') {
              labelY = station.y + 18;
              textAnchor = 'middle';
            } else if (station.labelPosition === 'right') {
              labelX = station.x + 12;
              labelY = station.y + 4;
              textAnchor = 'start';
            } else if (station.labelPosition === 'left') {
              labelX = station.x - 12;
              labelY = station.y + 4;
              textAnchor = 'end';
            }

            return (
              <g
                key={station.code}
                tabIndex={0}
                role="button"
                aria-label={`Station ${station.name} (${station.code}), status: ${station.status}`}
                className="cursor-pointer outline-none group"
                onMouseEnter={() => setSelectedStation(station)}
                onMouseLeave={() => setSelectedStation(null)}
                onClick={() => setSelectedStation(station)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedStation(station);
                  }
                }}
              >
                {/* Station Node Visual */}
                {station.type === 'hub' ? (
                  // Double Ring for Interlock Hubs
                  <>
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={isSelected ? 9 : 7.5}
                      fill="#FAF8F4"
                      className="dark:fill-[#242521] stroke-2 stroke-[#242521] dark:stroke-[#F0E9DC] transition-all"
                    />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r="4"
                      fill={nodeFill}
                      className={isDisrupted ? 'dark:fill-[#F45846]' : isDelayed ? 'dark:fill-[#E6962C]' : 'dark:fill-[#F0E9DC]'}
                    />
                  </>
                ) : station.type === 'terminal' ? (
                  // Square / Block Node for Terminals
                  <rect
                    x={station.x - 5}
                    y={station.y - 5}
                    width="10"
                    height="10"
                    rx="2"
                    fill={nodeFill}
                    stroke="#FAF8F4"
                    strokeWidth="2"
                    className="dark:stroke-[#242521] transition-all"
                  />
                ) : (
                  // Standard Station Node Circle
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={isSelected ? 6 : 4.5}
                    fill={nodeFill}
                    stroke="#FAF8F4"
                    strokeWidth="2"
                    className="dark:stroke-[#242521] transition-all"
                  />
                )}

                {/* Station Code Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  className={`font-mono text-[10px] font-bold select-none transition-colors ${
                    isSelected
                      ? 'fill-[#E9663B] dark:fill-[#F0784D] font-extrabold'
                      : isDisrupted
                      ? 'fill-[#C83C2A] dark:fill-[#F45846]'
                      : 'fill-[#242521] dark:fill-[#F0E9DC]'
                  }`}
                >
                  {station.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Click Station Dossier Tooltip */}
        {selectedStation && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/98 dark:bg-[#242521]/98 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-[#D9D0C1] dark:border-[#353731] pb-2">
              <div>
                <span className="font-display font-bold text-sm text-[#242521] dark:text-[#F0E9DC]">
                  {selectedStation.name}
                </span>
                <span className="ml-1 text-[11px] font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
                  [{selectedStation.code}]
                </span>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                  selectedStation.status === 'disrupted'
                    ? 'bg-[#C83C2A]/15 text-[#C83C2A] dark:text-[#F45846]'
                    : selectedStation.status === 'delayed'
                    ? 'bg-[#C57613]/15 text-[#C57613] dark:text-[#E6962C]'
                    : 'bg-[#4A685F]/15 text-[#4A685F] dark:text-[#88A69A]'
                }`}
              >
                {selectedStation.status}
              </span>
            </div>
            <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-2 font-sans leading-relaxed">
              {selectedStation.details}
            </p>
            <div className="mt-2 pt-2 border-t border-[#D9D0C1]/50 dark:border-[#353731]/50 text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">
              <span className="font-bold">Services:</span> {selectedStation.services.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Schematic Footer Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Train className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
          <span className="text-[#5E6059] dark:text-[#A39F93]">Simulated Rake Context:</span>
          <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">12301 Howrah Rajdhani</span>
        </div>
        <div className="text-[11px] text-[#8C887D] dark:text-[#726F65]">
          Simulated Headway: <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">15 min blocks</span> (Demo Data)
        </div>
      </div>
    </div>
  );
}
