// @ts-check

export const DEFAULT_PORT = 3001;

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {number} PORT from the environment, or DEFAULT_PORT when unset/empty
 */
export function getPort(env) {
   return Number(env.PORT) || DEFAULT_PORT;
}
