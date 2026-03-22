import type { State } from '../../entities';
import type { StateSchema } from '../../schemas';

/**
 * Maps a State entity to StateSchema for GraphQL response.
 * @param {State} state - The state entity
 * @returns {StateSchema} The GraphQL schema representation
 */
export function toStateSchema(state: State): StateSchema {
  return state as StateSchema;
}
