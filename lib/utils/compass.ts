/**
 * Audio Compass & Direction Heading Utilities
 * Calculates azimuth angle (0° - 360°) and converts to Arabic cardinal directions.
 */

export interface CompassHeading {
  degrees: number;
  directionAr: string;
  shortLabel: string;
}

export function calculateCompassDirection(degrees: number): CompassHeading {
  // Normalize degrees to 0 - 360
  const normalized = ((degrees % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) {
    return { degrees: Math.round(normalized), directionAr: "الشمال", shortLabel: "شمال" };
  } else if (normalized >= 22.5 && normalized < 67.5) {
    return { degrees: Math.round(normalized), directionAr: "الشمال الشرقي", shortLabel: "شمال شرق" };
  } else if (normalized >= 67.5 && normalized < 112.5) {
    return { degrees: Math.round(normalized), directionAr: "الشرق", shortLabel: "شرق" };
  } else if (normalized >= 112.5 && normalized < 157.5) {
    return { degrees: Math.round(normalized), directionAr: "الجنوب الشرقي", shortLabel: "جنوب شرق" };
  } else if (normalized >= 157.5 && normalized < 202.5) {
    return { degrees: Math.round(normalized), directionAr: "الجنوب", shortLabel: "جنوب" };
  } else if (normalized >= 202.5 && normalized < 247.5) {
    return { degrees: Math.round(normalized), directionAr: "الجنوب الغربي", shortLabel: "جنوب غرب" };
  } else if (normalized >= 247.5 && normalized < 292.5) {
    return { degrees: Math.round(normalized), directionAr: "الغرب", shortLabel: "غرب" };
  } else {
    return { degrees: Math.round(normalized), directionAr: "الشمال الغربي", shortLabel: "شمال غرب" };
  }
}
