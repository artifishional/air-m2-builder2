import { resolve, basename } from 'path';
export const dirname = resolve('.');
export const currentModule = basename(dirname);
export const units = { dir: 'm2unit', requires: 'm2units', dirS: 'm2units' };
