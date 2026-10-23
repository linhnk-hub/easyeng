/**
 * Helper to construct full English sentences for quiz / multiple-choice questions.
 * Instead of pronouncing only the missing word/option, this fills the correct answer
 * into the sentence blank and returns the complete English sentence to speak.
 */

// Detect blank placeholder variations
export const BLANK_REGEX = /_{2,}|\.{3,}|\[\s*_+\]|\[\s*\.\.\.\s*\]|\[blank\]|\(blank\)|\(điền từ\)|[-]{3,}/i;

export function hasBlank(text: string): boolean {
  return BLANK_REGEX.test(text);
}

const VIETNAMESE_ACCENT_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;

export function containsVietnamese(text: string): boolean {
  return VIETNAMESE_ACCENT_REGEX.test(text);
}

function normalizeSentence(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,?!])/g, '$1')
    .trim();
}

/**
 * Returns before, blank and after portions of the question so the UI can highlight the filled blank.
 */
export function getBlankParts(question: string): { before: string; blank: string; after: string } | null {
  const match = question.match(BLANK_REGEX);
  if (!match || match.index === undefined) return null;
  const before = question.slice(0, match.index);
  const blank = match[0];
  const after = question.slice(match.index + blank.length);
  return { before, blank, after };
}

/**
 * Given a question and the correct answer option, construct the full complete English sentence.
 */
export function getFullEnglishSentenceForQuiz(
  question: string,
  correctAnswer: string,
  explanation?: string
): string | null {
  if (!question || !correctAnswer) return null;

  // Never speak if the correct answer itself is Vietnamese (e.g. meaning question)
  if (containsVietnamese(correctAnswer)) {
    return null;
  }

  const cleanAns = correctAnswer.trim();

  // 1. Check explanation for explicit "Câu hoàn chỉnh: '...'" or 'Complete sentence: "..."'
  if (explanation) {
    const completeMatch = explanation.match(/(?:câu hoàn chỉnh|câu đầy đủ|complete sentence|câu đúng)[:\s]+["'“]([^"'”]+)["'”]/i);
    if (completeMatch && completeMatch[1].trim() && !containsVietnamese(completeMatch[1])) {
      return normalizeSentence(completeMatch[1]);
    }
  }

  // 2. If the question has quotes containing a blank: e.g. Chọn từ thích hợp điền vào chỗ trống: "She likes to _____ to music."
  const quoteMatch = question.match(/["'“]([^"'”]+)["'”]/);
  if (quoteMatch && hasBlank(quoteMatch[1])) {
    const filledQuote = quoteMatch[1].replace(BLANK_REGEX, cleanAns).trim();
    if (!containsVietnamese(filledQuote)) {
      return normalizeSentence(filledQuote);
    }
  }

  // 3. If question itself contains a blank (e.g. "Where is she from? - She's from _____." or "My dad loves _____ in the garden.")
  if (hasBlank(question)) {
    // If there is a colon (e.g., "Điền vào chỗ trống: He _____ to school.")
    let textToFill = question;
    if (question.includes(':')) {
      const parts = question.split(':');
      const suffix = parts.slice(1).join(':').trim();
      if (hasBlank(suffix)) {
        textToFill = suffix;
      }
    }

    // Strip outer quotes if any
    textToFill = textToFill.replace(/^["'“]|["'”]$/g, '').trim();

    const filled = textToFill.replace(BLANK_REGEX, cleanAns);
    // If it still contains Vietnamese accents, isolate the English part
    if (containsVietnamese(filled)) {
      const enMatch = filled.match(/([A-Z][A-Za-z0-9\s,'’\-?!.]+)/);
      if (enMatch && enMatch[1].trim().length > cleanAns.length) {
        return normalizeSentence(enMatch[1].trim());
      }
    } else {
      return normalizeSentence(filled);
    }
  }

  // 4. Conversational question with NO blank, where question is English and answer is English
  // e.g. "Where are you from?" -> "I'm from Viet Nam."
  const isQuestionEn = !containsVietnamese(question);
  const isAnswerEn = !containsVietnamese(cleanAns);

  if (isQuestionEn && isAnswerEn) {
    // If question ends with '?' and answer is a sentence (>= 2 words or has punctuation)
    if (question.trim().endsWith('?') && cleanAns.split(/\s+/).length >= 2) {
      return normalizeSentence(`${question.trim()} - ${cleanAns}`);
    }
    // If answer is already a complete sentence
    if (cleanAns.split(/\s+/).length >= 3 || /[.?!]$/.test(cleanAns)) {
      return normalizeSentence(cleanAns);
    }
  }

  // 5. If answer is a full English sentence (>= 3 words)
  if (isAnswerEn && cleanAns.split(/\s+/).length >= 3) {
    return normalizeSentence(cleanAns);
  }

  return null;
}
