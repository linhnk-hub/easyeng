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
 * Robust parser for PDF Workbook structures (such as Global Success Sách bài tập)
 * Supporting units -> sections (A-F) -> exercises -> questions, pairs, pictures
 */
export function parseWorkbookCluster(
  data: any,
  clusterNumber: number = 1,
  defaultGrade: number = 4
): ExerciseCluster {
  let grade = defaultGrade;
  if (data.book_title) {
    const match = String(data.book_title).match(/(?:lớp|tiếng anh|grade)\s*(\d+)/i);
    if (match) grade = parseInt(match[1], 10);
  }

  const title = data.cluster_name
    ? `Học phần ${clusterNumber}: ${data.cluster_name}`
    : (data.title || `Học phần bài tập ${clusterNumber}`);

  const unitsCount = Array.isArray(data.units) ? data.units.length : 0;
  const description = `${data.book_title || 'Sách bài tập Tiếng Anh'} • Trọn bộ ${unitsCount} bài học`;

  const questions: ExerciseQuestion[] = [];

  (data.units || []).forEach((u: any, uIdx: number) => {
    const unitNum = u.unit_number !== undefined ? u.unit_number : (uIdx + 1);
    const unitTitle = u.unit_title || `Unit ${unitNum}`;

    (u.sections || []).forEach((sec: any) => {
      const secId = sec.section_id || '';
      const secTitle = sec.section_title || '';

      (sec.exercises || []).forEach((ex: any) => {
        const mechanic = ex.game_mechanic || 'multiple_choice';
        const instVi = ex.instruction_vi || '';
        const instEn = ex.instruction_en || '';
        const wordBank = (ex.word_bank || []).map((w: any) =>
          typeof w === 'object' ? (w.text || w.id) : String(w)
        );
        const passage = ex.reading_passage || (ex.dialogue_lines ? ex.dialogue_lines.join('\n') : '');

        // 1. Multiple choice, fill_in_blank, fill_in_chars, true_false, word_bank_fill, sentence_reorder
        if (Array.isArray(ex.questions)) {
          ex.questions.forEach((q: any, qIdx: number) => {
            const qId = q.question_id || `${ex.exercise_id}_q${qIdx + 1}`;
            let prompt = q.prompt_text || q.sentence || '';
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
            const explanation = q.explanation_vi || ex.explanation_vi || '';

            // Determine options and answerIndex
            let options: string[] = [];
            let answerIndex = 0;
            let correctText = '';

            if (mechanic === 'true_false') {
              options = ['✓ True (Đúng)', '✗ False (Sai)'];
              answerIndex = q.correct_answer === true ? 0 : 1;
              correctText = q.correct_answer ? 'True' : 'False';
            } else if (Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt: any) =>
                typeof opt === 'object' ? (opt.text || opt.image_description || opt.id) : String(opt)
              );
              const corr = q.correct_answer !== undefined ? q.correct_answer : q.answer;
              correctText = String(corr ?? '');

              // Find matching option
              const found = options.findIndex(opt =>
                opt.toLowerCase() === correctText.toLowerCase() ||
                (typeof corr === 'string' && corr.length === 1 && opt.toLowerCase().startsWith(corr.toLowerCase() + '.'))
              );
              if (found >= 0) {
                answerIndex = found;
              } else if (typeof q.correct_answer === 'string' && q.options[0]?.id) {
                const idMatch = q.options.findIndex((o: any) => o.id === q.correct_answer);
                if (idMatch >= 0) answerIndex = idMatch;
              }
            } else if (wordBank.length > 0) {
              options = [...wordBank];
              correctText = String(q.correct_answer || '');
              const found = options.findIndex(w => w.toLowerCase() === correctText.toLowerCase());
              if (found >= 0) answerIndex = found;
            } else if (q.shuffled_parts && q.correct_answer) {
              correctText = q.correct_answer;
              const fake1 = [...q.shuffled_parts].reverse().join(' ') + (q.punctuation || '.');
              const fake2 = [...q.shuffled_parts].sort().join(' ') + (q.punctuation || '.');
              options = [correctText, fake1, fake2].filter((v, i, a) => a.indexOf(v) === i);
              if (options.length < 4) options.push('Lựa chọn khác');
              answerIndex = 0;
            } else if (q.correct_answer) {
              correctText = String(q.correct_answer);
              const distractors = COMMON_DISTRACTORS.filter(d => d.toLowerCase() !== correctText.toLowerCase()).slice(0, 3);
              options = [correctText, ...distractors];
              answerIndex = 0;
            } else if (q.correct_age && q.correct_country) {
              correctText = `${q.name}: ${q.correct_age[0]} tuổi, ${q.correct_country}`;
              options = [correctText, `${q.name}: 10 tuổi, England`, `${q.name}: 7 tuổi, Canada`];
              answerIndex = 0;
            } else {
              options = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C'];
              answerIndex = 0;
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
              unitTitle: `Unit ${unitNum}: ${unitTitle}`,
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
              unitTitle: `Unit ${unitNum}: ${unitTitle}`,
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
              unitTitle: `Unit ${unitNum}: ${unitTitle}`,
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
    rawJson: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent parser that extracts questions from any PDF-extracted JSON structure
 */
export function parseExerciseJson(
  rawInput: any,
  clusterNumber: number,
  grade: number
): { cluster: ExerciseCluster; error?: string } {
  try {
    let parsed: any = rawInput;
    if (typeof rawInput === 'string') {
      try {
        parsed = JSON.parse(rawInput);
      } catch (err: any) {
        return {
          cluster: createEmptyCluster(clusterNumber, grade),
          error: `Lỗi cú pháp JSON: ${err.message || 'Mã JSON không hợp lệ'}`
        };
      }
    }

    if (!parsed) {
      return {
        cluster: createEmptyCluster(clusterNumber, grade),
        error: 'Dữ liệu JSON rỗng.'
      };
    }

    // Check if it is the official Workbook format with units array
    if (parsed.units && Array.isArray(parsed.units)) {
      const cluster = parseWorkbookCluster(parsed, clusterNumber, grade);
      return { cluster };
    }

    let detectedTitle = `Học phần bài tập ${clusterNumber}`;
    let detectedDescription = '';
    let rawItems: any[] = [];

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (typeof parsed === 'object') {
      if (parsed.title) detectedTitle = String(parsed.title);
      if (parsed.name) detectedTitle = String(parsed.name);
      if (parsed.cluster_name) detectedTitle = String(parsed.cluster_name);
      if (parsed.description) detectedDescription = String(parsed.description);

      if (Array.isArray(parsed.questions)) {
        rawItems = parsed.questions;
      } else if (Array.isArray(parsed.exercises)) {
        rawItems = parsed.exercises;
      } else if (Array.isArray(parsed.quizzes)) {
        rawItems = parsed.quizzes;
      } else if (Array.isArray(parsed.items)) {
        rawItems = parsed.items;
      } else if (Array.isArray(parsed.data)) {
        rawItems = parsed.data;
      } else if (Array.isArray(parsed.parts)) {
        parsed.parts.forEach((p: any) => {
          if (Array.isArray(p.questions)) rawItems.push(...p.questions);
          else if (Array.isArray(p.exercises)) rawItems.push(...p.exercises);
          else if (Array.isArray(p.items)) rawItems.push(...p.items);
          else rawItems.push(p);
        });
      } else if (parsed.vocabulary && Array.isArray(parsed.vocabulary)) {
        parsed.vocabulary.forEach((v: any) => {
          rawItems.push({
            question: `Từ "${v.word}" có nghĩa là gì?`,
            options: [v.meaning, 'Nghĩa khác A', 'Nghĩa khác B', 'Nghĩa khác C'],
            answerIndex: 0,
            explanation: `${v.word} (${v.phonetic || ''}): ${v.meaning}. Ví dụ: ${v.example || ''}`
          });
        });
      } else {
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'object') {
          rawItems = values;
        }
      }
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return {
        cluster: createEmptyCluster(clusterNumber, grade, typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput, null, 2)),
        error: 'Không tìm thấy danh sách câu hỏi / bài tập trong dữ liệu JSON. Vui lòng kiểm tra định dạng mảng [...] hoặc đối tượng có trường questions / units / exercises.'
      };
    }

    // Normalize each question
    const questions: ExerciseQuestion[] = [];

    rawItems.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      const qText = item.question || item.prompt || item.content || item.cauHoi || item.cau_hoi || item.title || item.sentence || `Câu hỏi số ${idx + 1}`;

      let rawOptions: any[] = item.options || item.choices || item.answers || item.dapAn || item.dap_an || [];
      if (!Array.isArray(rawOptions) && typeof rawOptions === 'object') {
        rawOptions = Object.values(rawOptions);
      }
      const options: string[] = Array.isArray(rawOptions) ? rawOptions.map(opt => String(opt).trim()) : [];

      let answerIndex = 0;
      const rawAns = item.answerIndex !== undefined ? item.answerIndex : (item.answer !== undefined ? item.answer : (item.correctAnswer !== undefined ? item.correctAnswer : item.dapAnDung));

      if (typeof rawAns === 'number') {
        answerIndex = Math.max(0, Math.min(rawAns, Math.max(0, options.length - 1)));
      } else if (typeof rawAns === 'string') {
        const trimmed = rawAns.trim().toUpperCase();
        if (trimmed === 'A') answerIndex = 0;
        else if (trimmed === 'B') answerIndex = 1;
        else if (trimmed === 'C') answerIndex = 2;
        else if (trimmed === 'D') answerIndex = 3;
        else {
          const foundIdx = options.findIndex(opt => opt.toLowerCase().includes(rawAns.toLowerCase()) || rawAns.toLowerCase().includes(opt.toLowerCase()));
          if (foundIdx >= 0) {
            answerIndex = foundIdx;
          } else {
            const num = parseInt(rawAns, 10);
            if (!isNaN(num) && num >= 0 && num < options.length) {
              answerIndex = num;
            }
          }
        }
      }

      questions.push({
        id: item.id || `q_${clusterNumber}_${idx + 1}`,
        question: String(qText).trim(),
        options: options.length > 0 ? options : ['Đúng', 'Sai'],
        answerIndex,
        explanation: item.explanation || item.giaiThich || item.note || '',
        type: item.type || (options.length > 0 ? 'quiz' : 'fill'),
        category: item.category || 'Bài tập PDF',
        hint: item.hint || ''
      });
    });

    const cluster: ExerciseCluster = {
      id: `cluster_grade${grade}_${clusterNumber}`,
      clusterNumber,
      title: detectedTitle,
      description: detectedDescription,
      grade,
      questions,
      itemsCount: questions.length,
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

