import english200 from '../data/words/english-200.json';
import quotes from '../data/words/quotes.json';

const punctuationMarks = ['.', ',', '!', '?', ';', ':'];
const numberRange = Array.from({ length: 10 }, (_, i) => i.toString());

/**
 * Get a random item from an array
 */
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Add punctuation to a word (sometimes)
 */
function addPunctuation(word: string, probability: number = 0.1): string {
  if (Math.random() < probability) {
    return word + randomItem(punctuationMarks);
  }
  return word;
}

/**
 * Generate random words for typing test
 */
export function generateWords(
  count: number,
  options: {
    language?: string;
    punctuation?: boolean;
    numbers?: boolean;
  } = {}
): string[] {
  const { language = 'english', punctuation = false, numbers = false } = options;

  // For now, we only support English
  const wordList = english200;

  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    let word: string;

    // Sometimes include a number instead of a word
    if (numbers && Math.random() < 0.1) {
      // 10% chance for a number
      const numLength = Math.floor(Math.random() * 3) + 1; // 1-3 digits
      word = Array.from({ length: numLength }, () => randomItem(numberRange)).join('');
    } else {
      word = randomItem(wordList);
    }

    // Add punctuation if enabled
    if (punctuation) {
      word = addPunctuation(word);
    }

    words.push(word);
  }

  return words;
}

/**
 * Get a quote for quote mode
 */
export function getQuote(length: 'short' | 'medium' | 'long' | 'thicc' = 'medium'): {
  words: string[];
  source: string;
} {
  // Filter quotes by length
  let filteredQuotes = quotes.filter((q) => {
    if (length === 'thicc') return q.length === 'long';
    return q.length === length;
  });

  // Fallback to all quotes if no match
  if (filteredQuotes.length === 0) {
    filteredQuotes = quotes;
  }

  const quote = randomItem(filteredQuotes);
  const words = quote.text.split(' ');

  return {
    words,
    source: `${quote.author}`,
  };
}

/**
 * Generate words based on test mode and configuration
 */
export function generateTestWords(
  mode: string,
  config: {
    wordLimit?: number;
    timeLimit?: number;
    punctuation?: boolean;
    numbers?: boolean;
    quoteLength?: 'short' | 'medium' | 'long' | 'thicc';
  }
): string[] {
  switch (mode) {
    case 'words':
      return generateWords(config.wordLimit || 25, {
        punctuation: config.punctuation,
        numbers: config.numbers,
      });

    case 'time':
      // Generate enough words for the time limit
      // Assume average typing speed of 40 WPM
      // Add extra words as buffer
      const estimatedWords = Math.ceil((config.timeLimit || 30) * 40 / 60) + 50;
      return generateWords(estimatedWords, {
        punctuation: config.punctuation,
        numbers: config.numbers,
      });

    case 'quote':
      const { words } = getQuote(config.quoteLength);
      return words;

    case 'zen':
      // For zen mode, generate a large pool of words
      return generateWords(500, {
        punctuation: config.punctuation,
        numbers: config.numbers,
      });

    case 'custom':
      // Custom text will be set separately
      return [];

    default:
      return generateWords(25);
  }
}
