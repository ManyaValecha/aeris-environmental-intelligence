import type { Station } from '@/types';

/**
 * Delhi NCR monitoring station registry.
 *
 * This is a static geographic registry only — no air quality readings.
 * Coordinates sourced from publicly available station location records.
 * openAqId values reference OpenAQ location IDs (for REAL mode data fetching).
 */
export const DELHI_NCR_STATIONS: Station[] = [
  {
    id: 'DELHI_ANAND_VIHAR',
    name: 'Anand Vihar',
    locality: 'East Delhi',
    coordinates: { lat: 28.6469, lng: 77.3160 },
    openAqId: 'IN-CPCB_AV_A',
  },
  {
    id: 'DELHI_ITO',
    name: 'ITO',
    locality: 'Central Delhi',
    coordinates: { lat: 28.6289, lng: 77.2434 },
    openAqId: 'IN-CPCB_ITO_A',
  },
  {
    id: 'DELHI_RK_PURAM',
    name: 'RK Puram',
    locality: 'South-West Delhi',
    coordinates: { lat: 28.5637, lng: 77.1684 },
    openAqId: 'IN-CPCB_RKP_A',
  },
  {
    id: 'DELHI_DWARKA',
    name: 'Dwarka',
    locality: 'West Delhi',
    coordinates: { lat: 28.5921, lng: 77.0460 },
    openAqId: 'IN-CPCB_DWK_A',
  },
  {
    id: 'DELHI_PUNJABI_BAGH',
    name: 'Punjabi Bagh',
    locality: 'West Delhi',
    coordinates: { lat: 28.6715, lng: 77.1295 },
    openAqId: 'IN-CPCB_PB_A',
  },
  {
    id: 'DELHI_BAWANA',
    name: 'Bawana',
    locality: 'North Delhi (Industrial)',
    coordinates: { lat: 28.7893, lng: 77.0412 },
    openAqId: 'IN-CPCB_BWN_A',
  },
  {
    id: 'NOIDA',
    name: 'Noida',
    locality: 'Gautam Buddh Nagar, UP',
    coordinates: { lat: 28.5355, lng: 77.3910 },
    openAqId: 'IN-CPCB_NOI_A',
  },
  {
    id: 'GURUGRAM',
    name: 'Gurugram',
    locality: 'Haryana',
    coordinates: { lat: 28.4595, lng: 77.0266 },
    openAqId: 'IN-CPCB_GGN_A',
  },
];

/** Map from StationId to Station for O(1) lookup. */
export const STATION_MAP: Map<string, Station> = new Map(
  DELHI_NCR_STATIONS.map((s) => [s.id, s])
);
