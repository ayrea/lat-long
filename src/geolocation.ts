/**
 * Abstraction over navigator.geolocation. In development (import.meta.env.DEV),
 * returns positions from a mock array (cycling by call index). In production,
 * uses the real getCurrentPosition API.
 */

const MOCK_LOCATIONS: { latitude: number; longitude: number }[] = [
  { latitude: -30.2555590864031, longitude: 135.421626482112 },
  { latitude: -30.2555602864031, longitude: 135.421627482112 },
  { latitude: -30.2555534864031, longitude: 135.421606582112 },
  { latitude: -30.2555258864031, longitude: 135.421696482112 },
  { latitude: -30.2555424864031, longitude: 135.421686782112 },
  { latitude: -30.2555428864031, longitude: 135.421685782112 },
  { latitude: -30.2555535864031, longitude: 135.421676882112 },
  { latitude: -30.2555536864031, longitude: 135.421682882112 },
  { latitude: -30.2555528864031, longitude: 135.421683382112 },
  { latitude: -30.2555252864031, longitude: 135.421682082112 },
  { latitude: -30.2555178864031, longitude: 135.421683482112 },
  { latitude: -30.2555173864031, longitude: 135.421683582112 },
  { latitude: -30.2555104864031, longitude: 135.421684282112 },
  { latitude: -30.2555093864031, longitude: 135.421682082112 },
  { latitude: -30.2555092864031, longitude: 135.421681882112 },
  { latitude: -30.2555070864031, longitude: 135.421678682112 },
  { latitude: -30.2555061864031, longitude: 135.421678182112 },
  { latitude: -30.2555060864031, longitude: 135.421678182112 },
  { latitude: -30.2555051864031, longitude: 135.421677182112 },
  { latitude: -30.2555042864031, longitude: 135.421676282112 },
];

let mockIndex = 0;

function createMockPosition(loc: {
  latitude: number;
  longitude: number;
}): GeolocationPosition {
  const coords = {
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: 0,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON() {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        accuracy: this.accuracy,
        altitude: this.altitude,
        altitudeAccuracy: this.altitudeAccuracy,
        heading: this.heading,
        speed: this.speed,
      };
    },
  };
  const timestamp = Date.now();
  return {
    coords,
    timestamp,
    toJSON() {
      return { coords, timestamp };
    },
  };
}

export function isGeolocationAvailable(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function getCurrentPosition(
  success: (position: GeolocationPosition) => void,
  error?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): void {
  if (import.meta.env.DEV) {
    const idx = mockIndex % MOCK_LOCATIONS.length;
    mockIndex += 1;
    const position = createMockPosition(MOCK_LOCATIONS[idx]);
    setTimeout(() => success(position), 0);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    success,
    error ?? (() => { }),
    options
  );
}
