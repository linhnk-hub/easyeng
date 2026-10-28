import { ExerciseCluster, ExerciseQuestion } from '../types';
import grade4Cluster1Data from '../data/grade4_cluster1_workbook.json';
import grade4Cluster2Data from '../data/grade4_cluster2_workbook.json';
import grade4Cluster3Data from '../data/grade4_cluster3_workbook.json';
import grade4Cluster4Data from '../data/grade4_cluster4_workbook.json';
import grade7Cluster1Data from '../data/grade7_cluster1_workbook.json';
import grade7Cluster2Data from '../data/grade7_cluster2_workbook.json';
import grade7Cluster3Data from '../data/grade7_cluster3_workbook.json';
import grade7Cluster4Data from '../data/grade7_cluster4_workbook.json';

const COMMON_DISTRACTORS = [
  'Australia', 'Britain', 'America', 'Viet Nam', 'Malaysia', 'Singapore', 'Thailand', 'Japan',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'cook', 'swim', 'draw', 'ride a bike', 'play the guitar', 'roller skate', 'sing and dance',
  'go to bed', 'get up', 'have dinner', 'go to school', 'have breakfast'
];

/**
/**
 * Checks whether an exercise question requires looking at an image/picture
 * Only returns true if it is an unanswerable picture question with no text prompt or options.
 */
export function isImageQuestion(q: any, ex?: any, sec?: any): boolean {
  // If the question has explicit text prompt and answers/options, it's playable as a quiz!
  const hasPrompt = Boolean(q?.question_text || q?.question || q?.prompt_text || q?.prompt || q?.sentence);
  const hasOptionsOrAnswer = Boolean(
    (Array.isArray(q?.options) && q?.options.length > 0) ||
    q?.correct_answer !== undefined ||
    q?.correctAnswer !== undefined ||
    q?.answer !== undefined ||
    (ex && Array.isArray(ex.word_bank) && ex.word_bank.length > 0)
  );

  // If it has text prompt and options/answers, do NOT consider it an unplayable image question
  if (hasPrompt && hasOptionsOrAnswer) {
    return false;
  }

  // Only consider it an unplayable image question if it has no prompt text
  if (q?.image_url || q?.image || q?.imageUrl || q?.image_description || q?.character_image || q?.imageDescription) {
    return !hasPrompt;
  }
  if (ex && (ex.image_url || ex.image || ex.imageUrl || ex.pictures)) {
    return !hasPrompt;
  }

  const combinedText = [
    q?.question,
    q?.question_text,
    q?.prompt_text,
    q?.sentence,
    q?.explanation,
    q?.explanation_vi,
    ex?.instruction_vi,
    ex?.instruction_en,
    ex?.instruction,
    sec?.section_title,
    q?.category
  ].filter(Boolean).join(' ');

  if (!hasPrompt && /(nhìn|xem)\s+(hình|tranh|ảnh)/i.test(combinedText)) return true;
  if (!hasPrompt && /look\s+at\s+the\s+picture/i.test(combinedText)) return true;

  return false;
}

/**
 * Checks whether an exercise question requires listening to audio or dialogue/conversation.
 */
export function isAudioConversationQuestion(q: any, ex?: any, sec?: any): boolean {
  const hasPrompt = Boolean(q?.question_text || q?.question || q?.prompt_text || q?.prompt || q?.sentence);
  const hasOptionsOrAnswer = Boolean(
    (Array.isArray(q?.options) && q?.options.length > 0) ||
    q?.correct_answer !== undefined ||
    q?.correctAnswer !== undefined ||
    q?.answer !== undefined
  );

  // If it already has text prompt and answers and is not a missing audio file, don't discard it
  if (hasPrompt && hasOptionsOrAnswer && !q?.simulated_audio && !ex?.simulated_audio) {
    return false;
  }

  if (q?.simulated_audio || q?.audioTranscript || ex?.simulated_audio) return true;
  if (sec && /section\s*c\b/i.test(sec.section_id || '') && /listening/i.test(sec.section_title || '')) return true;

  const combinedText = [
    q?.question,
    q?.question_text,
    q?.prompt_text,
    q?.sentence,
    q?.explanation,
    q?.explanation_vi,
    ex?.instruction_vi,
    ex?.instruction_en,
    sec?.section_title,
    q?.category
  ].filter(Boolean).join(' ');

  if (!hasPrompt && /(lắng\s*nghe|băng\s*nghe|audio\s*track|file\s*nghe)/i.test(combinedText)) return true;
  if (!hasPrompt && /track\s*\d+/i.test(combinedText)) return true;

  return false;
}

/**
 * Robust parser for PDF Workbook structures (such as Global Success Sách bài tập)
 * Supporting units -> sections (A-F) -> exercises -> questions, pairs, pictures
 */
