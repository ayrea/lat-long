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

const WARMUP_MS = 30_000;
const COLLECTION_MS = 60_000;
const MAX_ACCURACY_M = 10;

export interface AccuratePositionProgress {
  phase: "warmup" | "collecting";
  warmupRemainingMs?: number;
  collectingElapsedMs?: number;
  collectingTotalMs?: number;
  samplesAccepted: number;
  samplesDiscarded: number;
  latestAccuracy: number | null;
  currentAverage: { latitude: number; longitude: number } | null;
}

export interface AccuratePositionResult {
  latitude: number;
  longitude: number;
  samplesUsed: number;
  samplesDiscarded: number;
  durationMs: number;
}

export interface GetAccuratePositionOptions {
  onProgress?: (progress: AccuratePositionProgress) => void;
  onSampleAccepted?: (reading: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => void;
  onSuccess: (result: AccuratePositionResult) => void;
  onError: (error: GeolocationPositionError) => void;
  /** Warm-up duration in ms before collecting samples. Defaults to 30_000. */
  warmupMs?: number;
  /** Collection duration in ms. Defaults to 60_000. */
  collectionMs?: number;
}

function createMockPosition(
  loc: { latitude: number; longitude: number },
  accuracy = 0
): GeolocationPosition {
  const coords = {
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy,
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

function computeWeightedAverage(
  samples: { latitude: number; longitude: number; accuracy: number }[]
): { latitude: number; longitude: number } | null {
  if (samples.length === 0) return null;
  let sumWeight = 0;
  let sumLat = 0;
  let sumLon = 0;
  for (const s of samples) {
    const w = 1 / (s.accuracy * s.accuracy);
    sumWeight += w;
    sumLat += s.latitude * w;
    sumLon += s.longitude * w;
  }
  if (sumWeight === 0) return null;
  return {
    latitude: sumLat / sumWeight,
    longitude: sumLon / sumWeight,
  };
}

export function getAccuratePosition(
  options: GetAccuratePositionOptions
): () => void {
  const { onProgress, onSampleAccepted, onSuccess, onError } = options;
  const warmupMs = options.warmupMs ?? WARMUP_MS;
  const collectionMs = options.collectionMs ?? COLLECTION_MS;

  if (import.meta.env.DEV) {
    return runAccuratePositionMock(
      { onProgress, onSampleAccepted, onSuccess, onError, warmupMs, collectionMs }
    );
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError({
      code: 2,
      message: "Geolocation not available",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
    return () => {};
  }

  const samples: { latitude: number; longitude: number; accuracy: number }[] = [];
  let samplesDiscarded = 0;
  let latestAccuracy: number | null = null;
  let cancelled = false;
  let watchId: number | undefined;
  let warmupEndMs: number | undefined;
  let collectionEndMs: number | undefined;

  const reportProgress = (phase: "warmup" | "collecting") => {
    if (cancelled || !onProgress) return;
    const now = Date.now();
    if (phase === "warmup" && warmupEndMs != null) {
      onProgress({
        phase: "warmup",
        warmupRemainingMs: Math.max(0, warmupEndMs - now),
        samplesAccepted: 0,
        samplesDiscarded: 0,
        latestAccuracy: null,
        currentAverage: null,
      });
    } else if (phase === "collecting" && collectionEndMs != null) {
      onProgress({
        phase: "collecting",
        collectingElapsedMs: now - (warmupEndMs ?? now),
        collectingTotalMs: collectionMs,
        samplesAccepted: samples.length,
        samplesDiscarded,
        latestAccuracy,
        currentAverage: computeWeightedAverage(samples),
      });
    }
  };

  const tick = () => {
    if (cancelled) return;
    const now = Date.now();
    if (now < (warmupEndMs ?? 0)) {
      reportProgress("warmup");
      return;
    }
    if (now >= (collectionEndMs ?? Infinity)) {
      clearInterval(intervalId);
      const avg = computeWeightedAverage(samples);
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = undefined;
      }
      if (avg) {
        onSuccess({
          latitude: avg.latitude,
          longitude: avg.longitude,
          samplesUsed: samples.length,
          samplesDiscarded,
          durationMs: collectionMs,
        });
      } else {
        onError({
          code: 2,
          message: "No valid samples (accuracy ≤ 10 m required)",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }
      return;
    }
    reportProgress("collecting");
  };

  warmupEndMs = Date.now() + warmupMs;
  collectionEndMs = warmupEndMs + collectionMs;
  const intervalId = setInterval(tick, 500);

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (cancelled) return;
      const { latitude, longitude, accuracy } = position.coords;
      const acc = accuracy ?? Infinity;
      latestAccuracy = acc;
      if (Date.now() < (warmupEndMs ?? 0)) return;
      if (Date.now() >= (collectionEndMs ?? Infinity)) return;
      if (acc > MAX_ACCURACY_M) {
        samplesDiscarded += 1;
        return;
      }
      samples.push({ latitude, longitude, accuracy: acc });
      onSampleAccepted?.({ latitude, longitude, accuracy: acc });
    },
    (err) => {
      if (!cancelled) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15_000,
    }
  );

  return () => {
    cancelled = true;
    clearInterval(intervalId);
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = undefined;
    }
  };
}

function runAccuratePositionMock(
  opts: GetAccuratePositionOptions & { warmupMs: number; collectionMs: number }
): () => void {
  const {
    onProgress,
    onSampleAccepted,
    onSuccess,
    onError,
    warmupMs,
    collectionMs,
  } = opts;
  let cancelled = false;
  const startMs = Date.now();
  const warmupEndMs = startMs + warmupMs;
  const collectionEndMs = warmupEndMs + collectionMs;
  const samples: { latitude: number; longitude: number; accuracy: number }[] = [];
  let samplesDiscarded = 0;
  let latestAccuracy: number | null = null;

  const tick = () => {
    if (cancelled) return;
    const now = Date.now();
    if (now < warmupEndMs) {
      onProgress?.({
        phase: "warmup",
        warmupRemainingMs: warmupEndMs - now,
        samplesAccepted: 0,
        samplesDiscarded: 0,
        latestAccuracy: null,
        currentAverage: null,
      });
      return;
    }
    if (now >= collectionEndMs) {
      clearInterval(progressIntervalId);
      const avg = computeWeightedAverage(samples);
      if (avg) {
        onSuccess({
          latitude: avg.latitude,
          longitude: avg.longitude,
          samplesUsed: samples.length,
          samplesDiscarded,
          durationMs: collectionMs,
        });
      } else {
        onError({
          code: 2,
          message: "No valid samples (accuracy ≤ 10 m required)",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }
      return;
    }
    onProgress?.({
      phase: "collecting",
      collectingElapsedMs: now - warmupEndMs,
      collectingTotalMs: collectionMs,
      samplesAccepted: samples.length,
      samplesDiscarded,
      latestAccuracy,
      currentAverage: computeWeightedAverage(samples),
    });
  };

  const progressIntervalId = setInterval(tick, 500);

  let mockStep = 0;
  const emitMockPosition = () => {
    if (cancelled || Date.now() < warmupEndMs || Date.now() >= collectionEndMs) {
      if (!cancelled) setTimeout(emitMockPosition, 800);
      return;
    }
    const idx = mockStep % MOCK_LOCATIONS.length;
    mockStep += 1;
    const loc = MOCK_LOCATIONS[idx];
    const accuracy = mockStep % 3 === 0 ? 15 : 3 + (mockStep % 5);
    latestAccuracy = accuracy;
    if (accuracy > MAX_ACCURACY_M) {
      samplesDiscarded += 1;
    } else {
      samples.push({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy,
      });
      onSampleAccepted?.({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy,
      });
    }
    if (!cancelled && Date.now() < collectionEndMs) {
      setTimeout(emitMockPosition, 800);
    }
  };
  setTimeout(emitMockPosition, warmupMs);

  return () => {
    cancelled = true;
    clearInterval(progressIntervalId);
  };
}
