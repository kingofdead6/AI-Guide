import { getLesson as get } from './catalog';
import { seeded, shuffle } from './grade';

export const getLesson = (id: string | null) => (id ? get(id) : undefined);
export const seededShuffle = (n: number, seed: number) => shuffle([...Array(n).keys()], seeded(seed));