export function parseWorkbookCluster(
  data: any,
  clusterNumber: number = 1,
  defaultGrade: number = 4
): ExerciseCluster {
  let grade = defaultGrade;
  if (data.book_info && data.book_info.grade) {
    grade = Number(data.book_info.grade);
  } else if (data.grade) {
    grade = Number(data.grade);
  } else if (data.book_title) {
    const match = String(data.book_title).match(/(?:lớp|tiếng anh|grade)\s*(\d+)/i);
    if (match) grade = parseInt(match[1], 10);
  }

  const bookTitle = data.book_info?.title || data.book_title || '';
  const title = data.cluster_name
    ? `Học phần ${clusterNumber}: ${data.cluster_name}`
    : (bookTitle ? bookTitle : (data.title || `Học phần bài tập ${clusterNumber}`));

  const unitsCount = Array.isArray(data.units) ? data.units.length : 0;
  const description = `${bookTitle || 'Sách bài tập Tiếng Anh'} • Trọn bộ ${unitsCount} bài học`;

  const questions: ExerciseQuestion[] = [];
  let totalRawCount = 0;
  let skippedAudioCount = 0;
  let skippedImageCount = 0;

  (data.units || []).forEach((u: any, uIdx: number) => {
    const rawUnitNum = u.unit_number !== undefined ? Number(u.unit_number) : (uIdx + 1);
    const rawTitle = u.unit_title || u.title || `Unit ${rawUnitNum}`;
    const rawUnitId = u.unit_id || '';
    const isTestYourself = /test\s*yourself/i.test(rawTitle) || 
                           /test[\s\-_]*yourself/i.test(rawUnitId) || 
                           /^ty\d*/i.test(rawUnitId) ||
                           /comprehensive\s*test/i.test(rawTitle);
    const isSelfCheck = /self[\s\-_]*check/i.test(rawTitle) || 
                        /self[\s\-_]*check/i.test(rawUnitId) || 
                        /^sc\d*/i.test(rawUnitId);

    let unitNum = rawUnitNum;
    let unitDisplayTitle = rawTitle;

    if (unitNum === 0 || isTestYourself || isSelfCheck) {
      unitNum = 0;
      if (isTestYourself) {
        const numMatch = (rawTitle + ' ' + rawUnitId).match(/test\s*yourself\s*(\d+)/i) || 
                         rawUnitId.match(/ty(\d+)/i) || 
                         rawTitle.match(/\d+/);
        const testNum = numMatch ? (numMatch[1] || numMatch[0]) : clusterNumber;
        unitDisplayTitle = `Test Yourself ${testNum}`;
      } else if (isSelfCheck) {
        const numMatch = (rawTitle + ' ' + rawUnitId).match(/self[\s\-_]*check\s*(\d+)/i) || 
                         rawUnitId.match(/sc(\d+)/i) || 
                         rawTitle.match(/\d+/);
        const checkNum = numMatch ? (numMatch[1] || numMatch[0]) : clusterNumber;
        unitDisplayTitle = `Self-check ${checkNum}`;
      } else {
        unitDisplayTitle = grade >= 6 ? `Test Yourself ${clusterNumber}` : `Self-check ${clusterNumber}`;
      }
    } else {
      if (!/^Unit\s+\d+/i.test(unitDisplayTitle)) {
        unitDisplayTitle = `Unit ${unitNum}: ${rawTitle}`;
      }
    }

    let sections = Array.isArray(u.sections) ? u.sections : [];
    if (sections.length === 0) {
      if (Array.isArray(u.exercises) && u.exercises.length > 0) {
        sections = [{ section_id: 'exercises', section_title: 'Bài tập', exercises: u.exercises }];
      } else if (Array.isArray(u.questions) && u.questions.length > 0) {
        sections = [{ section_id: 'questions', section_title: 'Câu hỏi', exercises: [{ exercise_id: `ex_${unitNum}`, game_mechanic: 'multiple_choice', questions: u.questions }] }];
      }
    }

    sections.forEach((sec: any) => {
      const secId = sec.section_id || sec.id || '';
      const secTitle = sec.section_title || sec.section_name || sec.title || '';

      let exercises = Array.isArray(sec.exercises) ? sec.exercises : [];
      if (exercises.length === 0 && Array.isArray(sec.questions) && sec.questions.length > 0) {
        exercises = [{ exercise_id: `ex_${secId || 'sec'}`, game_mechanic: 'multiple_choice', questions: sec.questions }];
      }

      exercises.forEach((ex: any) => {
        const mechanic = ex.exercise_type || ex.game_mechanic || ex.type || 'multiple_choice';
        const instVi = ex.instruction || ex.instruction_vi || ex.instruction_en || '';
        const instEn = ex.instruction_en || ex.instruction || '';
        const wordBank = (ex.word_bank || []).map((w: any) =>
          typeof w === 'object' ? (w.text || w.id) : String(w)
        );
        const passage = ex.reading_passage || ex.passage_context || (ex.dialogue_lines ? ex.dialogue_lines.join('\n') : '');

        // 1. Multiple choice, fill_in_blank, fill_in_chars, true_false, word_bank_fill, sentence_reorder
        if (Array.isArray(ex.questions)) {
          ex.questions.forEach((q: any, qIdx: number) => {
            totalRawCount++;
            const hasExplicitText = Boolean(q.question_text || q.question || q.prompt_text || q.prompt || q.sentence);
            const hasAnswers = Boolean((Array.isArray(q.options) && q.options.length > 0) || q.correct_answer !== undefined || q.correctAnswer !== undefined || q.answer !== undefined);

            // Only skip audio/image if it does not have playable text and options
            if (!hasExplicitText || !hasAnswers) {
              if (isAudioConversationQuestion(q, ex, sec)) {
                skippedAudioCount++;
                return;
              }
              if (isImageQuestion(q, ex, sec)) {
                skippedImageCount++;
                return;
              }
            }

            const qId = `${ex.exercise_id || 'ex'}_q${q.question_id || (qIdx + 1)}`;
            let prompt = q.question_text || q.question || q.prompt_text || q.prompt || q.sentence || q.content || '';
            if (!prompt && q.speaker_a) {
              prompt = `${q.speaker_a}\n${q.speaker_b_prompt || '___'}`;
            } else if (!prompt && q.name) {
              prompt = `Học sinh: ${q.name} - Thông tin tuổi và quốc tịch`;
            } else if (!prompt && q.template_text) {
              prompt = q.template_text;
            } else if (!prompt && q.shuffled_parts) {
              prompt = `Sắp xếp từ: [ ${q.shuffled_parts.join(' / ')} ]`;
            } else if (!prompt) {
              prompt = `Câu hỏi số ${q.label || qIdx + 1}`;
            }

            const audioTranscript = q.simulated_audio?.full_transcript || ex.simulated_audio?.full_transcript || '';
            const imageDesc = q.image_description || q.character_image || '';
            const explanation = q.explanation || q.explanation_vi || ex.explanation_vi || ex.explanation || '';

            // Determine options and answerIndex
            let options: string[] = [];
            let answerIndex = 0;
            let correctText = '';

            const rawCorr = q.correct_answer !== undefined
              ? q.correct_answer
              : (q.correctAnswer !== undefined ? q.correctAnswer : q.answer);
            const corrStr = String(rawCorr ?? '').trim();

            if (Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt: any) =>
                typeof opt === 'object' ? (opt.text || opt.image_description || opt.id) : String(opt)
              );

              // 1. Direct match
              let found = options.findIndex(opt => opt.trim().toLowerCase() === corrStr.toLowerCase());

              // 2. Letter prefix match: e.g. corrStr is "a" and option is "a. bike" or "a) bike"
              if (found < 0 && /^[a-f]$/i.test(corrStr)) {
                const letter = corrStr.toLowerCase();
                found = options.findIndex(opt => {
                  const clean = opt.trim().toLowerCase();
                  return clean.startsWith(`${letter}.`) || clean.startsWith(`${letter})`) || clean.startsWith(`${letter} `);
                });
              }

              // 3. Substring match
              if (found < 0 && corrStr.length > 0) {
                found = options.findIndex(opt => {
                  const clean = opt.trim().toLowerCase();
                  const stripped = clean.replace(/^[a-f][.)\s]\s*/i, '');
                  return stripped === corrStr.toLowerCase() || clean.includes(corrStr.toLowerCase());
                });
              }

              if (found >= 0) {
                answerIndex = found;
                correctText = options[found];
              } else {
                answerIndex = 0;
                correctText = options[0] || corrStr;
              }
            } else if (mechanic === 'true_false' || (corrStr && /^(true|false|đúng|sai)/i.test(corrStr))) {
              options = ['True (Đúng)', 'False (Sai)'];
              const isTrue = rawCorr === true || /^true/i.test(corrStr) || /^đúng/i.test(corrStr);
              answerIndex = isTrue ? 0 : 1;
              correctText = options[answerIndex];
            } else if (wordBank.length > 0) {
              options = [...wordBank];
              correctText = corrStr;
              const found = options.findIndex(w => w.toLowerCase() === correctText.toLowerCase());
              if (found >= 0) answerIndex = found;
              else {
                options.unshift(correctText);
                answerIndex = 0;
              }
            } else if (q.shuffled_parts && corrStr) {
              correctText = corrStr;
              const fake1 = [...q.shuffled_parts].reverse().join(' ') + (q.punctuation || '.');
              const fake2 = [...q.shuffled_parts].sort().join(' ') + (q.punctuation || '.');
              options = [correctText, fake1, fake2].filter((v, i, a) => a.indexOf(v) === i);
              if (options.length < 4) options.push('Lựa chọn khác');
              answerIndex = 0;
            } else if (corrStr) {
              correctText = corrStr;
              const siblingAnswers = (ex.questions || [])
                .map((sq: any) => String(sq.correct_answer || sq.correctAnswer || sq.answer || '').trim())
                .filter((s: string) => s && s.toLowerCase() !== correctText.toLowerCase());

              const uniqueSiblings: string[] = Array.from(new Set<string>(siblingAnswers));
              let pool: string[] = [...uniqueSiblings];
              if (pool.length < 3) {
                const distractors = COMMON_DISTRACTORS.filter(d => d.toLowerCase() !== correctText.toLowerCase());
                pool = [...pool, ...distractors];
              }

              const choices: string[] = [correctText, ...pool.slice(0, 3)];
              const offset = (qIdx % choices.length);
              const rotated: string[] = [...choices.slice(offset), ...choices.slice(0, offset)];
              options = rotated;
              answerIndex = rotated.indexOf(correctText);
            } else if (q.correct_age && q.correct_country) {
              correctText = `${q.name}: ${q.correct_age[0]} tuổi, ${q.correct_country}`;
              options = [correctText, `${q.name}: 10 tuổi, England`, `${q.name}: 7 tuổi, Canada`];
              answerIndex = 0;
            } else {
              options = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
              answerIndex = 0;
              correctText = options[0];
            }

            questions.push({
              id: qId,
              question: prompt,
              options,
              answerIndex,
              correctAnswer: correctText,
              explanation,
              type: mechanic,
              category: `${secTitle} • ${instVi || instEn || 'Bài tập'}`,
              unitNumber: unitNum,
              unitTitle: unitDisplayTitle,
              sectionId: secId,
              sectionTitle: secTitle,
              instructionEn: instEn,
              instructionVi: instVi,
              imageDescription: imageDesc,
              audioTranscript,
              readingPassage: passage,
              fullCompletedText: q.full_completed_text,
              shuffledParts: q.shuffled_parts
            });
          });
        }

        // 2. Matching pairs
        if (Array.isArray(ex.pairs)) {
          const allRights = ex.pairs.map((p: any) => p.right_text);
          ex.pairs.forEach((pair: any, pIdx: number) => {
            totalRawCount++;
            if (isAudioConversationQuestion(pair, ex, sec)) {
              skippedAudioCount++;
              return;
            }
            if (isImageQuestion(pair, ex, sec)) {
              skippedImageCount++;
              return;
            }

            const prompt = `Đọc và nối vế đúng với: "${pair.left_text}"`;
            const correctText = pair.right_text;
            const options = [...allRights];
            const answerIndex = options.indexOf(correctText);

            questions.push({
              id: `${ex.exercise_id}_pair${pIdx + 1}`,
              question: prompt,
              options,
              answerIndex: Math.max(0, answerIndex),
              correctAnswer: correctText,
              explanation: `Vế đúng là: "${pair.left_text}" ➔ "${pair.right_text}"`,
              type: 'matching',
              category: `${secTitle} • Đọc và nối`,
              unitNumber: unitNum,
              unitTitle: unitDisplayTitle,
              sectionId: secId,
              sectionTitle: secTitle,
              instructionEn: instEn,
              instructionVi: instVi,
              readingPassage: passage
            });
          });
        }

        // 3. Ordering pictures
        if (Array.isArray(ex.pictures)) {
          ex.pictures.forEach((pic: any, picIdx: number) => {
            totalRawCount++;
            if (isAudioConversationQuestion(pic, ex, sec)) {
              skippedAudioCount++;
              return;
            }
            if (isImageQuestion(pic, ex, sec)) {
              skippedImageCount++;
              return;
            }

            const prompt = `Nghe và chọn số thứ tự đúng cho tranh (${pic.picture_id?.toUpperCase() || picIdx + 1}): "${pic.image_description}"`;
            const options = ['Tranh số 1', 'Tranh số 2', 'Tranh số 3', 'Tranh số 4'];
            const answerIndex = Math.max(0, Math.min(3, (pic.correct_order_number || 1) - 1));

            questions.push({
              id: `${ex.exercise_id}_pic${picIdx + 1}`,
              question: prompt,
              options,
              answerIndex,
              correctAnswer: options[answerIndex],
              explanation: `Thứ tự đúng trong bài nghe là: Tranh số ${pic.correct_order_number}`,
              type: 'ordering_pictures',
              category: `${secTitle} • Nghe và đánh số`,
              unitNumber: unitNum,
              unitTitle: unitDisplayTitle,
              sectionId: secId,
              sectionTitle: secTitle,
              instructionEn: instEn,
              instructionVi: instVi,
              audioTranscript: ex.simulated_audio?.full_transcript || '',
              imageDescription: pic.image_description
            });
          });
        }
      });
    });
  });

  return {
    id: `cluster_grade${grade}_${clusterNumber}`,
    clusterNumber,
    title,
    description: `${description} • ${questions.length} câu hỏi tương tác`,
    grade,
    questions,
    itemsCount: questions.length,
    unitsCount,
    totalRawQuestions: totalRawCount,
    skippedImageQuestions: skippedImageCount,
    skippedAudioQuestions: skippedAudioCount,
    rawJson: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Recursively collects question-like objects from any deeply nested JSON structure
 */
function collectQuestionsRecursively(obj: any, collected: any[] = [], depth: number = 0): any[] {
  if (!obj || typeof obj !== 'object' || depth > 10) return collected;
  if (Array.isArray(obj)) {
    obj.forEach(item => collectQuestionsRecursively(item, collected, depth + 1));
    return collected;
  }
  const hasPrompt = Boolean(
    obj.question_text || obj.question || obj.prompt || obj.prompt_text || obj.sentence || 
    obj.cauHoi || obj.cau_hoi || obj.câu_hỏi || obj.content
  );
  const hasOptionsOrAnswer = Boolean(
    (Array.isArray(obj.options) && obj.options.length > 0) ||
    (Array.isArray(obj.choices) && obj.choices.length > 0) ||
    (Array.isArray(obj.answers) && obj.answers.length > 0) ||
    (Array.isArray(obj.dapAn) && obj.dapAn.length > 0) ||
    obj.correctAnswer !== undefined ||
    obj.correct_answer !== undefined ||
    obj.answer !== undefined ||
    obj.answerIndex !== undefined ||
    obj.dapAnDung !== undefined ||
    obj.word_bank ||
    obj.pairs
  );

  if (hasPrompt && hasOptionsOrAnswer) {
    collected.push(obj);
    return collected;
  }

  for (const key of Object.keys(obj)) {
    // Avoid recursing into raw large strings
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      collectQuestionsRecursively(obj[key], collected, depth + 1);
    }
  }
  return collected;
}

