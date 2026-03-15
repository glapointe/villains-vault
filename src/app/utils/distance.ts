/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
    return km * 0.621371;
}

export function formatDistance(distanceInMiles: number) {
    // If we have a well known km distance, display as km, otherwise display in miles
    const wellKnownKmDistancesInMiles = [3.1, 6.2, 9.3];
    const wellKnownKmDistancesInKm = [5, 10, 15];
    // If we're within 0.1 miles of a well known km distance, display as km
    for (let i = 0; i < wellKnownKmDistancesInMiles.length; i++) {
        if (Math.abs(distanceInMiles - wellKnownKmDistancesInMiles[i]) < 0.1) {
            return `${wellKnownKmDistancesInKm[i]} km`;
        }
    }
    // Otherwise display in miles with 1 decimal place
    return `${distanceInMiles.toFixed(1)} mi`;
}