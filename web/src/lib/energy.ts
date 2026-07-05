import {
  pokemonTypeCssClass,
  pokemonTypeFromUsername,
  pokemonTypeInfo,
  type PokemonType,
  type PokemonTypeInfo,
} from "./pokemon-types";

export type { PokemonType, PokemonTypeInfo };

export function energyCountFromLikes(likes: number): number {
  if (likes <= 0) return 0;
  return Math.min(8, 1 + Math.floor(Math.log2(likes)));
}

/** Resolve display + holo info for a trainer's Pokémon type */
export function typeForUsername(username: string): PokemonTypeInfo {
  return pokemonTypeInfo(pokemonTypeFromUsername(username));
}

export function energyTypeClass(typeName: string): string {
  return pokemonTypeCssClass(typeName);
}