/**
 * Intelligent parser that extracts questions from any PDF-extracted JSON structure,
 * exported cluster data, standard quiz arrays, or official Global Success workbooks.
 */
export function parseExerciseJson(
  rawInput: any,
  clusterNumber: number,
  grade: number
): { cluster: ExerciseCluster; error?: string } {
  try {
    let parsed: any = rawInput;
    if (typeof rawInput === 'string') {
      let cleaned = rawInput.trim();
      if (!cleaned) {
        return {
          cluster: createEmptyCluster(clusterNumber, grade),
          error: 'Dữ liệu JSON rỗng. Vui lòng dán mã JSON câu hỏi bài tập.'
        };
      }

      // 1. Strip markdown code fences if copied from AI/chat (```json ... ``` or ``` ... ```)
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
      }

      // 2. Strip Byte Order Mark (BOM)
      if (cleaned.charCodeAt(0) === 0xFEFF) {
        cleaned = cleaned.slice(1).trim();
      }

      try {
        parsed = JSON.parse(cleaned);
      } catch (err: any) {
        // Attempt lenient recovery: remove trailing commas before } or ]
        try {
          const lenient = cleaned.replace(/,\s*([}\]])/g, '$1');
          parsed = JSON.parse(lenient);
        } catch {
          return {
            cluster: createEmptyCluster(clusterNumber, grade),
            error: `Lỗi cú pháp JSON: ${err.message || 'Mã JSON không đúng định dạng chuẩn'}. Vui lòng kiểm tra dấu ngoặc { } hoặc [ ].`
          };
        }
      }
    }

    if (!parsed) {
      return {
        cluster: createEmptyCluster(clusterNumber, grade),
        error: 'Dữ liệu JSON rỗng.'
      };
    }

    // 3. Unwrap container objects (e.g. { cluster: ... }, { workbook: ... }, { data: ... })
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.cluster && typeof parsed.cluster === 'object') parsed = parsed.cluster;
      else if (parsed.workbook && typeof parsed.workbook === 'object') parsed = parsed.workbook;
      else if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) && (parsed.data.units || parsed.data.questions || parsed.data.clusters || parsed.data.exercises)) parsed = parsed.data;
      else if (parsed.result && typeof parsed.result === 'object' && !Array.isArray(parsed.result) && (parsed.result.units || parsed.result.questions || parsed.result.clusters)) parsed = parsed.result;
      else if (parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload) && (parsed.payload.units || parsed.payload.questions)) parsed = parsed.payload;
    }

    // 4. Handle array of clusters or { clusters: [...] }
    if (parsed.clusters && Array.isArray(parsed.clusters)) {
      const match = parsed.clusters.find((c: any) => c.clusterNumber === clusterNumber) || 
                    parsed.clusters.find((c: any) => c.cluster_number === clusterNumber) ||
                    parsed.clusters[clusterNumber - 1] || 
                    parsed.clusters[0];
      if (match) parsed = match;
    } else if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].units || parsed[0].questions)) {
      const match = parsed.find((c: any) => c.clusterNumber === clusterNumber) || 
                    parsed.find((c: any) => c.cluster_number === clusterNumber) ||
                    parsed[clusterNumber - 1] || 
                    parsed[0];
      if (match) parsed = match;
    }

    // 5. Check if it is the official Workbook format with units array
    if (parsed.units && Array.isArray(parsed.units)) {
      const wbCluster = parseWorkbookCluster(parsed, clusterNumber, grade);
      if (wbCluster.questions && wbCluster.questions.length > 0) {
        return { cluster: wbCluster };
      }
    }

    // 6. Check if parsed is an array of units
    if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].unit_id || parsed[0].unit_number || parsed[0].sections)) {
      const wbCluster = parseWorkbookCluster({ units: parsed }, clusterNumber, grade);
      if (wbCluster.questions && wbCluster.questions.length > 0) {
        return { cluster: wbCluster };
      }
    }

    // 7. Extract raw items from generic / simplified formats
    let detectedTitle = parsed.title || parsed.name || parsed.cluster_name || parsed.module_name || `Học phần bài tập ${clusterNumber}`;
    let detectedDescription = parsed.description || '';
    let rawItems: any[] = [];

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (typeof parsed === 'object') {
      const potentialLists = [
        parsed.questions,
        parsed.exercises,
        parsed.items,
        parsed.quizzes,
        parsed.cauHoi,
        parsed.cau_hoi,
        parsed['câu_hỏi'],
        parsed.baiTap,
        parsed.bai_tap,
        parsed['bài_tập'],
        parsed.danhSachCauHoi,
        parsed.danh_sach_cau_hoi,
        parsed.danhSach,
        parsed.content,
        parsed.data,
        parsed.tasks,
        parsed.tests,
        parsed.list,
        parsed.rows,
        parsed.records
      ];

      for (const candidate of potentialLists) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          rawItems = candidate;
          break;
        } else if (candidate && typeof candidate === 'object' && Object.keys(candidate).length > 0) {
          const values = Object.values(candidate);
          if (values.length > 0 && typeof values[0] === 'object') {
            rawItems = values;
            break;
          }
        }
      }

      // If parts array
      if (rawItems.length === 0 && Array.isArray(parsed.parts)) {
        parsed.parts.forEach((p: any) => {
          if (Array.isArray(p.questions)) rawItems.push(...p.questions);
          else if (Array.isArray(p.exercises)) rawItems.push(...p.exercises);
          else if (Array.isArray(p.items)) rawItems.push(...p.items);
          else rawItems.push(p);
        });
      }

      // If vocabulary array
      if (rawItems.length === 0 && Array.isArray(parsed.vocabulary)) {
        parsed.vocabulary.forEach((v: any) => {
          rawItems.push({
            question: `Từ "${v.word}" có nghĩa là gì?`,
            options: [v.meaning, 'Nghĩa khác A', 'Nghĩa khác B', 'Nghĩa khác C'],
            answerIndex: 0,
            explanation: `${v.word} (${v.phonetic || ''}): ${v.meaning}. Ví dụ: ${v.example || ''}`
          });
        });
      }

      // If units had flat questions or exercises
      if (rawItems.length === 0 && Array.isArray(parsed.units)) {
        parsed.units.forEach((u: any) => {
          if (Array.isArray(u.questions)) rawItems.push(...u.questions);
          else if (Array.isArray(u.exercises)) rawItems.push(...u.exercises);
          else if (Array.isArray(u.sections)) {
            u.sections.forEach((s: any) => {
              if (Array.isArray(s.questions)) rawItems.push(...s.questions);
              else if (Array.isArray(s.exercises)) rawItems.push(...s.exercises);
            });
          }
        });
      }

      // If dictionary object of questions (e.g. { "q1": {...}, "q2": {...} })
      if (rawItems.length === 0) {
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'object' && values[0] !== null) {
          const sample = values[0] as any;
          if (sample.question || sample.prompt || sample.prompt_text || sample.options || sample.cauHoi) {
            rawItems = values;
          }
        }
      }

      // 8. Recursive Fallback Search: Search all keys and arrays for question-like objects
      if (rawItems.length === 0) {
        const deeplyFound = collectQuestionsRecursively(parsed);
        if (deeplyFound.length > 0) {
          rawItems = deeplyFound;
        }
      }
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return {
        cluster: createEmptyCluster(clusterNumber, grade, typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput, null, 2)),
        error: 'Không tìm thấy câu hỏi bài tập nào trong dữ liệu JSON. Vui lòng kiểm tra file JSON có chứa mảng danh sách câu hỏi [ ... ] hoặc đối tượng có trường questions / exercises / units.'
      };
    }

    // Normalize each question
    const questions: ExerciseQuestion[] = [];
    let totalRawCount = 0;
    let skippedAudioCount = 0;
    let skippedImageCount = 0;

    rawItems.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;
      totalRawCount++;

      // Check if this item is already an interactive question with explicit options
      const rawOpts = item.options || item.choices || item.answers || item.dapAn || item.dap_an || item.cacDapAn || item.luaChon;
      const hasExplicitOptions = Array.isArray(rawOpts) && rawOpts.length > 1;

      // Only skip audio/image if it does NOT already have interactive multiple-choice options
      if (!hasExplicitOptions) {
        if (isAudioConversationQuestion(item)) {
          skippedAudioCount++;
          return;
        }
        if (isImageQuestion(item)) {
          skippedImageCount++;
          return;
        }
      }

      const qText = item.question_text || item.question || item.prompt || item.prompt_text || item.content || 
                    item.cauHoi || item.cau_hoi || item['câu_hỏi'] || item.title || 
                    item.sentence || item.full_completed_text || `Câu hỏi số ${idx + 1}`;

      let rawOptions: any[] = rawOpts || [];
      if (!Array.isArray(rawOptions) && typeof rawOptions === 'object') {
        rawOptions = Object.values(rawOptions);
      }
      const options: string[] = Array.isArray(rawOptions) ? rawOptions.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          return String(opt.text || opt.title || opt.content || opt.name || opt.id || JSON.stringify(opt)).trim();
        }
        return String(opt).trim();
      }) : [];

      let answerIndex = 0;
      const rawAns = item.answerIndex !== undefined ? item.answerIndex : 
                    (item.answer !== undefined ? item.answer : 
                    (item.correctAnswer !== undefined ? item.correctAnswer : 
                    (item.correct_answer !== undefined ? item.correct_answer : 
                    (item.dapAnDung !== undefined ? item.dapAnDung : item.dap_an_dung))));

      if (typeof rawAns === 'number') {
        answerIndex = Math.max(0, Math.min(rawAns, Math.max(0, options.length - 1)));
      } else if (typeof rawAns === 'string') {
        const trimmed = rawAns.trim().toUpperCase();
        if (trimmed === 'A' || trimmed === '1') answerIndex = 0;
        else if (trimmed === 'B' || trimmed === '2') answerIndex = 1;
        else if (trimmed === 'C' || trimmed === '3') answerIndex = 2;
        else if (trimmed === 'D' || trimmed === '4') answerIndex = 3;
        else {
          const foundIdx = options.findIndex(opt => opt.toLowerCase() === rawAns.toLowerCase() || opt.toLowerCase().includes(rawAns.toLowerCase()));
          if (foundIdx >= 0) {
            answerIndex = foundIdx;
          } else {
            const num = parseInt(rawAns, 10);
            if (!isNaN(num) && num >= 0 && num < options.length) {
              answerIndex = num;
            }
          }
        }
      } else if (typeof rawAns === 'boolean') {
        answerIndex = rawAns ? 0 : 1;
        if (options.length === 0) options.push('True (Đúng)', 'False (Sai)');
      }

      // If no options but correct answer exists, generate reasonable options
      if (options.length === 0) {
        if (rawAns !== undefined && rawAns !== null && String(rawAns).trim()) {
          const corr = String(rawAns).trim();
          const distractors = COMMON_DISTRACTORS.filter(d => d.toLowerCase() !== corr.toLowerCase()).slice(0, 3);
          options.push(corr, ...distractors);
          answerIndex = 0;
        } else {
          options.push('✓ True (Đúng)', '✗ False (Sai)');
          answerIndex = 0;
        }
      }

      let qUnitNum: number | undefined = undefined;
      let qUnitTitle: string | undefined = undefined;

      const rawUnitStr = [
        item.unit,
        item.unitTitle,
        item.unit_title,
        item.unit_name,
        item.category,
        item.section,
        item.section_title,
        item.sectionTitle,
        item.topic,
        item.part
      ].filter(Boolean).map(String).join(' ');

      const idStr = String(item.id || item.unit_id || item.exercise_id || '');

      const isItemTY = /test\s*yourself/i.test(rawUnitStr) || 
                       /test[\s\-_]*yourself/i.test(idStr) || 
                       /^ty\d*/i.test(idStr) ||
                       /comprehensive\s*test/i.test(rawUnitStr);

      const isItemSC = /self[\s\-_]*check/i.test(rawUnitStr) || 
                       /self[\s\-_]*check/i.test(idStr) || 
                       /^sc\d*/i.test(idStr);

      if (isItemTY) {
        qUnitNum = 0;
        const numMatch = (rawUnitStr + ' ' + idStr).match(/test\s*yourself\s*(\d+)/i) || 
                         idStr.match(/ty(\d+)/i) || 
                         rawUnitStr.match(/\d+/);
        const tyNum = numMatch ? (numMatch[1] || numMatch[0]) : clusterNumber;
        qUnitTitle = `Test Yourself ${tyNum}`;
      } else if (isItemSC) {
        qUnitNum = 0;
        const numMatch = (rawUnitStr + ' ' + idStr).match(/self[\s\-_]*check\s*(\d+)/i) || 
                         idStr.match(/sc(\d+)/i) || 
                         rawUnitStr.match(/\d+/);
        const scNum = numMatch ? (numMatch[1] || numMatch[0]) : clusterNumber;
        qUnitTitle = `Self-check ${scNum}`;
      } else {
        if (item.unitNumber !== undefined) qUnitNum = Number(item.unitNumber);
        else if (item.unit_number !== undefined) qUnitNum = Number(item.unit_number);
        else if (typeof item.unit === 'number') qUnitNum = item.unit;
        else if (typeof item.unit === 'string') {
          const m = item.unit.match(/\d+/);
          if (m) qUnitNum = parseInt(m[0], 10);
        }

        if (item.unitTitle) qUnitTitle = String(item.unitTitle);
        else if (item.unit_title) qUnitTitle = String(item.unit_title);
        else if (item.unit && typeof item.unit === 'string') qUnitTitle = item.unit;
        else if (item.section_title) qUnitTitle = item.section_title;
        else if (item.sectionTitle) qUnitTitle = item.sectionTitle;
        else if (item.category) qUnitTitle = item.category;
      }

      questions.push({
        id: item.id || `q_${clusterNumber}_${idx + 1}`,
        question: String(qText).trim(),
        options,
        answerIndex,
        correctAnswer: options[answerIndex] || String(rawAns || ''),
        explanation: item.explanation || item.explanation_vi || item.giaiThich || item.note || '',
        type: item.type || (options.length > 2 ? 'quiz' : 'true_false'),
        category: item.category || 'Bài tập trắc nghiệm',
        hint: item.hint || '',
        unitNumber: qUnitNum,
        unitTitle: qUnitTitle
      });
    });

    if (questions.length === 0) {
      return {
        cluster: createEmptyCluster(clusterNumber, grade, typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput, null, 2)),
        error: 'Không trích xuất được câu hỏi hợp lệ từ dữ liệu JSON. Vui lòng kiểm tra các câu hỏi có trường câu hỏi (question) và lựa chọn (options).'
      };
    }

    const cluster: ExerciseCluster = {
      id: `cluster_grade${grade}_${clusterNumber}`,
      clusterNumber,
      title: detectedTitle,
      description: detectedDescription || `Học phần gồm ${questions.length} câu hỏi bài tập`,
      grade,
      questions,
      itemsCount: questions.length,
      totalRawQuestions: totalRawCount,
      skippedImageQuestions: skippedImageCount,
      skippedAudioQuestions: skippedAudioCount,
      rawJson: typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput, null, 2),
      updatedAt: new Date().toISOString()
    };

    return { cluster };
  } catch (err: any) {
    return {
      cluster: createEmptyCluster(clusterNumber, grade),
      error: `Lỗi xử lý JSON: ${err.message || 'Không xác định'}`
    };
  }
}

