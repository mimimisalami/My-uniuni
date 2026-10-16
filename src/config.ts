export type WorldId = 'hub' | 'observatory' | 'atelier';
export type OutfitId = 'tailored' | 'techwear' | 'mythic';

export const WORLDS = {
  hub: { name: 'The Celestial Hub', short: 'The Hub', number: '00', purpose: 'A place to return to yourself.', color: '#b19453', spawn: [0, 14] },
  observatory: { name: 'The Observatory', short: 'Observatory', number: '01', purpose: 'Make space for a new perspective.', color: '#4285a4', spawn: [0, 13] },
  atelier: { name: 'The Atelier', short: 'Atelier', number: '02', purpose: 'Give your ideas a life of their own.', color: '#b6754d', spawn: [0, 13] },
} as const;

export const OUTFITS: Record<OutfitId, { name: string; subtitle: string; color: string; accent: string }> = {
  tailored: { name: 'Modern Tailored', subtitle: 'Quiet structure. Clear intention.', color: '#ebe4d6', accent: '#3c575e' },
  techwear: { name: 'Techwear', subtitle: 'Built for wherever curiosity leads.', color: '#283e4b', accent: '#7fc3bd' },
  mythic: { name: 'Mythic Minimal', subtitle: 'A little mythology, made your own.', color: '#faf1df', accent: '#c6a25e' },
};

export const SETTINGS = {
  title: 'Aether', // Working prototype title, not a final brand.
  storageKey: 'aether-demo-v1',
  focusSeconds: 25 * 60,
  speed: 6.5,
  interactionDistance: 4.8,
  worldRadius: 23,
  maxPixelRatio: matchMedia('(pointer: coarse)').matches ? 1.25 : 1.7,
};
