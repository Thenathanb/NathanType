import {
  applyBackwards, applyAllCaps, applyRandomCase,
  applyPlusZero, applyPlusOne, applyChooChoo,
  applyMorse, applyBinary, applyHex, applyAscii,
  applyRot13, generateGibberish,
} from './transforms';
import { classicBrainrotWords } from '../../data/words/classic-brainrot';
import { characterBrainrotWords } from '../../data/words/character-brainrot';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export { applyMirror } from './transforms';

/**
 * Apply a synchronous transform funbox to a base word list.
 * Content/meme/music funboxes are loaded async in useTypingTest and
 * bypass this function entirely.
 */
export function getActiveFunboxWords(
  baseWords: string[],
  funboxId: string | null,
): string[] {
  if (!funboxId) return baseWords;

  switch (funboxId) {
    case 'backwards':    return applyBackwards(baseWords);
    case 'all-caps':     return applyAllCaps(baseWords);
    case 'random-case':  return applyRandomCase(baseWords);
    case 'plus-zero':    return applyPlusZero(baseWords);
    case 'plus-one':     return applyPlusOne(baseWords);
    case 'choo-choo':    return applyChooChoo(baseWords);
    case 'morse':        return applyMorse(baseWords);
    case 'binary':       return applyBinary(baseWords);
    case 'hexadecimal':  return applyHex(baseWords);
    case 'ascii':        return applyAscii(baseWords);
    case 'rot13':        return applyRot13(baseWords);
    case 'gibberish':         return generateGibberish(baseWords.length);
    case 'classic-brainrot':  return baseWords.map(() => pickRandom(classicBrainrotWords));
    case 'character-brainrot': return baseWords.map(() => pickRandom(characterBrainrotWords));
    // nospace: words are passed through unchanged; the UI hides spaces
    case 'nospace':      return baseWords;
    // visual/behavioral challenge funboxes don't change the word list
    default:             return baseWords;
  }
}
