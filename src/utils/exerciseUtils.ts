import { ExerciseCluster, ExerciseQuestion } from '../types';
import grade4Cluster1Data from '../data/grade4_cluster1_workbook.json';
import grade4Cluster2Data from '../data/grade4_cluster2_workbook.json';
import grade4Cluster3Data from '../data/grade4_cluster3_workbook.json';
import grade4Cluster4Data from '../data/grade4_cluster4_workbook.json';

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
    let detectedDescription = `Bộ câu hỏi bài tập trích xuất từ tài liệu PDF - Lớp ${grade}`;
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
    description: `Bộ bài tập rèn luyện kỹ năng - Lớp ${grade}`,
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
export function createDefaultClusters(grade: number, count: number = 4): ExerciseCluster[] {
  const clusters: ExerciseCluster[] = [];

  for (let i = 1; i <= count; i++) {
    if (grade === 4) {
      if (i === 1) {
        clusters.push(parseWorkbookCluster(grade4Cluster1Data, 1, 4));
        continue;
      }
      if (i === 2) {
        clusters.push(parseWorkbookCluster(grade4Cluster2Data, 2, 4));
        continue;
      }
      if (i === 3) {
        clusters.push(parseWorkbookCluster(grade4Cluster3Data, 3, 4));
        continue;
      }
      if (i === 4) {
        clusters.push(parseWorkbookCluster(grade4Cluster4Data, 4, 4));
        continue;
      }
    }

    const sampleClusterConfigs = [
      {
        title: `Học phần ${i}: Unit 1 - Unit 5`,
        desc: `Rèn luyện ngữ pháp, từ vựng và kỹ năng trắc nghiệm các bài học đầu năm học - Lớp ${grade}.`,
        samples: [
          {
            question: 'Choose the correct word: "Where _____ you from?" - "I am from Vietnam."',
            options: ['A. is', 'B. are', 'C. am', 'D. be'],
            answerIndex: 1,
            explanation: 'Với chủ ngữ "you", ta sử dụng to-be là "are".'
          },
          {
            question: 'What is your favourite subject?',
            options: ['A. I like English', 'B. I am nine years old', 'C. It is on Monday', 'D. She is a pupil'],
            answerIndex: 0,
            explanation: 'Hỏi về môn học yêu thích (favourite subject) -> chọn câu trả lời liên quan môn học (English).'
          },
          {
            question: 'Which word means "trường học" in English?',
            options: ['A. Hospital', 'B. School', 'C. Park', 'D. Cinema'],
            answerIndex: 1,
            explanation: '"School" có nghĩa là trường học.'
          }
        ]
      },
      {
        title: `Học phần ${i}: Unit 6 - Unit 10`,
        desc: `Luyện tập các chủ đề hoạt động hằng ngày, thời gian và sở thích - Lớp ${grade}.`,
        samples: [
          {
            question: 'What time is it? - It is _____ o\'clock in the morning.',
            options: ['A. seven', 'B. clock', 'C. breakfast', 'D. at'],
            answerIndex: 0,
            explanation: '"It is seven o\'clock" = Bây giờ là 7 giờ.'
          },
          {
            question: 'What do you do on Sundays?',
            options: ['A. I am fine', 'B. I visit my grandparents', 'C. It is Sunday', 'D. Yes, I do'],
            answerIndex: 1,
            explanation: 'Hỏi về hoạt động làm vào ngày Chủ Nhật: "I visit my grandparents" (Tôi thăm ông bà).'
          }
        ]
      },
      {
        title: `Học phần ${i}: Unit 11 - Unit 15`,
        desc: `Nâng cao kỹ năng từ vựng về thức ăn, đồ uống, nghề nghiệp và địa điểm - Lớp ${grade}.`,
        samples: [
          {
            question: 'What would you like to drink? - "I\'d like some _____, please."',
            options: ['A. bread', 'B. orange juice', 'C. chicken', 'D. rice'],
            answerIndex: 1,
            explanation: 'Hỏi về đồ uống (to drink) -> chọn "orange juice" (nước cam).'
          },
          {
            question: 'Where does a doctor work?',
            options: ['A. In a factory', 'B. In a school', 'C. In a hospital', 'D. In a field'],
            answerIndex: 2,
            explanation: 'Bác sĩ làm việc trong bệnh viện (hospital).'
          }
        ]
      },
      {
        title: `Học phần ${i}: Unit 16 - Unit 20`,
        desc: `Tổng hợp ôn tập cuối kỳ, các chủ đề phương tiện, chuyến đi và thời tiết - Lớp ${grade}.`,
        samples: [
          {
            question: 'How was your trip to Ha Long Bay? - "It was _____!"',
            options: ['A. wonderful', 'B. yesterday', 'C. by coach', 'D. with friends'],
            answerIndex: 0,
            explanation: 'Hỏi chuyến đi như thế nào (How was your trip?) -> "It was wonderful" (Nó rất tuyệt vời).'
          },
          {
            question: 'What will the weather be like tomorrow?',
            options: ['A. It was sunny', 'B. It is cold today', 'C. It will be hot and sunny', 'D. I like summer'],
            answerIndex: 2,
            explanation: 'Câu hỏi về tương lai "will ... be like" -> trả lời "It will be hot and sunny".'
          }
        ]
      }
    ];

    const config = sampleClusterConfigs[(i - 1) % sampleClusterConfigs.length];
    const questions: ExerciseQuestion[] = (config.samples || []).map((s, idx) => ({
      id: `q_${grade}_${i}_${idx + 1}`,
      question: s.question,
      options: s.options,
      answerIndex: s.answerIndex,
      explanation: s.explanation,
      type: 'quiz',
      category: `Học phần ${i}`
    }));

    const cluster: ExerciseCluster = {
      id: `cluster_grade${grade}_${i}`,
      clusterNumber: i,
      title: config.title,
      description: config.desc,
      grade,
      questions,
      itemsCount: questions.length,
      rawJson: JSON.stringify(questions, null, 2),
      updatedAt: new Date().toISOString()
    };

    clusters.push(cluster);
  }

  return clusters;
}