export function createEmptyCluster(clusterNumber: number, grade: number, rawJson?: string): ExerciseCluster {
  return {
    id: `cluster_grade${grade}_${clusterNumber}`,
    clusterNumber,
    title: `Học phần bài tập ${clusterNumber}`,
    description: '',
    grade,
    questions: [],
    itemsCount: 0,
    rawJson: rawJson || '',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Creates default initial clusters (học phần) for a given grade.
 * For Grade 4, all 4 clusters are populated with the official Global Success workbooks (833 questions total).
 */
/**
 * Checks whether a cluster list contains the official full workbook data
 */
export function isOfficialGradeWorkbook(grade: number, clusters: ExerciseCluster[]): boolean {
  if (grade !== 4 && grade !== 7) return false;
  if (!Array.isArray(clusters) || clusters.length < 4) return false;
  const totalQuestions = clusters.reduce((acc, c) => acc + (c.questions?.length || 0), 0);
  return totalQuestions >= 200;
}

/**
 * Creates default initial clusters (học phần) for a given grade.
 * - Grade 4: 4 official Global Success workbooks (833 questions).
 * - Grade 7: 4 official Global Success workbooks (910 questions).
 * - Other grades: Returns [] (empty) so the UI displays the empty state "Chưa có dữ liệu bài tập".
 */
export function createDefaultClusters(grade: number, count: number = 4): ExerciseCluster[] {
  if (grade === 4) {
    return [
      parseWorkbookCluster(grade4Cluster1Data, 1, 4),
      parseWorkbookCluster(grade4Cluster2Data, 2, 4),
      parseWorkbookCluster(grade4Cluster3Data, 3, 4),
      parseWorkbookCluster(grade4Cluster4Data, 4, 4)
    ].slice(0, count);
  }

  if (grade === 7) {
    return [
      parseWorkbookCluster(grade7Cluster1Data, 1, 7),
      parseWorkbookCluster(grade7Cluster2Data, 2, 7),
      parseWorkbookCluster(grade7Cluster3Data, 3, 7),
      parseWorkbookCluster(grade7Cluster4Data, 4, 7)
    ].slice(0, count);
  }

  // Nếu chưa có bài tập cho lớp này, trả về danh sách rỗng để hiển thị thông báo chưa có dữ liệu
  return [];
}

export interface BuiltInClusterTemplate {
  grade: number;
  clusterNumber: number;
  name: string;
  description: string;
  data: any;
}

export const BUILT_IN_WORKBOOK_TEMPLATES: BuiltInClusterTemplate[] = [
  { grade: 4, clusterNumber: 1, name: 'Lớp 4 - Cụm 1: Units 1 - 5 & Self-check 1', description: 'Từ vựng, mẫu câu và bài tập Unit 1 đến 5', data: grade4Cluster1Data },
  { grade: 4, clusterNumber: 2, name: 'Lớp 4 - Cụm 2: Units 6 - 10 & Self-check 2', description: 'Từ vựng, mẫu câu và bài tập Unit 6 đến 10', data: grade4Cluster2Data },
  { grade: 4, clusterNumber: 3, name: 'Lớp 4 - Cụm 3: Units 11 - 15 & Self-check 3', description: 'Từ vựng, mẫu câu và bài tập Unit 11 đến 15', data: grade4Cluster3Data },
  { grade: 4, clusterNumber: 4, name: 'Lớp 4 - Cụm 4: Units 16 - 20 & Self-check 4', description: 'Từ vựng, mẫu câu và bài tập Unit 16 đến 20', data: grade4Cluster4Data },
  { grade: 7, clusterNumber: 1, name: 'Lớp 7 - Học phần 1: Units 1 - 3 & Test Yourself 1', description: 'Học phần 1 chương trình Global Success Lớp 7', data: grade7Cluster1Data },
  { grade: 7, clusterNumber: 2, name: 'Lớp 7 - Học phần 2: Units 4 - 6 & Test Yourself 2', description: 'Học phần 2 chương trình Global Success Lớp 7', data: grade7Cluster2Data },
  { grade: 7, clusterNumber: 3, name: 'Lớp 7 - Học phần 3: Units 7 - 9 & Test Yourself 3', description: 'Học phần 3 chương trình Global Success Lớp 7', data: grade7Cluster3Data },
  { grade: 7, clusterNumber: 4, name: 'Lớp 7 - Học phần 4: Units 10 - 12 & Test Yourself 4', description: 'Học phần 4 chương trình Global Success Lớp 7', data: grade7Cluster4Data },
];

/**
 * Checks whether an exercise question belongs to a "Test Yourself" assessment.
 */
export function isTestYourselfQuestion(q: ExerciseQuestion, grade?: number): boolean {
  const title = String(q.unitTitle || '');
  const cat = String(q.category || '');
  const sec = String(q.sectionTitle || '');
  const id = String(q.id || '');
  if (/test\s*yourself/i.test(title) || /test\s*yourself/i.test(cat) || /test\s*yourself/i.test(sec)) return true;
  if (/test[\s\-_]*yourself/i.test(id) || /^ty\d*/i.test(id)) return true;
  if (/comprehensive\s*test/i.test(title) || /comprehensive\s*test/i.test(sec) || /comprehensive\s*test/i.test(cat)) return true;
  if (q.unitNumber === 0 && (!grade || grade >= 6)) return true;
  return false;
}

/**
 * Checks whether an exercise question belongs to a "Self-check" assessment.
 */
export function isSelfCheckQuestion(q: ExerciseQuestion, grade?: number): boolean {
  const title = String(q.unitTitle || '');
  const cat = String(q.category || '');
  const sec = String(q.sectionTitle || '');
  const id = String(q.id || '');
  if (/self[\s\-_]*check/i.test(title) || /self[\s\-_]*check/i.test(cat) || /self[\s\-_]*check/i.test(sec)) return true;
  if (/self[\s\-_]*check/i.test(id) || /^sc\d*/i.test(id)) return true;
  if (q.unitNumber === 0 && grade && grade <= 5) return true;
  return false;
}

/**
 * Alias for isAudioConversationQuestion
 */
export function isDialogueAudioQuestion(q: any, ex?: any, sec?: any): boolean {
  if (isImageQuestion(q, ex, sec)) return false; // Mutually exclusive with image question
  return isAudioConversationQuestion(q, ex, sec);
}

export interface ExerciseFilterStats {
  originalTotal: number;
  removedImagesCount: number;
  removedDialoguesCount: number;
  validQuestions: ExerciseQuestion[];
}

/**
 * Filters out image and dialogue-based questions from an exercise question list
 */
export function filterExercisesForOnline(questions: ExerciseQuestion[]): ExerciseFilterStats {
  const originalTotal = (questions || []).length;
  let removedImagesCount = 0;
  let removedDialoguesCount = 0;
  const validQuestions: ExerciseQuestion[] = [];

  (questions || []).forEach(q => {
    // If it has text question and interactive options, it is completely playable!
    if (q.question && Array.isArray(q.options) && q.options.length > 0) {
      validQuestions.push(q);
      return;
    }

    if (isImageQuestion(q)) {
      removedImagesCount++;
    } else if (isDialogueAudioQuestion(q)) {
      removedDialoguesCount++;
    } else {
      validQuestions.push(q);
    }
  });

  return {
    originalTotal,
    removedImagesCount,
    removedDialoguesCount,
    validQuestions: validQuestions.length > 0 ? validQuestions : (questions || [])
  };
}


