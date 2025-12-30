import { Location } from '../../entities';
import { LocationSchema } from '../../schemas';

export function toLocationSchema(location: Location): LocationSchema {
    return location as LocationSchema;
}