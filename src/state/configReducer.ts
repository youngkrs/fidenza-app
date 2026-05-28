import { seedDefaults } from '../engine/config';
import type { Config } from '../engine/types';

/**
 * State transitions for the generator's Config. Keeping these in a reducer
 * (rather than a dozen ad-hoc setCfg calls) gives every config mutation a
 * single, testable definition.
 */
export type ConfigAction =
  | { type: 'replace'; config: Config }
  | { type: 'patch'; patch: Partial<Config> }
  | { type: 'fromSeed'; seed: number };

export function configReducer(state: Config, action: ConfigAction): Config {
  switch (action.type) {
    case 'replace':
      return action.config;
    case 'patch':
      return { ...state, ...action.patch };
    case 'fromSeed':
      return seedDefaults(action.seed);
    default:
      return state;
  }
}

/** Build a single-field patch action with key/value type-safety. */
export function setField<K extends keyof Config>(
  key: K,
  value: Config[K],
): ConfigAction {
  return { type: 'patch', patch: { [key]: value } as Partial<Config> };
}
