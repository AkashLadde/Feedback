/**
 * Haversine formula to compute great-circle distance between two points in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export interface GeofenceEvaluation {
  status: 'INSIDE' | 'UNCERTAIN' | 'OUTSIDE';
  distance: number;
  radius: number;
  accuracy: number;
  message: string;
  isPermitted: boolean;
  flags: string[];
}

export function evaluateGeofence(
  userLat: number,
  userLng: number,
  userAccuracy: number,
  labLat: number,
  labLng: number,
  labRadiusMeters: number
): GeofenceEvaluation {
  const distance = calculateHaversineDistance(userLat, userLng, labLat, labLng);
  const flags: string[] = [];

  // Low accuracy signal (> 100 meters precision)
  if (userAccuracy > 100) {
    flags.push('LOCATION_UNCERTAIN');
    return {
      status: 'UNCERTAIN',
      distance: Math.round(distance * 10) / 10,
      radius: labRadiusMeters,
      accuracy: Math.round(userAccuracy * 10) / 10,
      message: 'Location accuracy is low. Please move to an open area and retry.',
      isPermitted: false,
      flags
    };
  }

  // Inside geofence tolerance (adding small 5m tolerance for minor GPS jitter)
  const effectiveRadius = labRadiusMeters + 5.0;
  if (distance <= effectiveRadius) {
    return {
      status: 'INSIDE',
      distance: Math.round(distance * 10) / 10,
      radius: labRadiusMeters,
      accuracy: Math.round(userAccuracy * 10) / 10,
      message: 'Location verified — You are inside the laboratory area.',
      isPermitted: true,
      flags
    };
  }

  // Outside geofence boundary
  flags.push('OUTSIDE_GEOFENCE');
  return {
    status: 'OUTSIDE',
    distance: Math.round(distance * 10) / 10,
    radius: labRadiusMeters,
    accuracy: Math.round(userAccuracy * 10) / 10,
    message: `You are outside the permitted laboratory area. (Distance: ${Math.round(distance)}m, Permitted: ${labRadiusMeters}m)`,
    isPermitted: false,
    flags
  };
}

/**
 * Checks for impossible velocity between two consecutive location timestamps (Spoofing check)
 */
export function checkLocationJump(
  lat1: number,
  lon1: number,
  time1Ms: number,
  lat2: number,
  lon2: number,
  time2Ms: number
): { isAnomaly: boolean; speedKmh: number; distanceMeters: number } {
  const deltaSeconds = Math.abs(time2Ms - time1Ms) / 1000;
  if (deltaSeconds < 1) {
    return { isAnomaly: false, speedKmh: 0, distanceMeters: 0 };
  }

  const distanceMeters = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const speedMps = distanceMeters / deltaSeconds;
  const speedKmh = speedMps * 3.6;

  // If student moved more than 200m in less than 30 seconds inside campus, flag as anomaly
  const isAnomaly = speedMps > 15 && distanceMeters > 150;

  return {
    isAnomaly,
    speedKmh: Math.round(speedKmh * 10) / 10,
    distanceMeters: Math.round(distanceMeters * 10) / 10
  };
}
