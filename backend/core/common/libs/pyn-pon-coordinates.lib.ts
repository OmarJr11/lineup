import { IAddressComponent } from '../interfaces/address-component.interface';
import { ICoordinate } from '../interfaces/coordinate.interface';
import { IDatabaseCoordinate } from '../interfaces/database-coordinate.interface';

/**
 * Obtain differential value of degrees associated with the distance passed in kilometers.
 * This value will be used to add to the coordinates and thus delimit the searches in the
 * database, to obtain the coordinates that are in the range of km obtained.
 *
 * @param km kilometers to find value
 */
export function getGradDifferenceByKm(km: number): number {
    const meters = km * 1000;

    // Base coordinate, to which the kilometers passed by parameters
    // to its latitude will be added.
    const origin: ICoordinate = { latitude: 33.638946, longitude: -84.418615 };

    const lat = +origin.latitude + (meters / 6371000.0) * (180 / +Math.PI);

    const newPoint = { latitude: lat, longitude: origin.longitude };

    return getGradDifferenceByPoints(origin, newPoint);
}

export function getAddressComponentByType(
    data: IAddressComponent[],
    type: string
): IAddressComponent {
    return data.find((e) => {
        return e.types.find((t) => t === type);
    });
}

export function convertCoordinateToString(coordinate: ICoordinate | string): string {
    if (coordinate && coordinate['latitude'] && coordinate['longitude']) {
        return `${coordinate['latitude']},${coordinate['longitude']}`;
    }
    return null;
}

/**
 * Get Coordinate From any object (if exists, if not, return null)
 * @param {Record<string, unknown>} obj - objet to search the coordinate
 * @returns {Promise<ICoordinate>} - coordinate found
 */
export function getCoordinateFromObject(obj: Record<string, unknown>): ICoordinate {
    const latitude: number = isNaN(+obj.latitude) ? NaN : +obj.latitude;
    const longitude: number = isNaN(+obj.longitude) ? NaN : +obj.longitude;

    return generateCoordinate(latitude, longitude);
}

/**
 * Get Coordinate from database field
 * @param {string | ICoordinate | IDatabaseCoordinate} coordinate - coordinate database field
 * @returns {Promise<ICoordinate>} - coordinate generated
 */
export function getCoordinateFromDatabaseField(
    coordinate: string | ICoordinate | IDatabaseCoordinate
): ICoordinate {
    if (typeof coordinate === 'string') {
        return convertStringToCoordinate(coordinate);
    }

    const latitude = isNaN(+coordinate['x'])
        ? isNaN(+coordinate['latitude'])
            ? null
            : +coordinate['latitude']
        : +coordinate['x'];

    const longitude = isNaN(+coordinate['y'])
        ? isNaN(+coordinate['longitude'])
            ? null
            : +coordinate['longitude']
        : +coordinate['y'];

    return generateCoordinate(latitude, longitude);
}

/**
 * Convert string to Coordinate
 * @param {string} strCoordinate - string coordinate
 * @returns {Promise<ICoordinate>} - coordinate generated
 */
function convertStringToCoordinate(strCoordinate: string): ICoordinate {
    const coordinates = strCoordinate.split(',');

    if (coordinates.length !== 2) {
        return null;
    }

    const latitude: number = isNaN(+coordinates[0]) ? NaN : +coordinates[0];
    const longitude: number = isNaN(+coordinates[1]) ? NaN : +coordinates[1];

    return generateCoordinate(latitude, longitude);
}

/**
 * Generate coordinate given a latitude and a longitude
 * @param {number} latitude - latitude
 * @param {number} longitude - longitude
 * @returns {Promise<ICoordinate>} - coordinate generated
 */
function generateCoordinate(latitude: number, longitude: number): ICoordinate {
    if (isNaN(latitude) || isNaN(longitude)) {
        return null;
    }

    return { latitude, longitude };
}

/**
 * Given two coordinates, obtain the distance between the two points.
 *
 * @param coord1 first coordinate
 * @param coord2 second coordinate
 */
function getGradDifferenceByPoints(coord1: ICoordinate, coord2: ICoordinate): number {
    const sum =
        Math.pow(coord1.latitude - coord2.latitude, 2) +
        Math.pow(coord1.longitude - coord2.longitude, 2);

    return Math.sqrt(sum);
}
