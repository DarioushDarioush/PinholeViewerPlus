// Film formats in mm
export const FILM_FORMATS = [
  { name: '35mm', width: 36, height: 24 },
  { name: '6x4.5', width: 60, height: 45 },
  { name: '6x6', width: 60, height: 60 },
  { name: '6x7', width: 60, height: 70 },
  { name: '6x9', width: 60, height: 90 },
  { name: '6x12', width: 60, height: 120 },
  { name: '6x17', width: 60, height: 170 },
];

export const ISO_VALUES = [25, 50, 100, 200, 400, 800, 1600, 3200];

// Filter options with exposure compensation (in stops)
export const FILTER_OPTIONS = [
  { name: 'None', stops: 0, color: '#666666' },
  { name: 'Yellow', stops: 1, color: '#FCD34D' },
  { name: 'Orange', stops: 2, color: '#F97316' },
  { name: 'Red', stops: 3, color: '#EF4444' },
];

export type FilterType = 'None' | 'Yellow' | 'Orange' | 'Red';

// Lighting conditions for Sunny 16 rule
export const LIGHTING_CONDITIONS = [
  { name: 'Snow/Sandy', fStop: 22, icon: '☀️❄️', description: 'Very bright, snow or beach' },
  { name: 'Clear/Sunny', fStop: 16, icon: '☀️', description: 'Bright sun with distinct shadows' },
  { name: 'Slightly Overcast', fStop: 11, icon: '🌤️', description: 'Hazy sun, soft shadows' },
  { name: 'Overcast', fStop: 8, icon: '☁️', description: 'Cloudy, no shadows' },
  { name: 'Heavy Overcast', fStop: 5.6, icon: '☁️☁️', description: 'Dark clouds' },
  { name: 'Open Shade/Sunset', fStop: 4, icon: '🌅', description: 'Shade or sunset/sunrise' },
];

export type FilmOrientation = 'landscape' | 'portrait';

export interface AppSettings {
  focalLength: number;
  pinholeSize: number;
  filmFormat: typeof FILM_FORMATS[0];
  filmOrientation: FilmOrientation;
  iso: number;
  selectedCondition: string | null;
  useRedFilter: boolean;  // Kept for backwards compatibility
  selectedFilter: FilterType;  // New filter selection
  useReciprocityFailure: boolean;
  bracketStops: number;
}
