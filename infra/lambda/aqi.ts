
export type Pollutant = "pm25" | "pm10" | "no2" | "so2" | "co" | "o3";

export type PollutantReadings = Partial<Record<Pollutant, number>>;

export type AqiCategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export interface PollutantSubIndex {
  pollutant: Pollutant;
  concentration: number;
  subIndex: number;
}

export interface AqiResult {
  aqi: number | null;
  category: AqiCategory | "Unavailable";
  dominantPollutant: Pollutant | null;
  subIndices: PollutantSubIndex[];
  note: string;
}

interface Breakpoint {
  concentrationLow: number;
  concentrationHigh: number;
  indexLow: number;
  indexHigh: number;
}

// CPCB concentration breakpoints.
// PM2.5, PM10, NO2, SO2 and O3 use µg/m³.
// CO uses mg/m³.
// Concentrations should represent the appropriate averaging period.
const BREAKPOINTS: Record<Pollutant, Breakpoint[]> = {
  pm25: [
    { concentrationLow: 0, concentrationHigh: 30, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 31, concentrationHigh: 60, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 61, concentrationHigh: 90, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 91, concentrationHigh: 120, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 121, concentrationHigh: 250, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 251, concentrationHigh: 500, indexLow: 401, indexHigh: 500 }
  ],
  pm10: [
    { concentrationLow: 0, concentrationHigh: 50, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 51, concentrationHigh: 100, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 101, concentrationHigh: 250, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 251, concentrationHigh: 350, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 351, concentrationHigh: 430, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 431, concentrationHigh: 600, indexLow: 401, indexHigh: 500 }
  ],
  no2: [
    { concentrationLow: 0, concentrationHigh: 40, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 41, concentrationHigh: 80, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 81, concentrationHigh: 180, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 181, concentrationHigh: 280, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 281, concentrationHigh: 400, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 401, concentrationHigh: 1000, indexLow: 401, indexHigh: 500 }
  ],
  so2: [
    { concentrationLow: 0, concentrationHigh: 40, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 41, concentrationHigh: 80, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 81, concentrationHigh: 380, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 381, concentrationHigh: 800, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 801, concentrationHigh: 1600, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 1601, concentrationHigh: 2000, indexLow: 401, indexHigh: 500 }
  ],
  co: [
    { concentrationLow: 0, concentrationHigh: 1.0, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 1.1, concentrationHigh: 2.0, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 2.1, concentrationHigh: 10.0, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 10.1, concentrationHigh: 17.0, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 17.1, concentrationHigh: 34.0, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 34.1, concentrationHigh: 50.0, indexLow: 401, indexHigh: 500 }
  ],
  o3: [
    { concentrationLow: 0, concentrationHigh: 50, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 51, concentrationHigh: 100, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 101, concentrationHigh: 168, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 169, concentrationHigh: 208, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 209, concentrationHigh: 748, indexLow: 301, indexHigh: 400 },
    { concentrationLow: 749, concentrationHigh: 1000, indexLow: 401, indexHigh: 500 }
  ]
};

export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

export function calculateSubIndex(
  pollutant: Pollutant,
  concentration: number
): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) {
    return null;
  }

  const ranges = BREAKPOINTS[pollutant];

  const range = ranges.find(
    (item) =>
      concentration >= item.concentrationLow &&
      concentration <= item.concentrationHigh
  );

  if (!range) {
    return null;
  }

  const value =
    ((range.indexHigh - range.indexLow) /
      (range.concentrationHigh - range.concentrationLow)) *
      (concentration - range.concentrationLow) +
    range.indexLow;

  return Math.round(value);
}

export function calculateAqi(readings: PollutantReadings): AqiResult {
  const subIndices: PollutantSubIndex[] = [];

  for (const pollutant of Object.keys(readings) as Pollutant[]) {
    const concentration = readings[pollutant];

    if (typeof concentration !== "number") continue;

    const subIndex = calculateSubIndex(pollutant, concentration);

    if (subIndex !== null) {
      subIndices.push({ pollutant, concentration, subIndex });
    }
  }

  if (subIndices.length === 0) {
    return {
      aqi: null,
      category: "Unavailable",
      dominantPollutant: null,
      subIndices: [],
      note: "No valid pollutant concentration falls within the supported CPCB breakpoints."
    };
  }

  const dominant = subIndices.reduce((highest, current) =>
    current.subIndex > highest.subIndex ? current : highest
  );

  return {
    aqi: dominant.subIndex,
    category: getAqiCategory(dominant.subIndex),
    dominantPollutant: dominant.pollutant,
    subIndices,
    note:
      "Indicative sub-index result. Official AQI reporting requires the prescribed averaging periods and sufficient valid pollutant measurements."
  };
}
