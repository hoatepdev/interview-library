'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export interface ChartPalette {
  // Status colors
  statusNew: string;
  statusLearning: string;
  statusMastered: string;

  // Rating colors
  ratingPoor: string;
  ratingFair: string;
  ratingGood: string;
  ratingGreat: string;

  // Level colors
  levelJunior: string;
  levelMiddle: string;
  levelSenior: string;

  // Chart styling
  grid: string;
  text: string;
  textMuted: string;
  tooltipBg: string;
  tooltipBorder: string;
  areaFill: string;
  areaStroke: string;

  // General series colors
  series: string[];
}

const lightPalette: ChartPalette = {
  statusNew: '#94a3b8',
  statusLearning: '#3b82f6',
  statusMastered: '#22c55e',

  ratingPoor: '#ef4444',
  ratingFair: '#f97316',
  ratingGood: '#eab308',
  ratingGreat: '#22c55e',

  levelJunior: '#2dd4bf',
  levelMiddle: '#3b82f6',
  levelSenior: '#a855f7',

  grid: '#e2e8f0',
  text: '#475569',
  textMuted: '#94a3b8',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  areaFill: '#3b82f6',
  areaStroke: '#2563eb',

  series: ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#eab308'],
};

const darkPalette: ChartPalette = {
  statusNew: '#475569',
  statusLearning: '#38bdf8',
  statusMastered: '#4ade80',

  ratingPoor: '#f87171',
  ratingFair: '#fb923c',
  ratingGood: '#facc15',
  ratingGreat: '#4ade80',

  levelJunior: '#2dd4bf',
  levelMiddle: '#0ea5e9',
  levelSenior: '#c084fc',

  grid: 'rgba(255, 255, 255, 0.05)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  tooltipBg: 'rgba(2, 6, 23, 0.85)',
  tooltipBorder: 'rgba(255, 255, 255, 0.1)',
  areaFill: '#38bdf8',
  areaStroke: '#0284c7',

  series: ['#38bdf8', '#4ade80', '#c084fc', '#fb923c', '#f87171', '#facc15'],
};

export function useChartTheme(): ChartPalette {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    return resolvedTheme === 'dark' ? darkPalette : lightPalette;
  }, [resolvedTheme]);
}
