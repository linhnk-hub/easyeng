import { UnitData } from '../types';

export const DEFAULT_UNITS_DATA: UnitData[] = [
  {
    unit: 1,
    book: "Phần 1",
    title: "My friends",
    emoji: "🌏",
    color: "from-blue-500 to-indigo-600",
    vocabulary: [
      {
        word: "America",
        phonetic: "/əˈmerɪkə/",
        meaning: "nước Hoa Kỳ / Mỹ",
        example: "I'm from America.",
        exampleMeaning: "Tôi đến từ nước Mỹ.",
        imageEmoji: "🇺🇸"
      },
      {
        word: "Australia",
        phonetic: "/ɒˈstreɪliə/",
        meaning: "nước Ô-strây-li-a / Úc",
        example: "He's from Australia.",
        exampleMeaning: "Cậu ấy đến từ nước Úc.",
        imageEmoji: "🇦🇺"
      },
      {
        word: "Britain",
        phonetic: "/ˈbrɪtn/",
        meaning: "nước Anh",
        example: "She's from Britain.",
        exampleMeaning: "Cô ấy đến từ nước Anh.",
        imageEmoji: "🇬🇧"
      },
      {
        word: "Japan",
        phonetic: "/dʒəˈpæn/",
        meaning: "nước Nhật Bản",
        example: "She's from Japan.",
        exampleMeaning: "Cô ấy đến từ Nhật Bản.",
        imageEmoji: "🇯🇵"
      },
      {
        word: "Malaysia",
        phonetic: "/məˈleɪʒə/",
        meaning: "nước Ma-lai-xi-a",
        example: "He's from Malaysia.",
        exampleMeaning: "Cậu ấy đến từ Ma-lai-xi-a.",
        imageEmoji: "🇲🇾"
      },
      {
        word: "Singapore",
        phonetic: "/ˌsɪŋəˈpɔːr/",
        meaning: "nước Xin-ga-po",
        example: "He's from Singapore.",
        exampleMeaning: "Cậu ấy đến từ Xin-ga-po.",
        imageEmoji: "🇸🇬"
      },
      {
        word: "Thailand",
        phonetic: "/ˈtaɪlænd/",
        meaning: "nước Thái Lan",
        example: "She's from Thailand.",
        exampleMeaning: "Cô ấy đến từ Thái Lan.",
        imageEmoji: "🇹🇭"
      },
      {
        word: "Viet Nam",
        phonetic: "/ˌvjietˈnɑːm/",
        meaning: "nước Việt Nam",
        example: "I'm from Viet Nam.",
        exampleMeaning: "Tôi đến từ Việt Nam.",
        imageEmoji: "🇻🇳"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Where are you from? - I'm from...",
        usage: "Hỏi và trả lời về quốc gia / quê hương của ai đó"
      },
      {
        pattern: "Where's he / she from? - He's / She's from...",
        usage: "Hỏi và trả lời về quốc gia của người thứ ba"
      }
    ],
    quizzes: [
      {
        question: "Where are you from?",
        options: [
          "I'm from Viet Nam.",
          "I'm fine, thanks.",
          "I'm nine years old.",
          "My name is Minh."
        ],
        answerIndex: 0,
        explanation: "Dùng 'I'm from + tên quốc gia' để trả lời cho câu hỏi 'Where are you from?'."
      },
      {
        question: "Where is she from? - She's from _____.",
        options: [
          "Japan",
          "Japanese",
          "English",
          "Student"
        ],
        answerIndex: 0,
        explanation: "Sau 'from' cần một danh từ chỉ tên quốc gia (Japan)."
      },
      {
        question: "Where _____ he from? - He's from Malaysia.",
        options: [
          "is",
          "are",
          "am",
          "do"
        ],
        answerIndex: 0,
        explanation: "Chủ ngữ 'he' đi với động từ to be 'is'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Where", "are", "you", "from?"],
        correctSentence: "Where are you from?",
        vietnameseMeaning: "Bạn đến từ đâu?"
      },
      {
        scrambledWords: ["I'm", "from", "Viet", "Nam."],
        correctSentence: "I'm from Viet Nam.",
        vietnameseMeaning: "Tôi đến từ Việt Nam."
      },
      {
        scrambledWords: ["She", "is", "from", "Japan."],
        correctSentence: "She is from Japan.",
        vietnameseMeaning: "Cô ấy đến từ Nhật Bản."
      }
    ]
  },
  {
    unit: 2,
    book: "Phần 1",
    title: "Time and daily routines",
    emoji: "⏰",
    color: "from-amber-500 to-orange-600",
    vocabulary: [
      {
        word: "o'clock",
        phonetic: "/əˈklɒk/",
        meaning: "giờ (đúng)",
        example: "It's six o'clock.",
        exampleMeaning: "Bây giờ là 6 giờ đúng.",
        imageEmoji: "🕒"
      },
      {
        word: "fifteen",
        phonetic: "/ˌfɪfˈtiːn/",
        meaning: "mười lăm (15)",
        example: "It's six fifteen.",
        exampleMeaning: "Bây giờ là 6 giờ 15 phút.",
        imageEmoji: "1️⃣5️⃣"
      },
      {
        word: "thirty",
        phonetic: "/ˈθɜːti/",
        meaning: "ba mươi (30)",
        example: "It's six thirty.",
        exampleMeaning: "Bây giờ là 6 giờ 30 phút.",
        imageEmoji: "3️⃣0️⃣"
      },
      {
        word: "forty-five",
        phonetic: "/ˌfɔːti ˈfaɪv/",
        meaning: "bốn mươi lăm (45)",
        example: "It's five forty-five.",
        exampleMeaning: "Bây giờ là 5 giờ 45 phút.",
        imageEmoji: "4️⃣5️⃣"
      },
      {
        word: "get up",
        phonetic: "/ɡet ˈʌp/",
        meaning: "thức dậy",
        example: "I get up at six o'clock.",
        exampleMeaning: "Tôi thức dậy lúc 6 giờ.",
        imageEmoji: "🌅"
      },
      {
        word: "have breakfast",
        phonetic: "/hæv ˈbrekfəst/",
        meaning: "dùng bữa sáng",
        example: "I have breakfast at six fifteen.",
        exampleMeaning: "Tôi ăn sáng lúc 6 giờ 15 phút.",
        imageEmoji: "🍳"
      },
      {
        word: "go to school",
        phonetic: "/ɡəʊ tə ˈskuːl/",
        meaning: "đi học",
        example: "I go to school at six thirty.",
        exampleMeaning: "Tôi đi học lúc 6 giờ 30 phút.",
        imageEmoji: "🎒"
      },
      {
        word: "go to bed",
        phonetic: "/ɡəʊ tə ˈbed/",
        meaning: "đi ngủ",
        example: "I go to bed at nine forty-five.",
        exampleMeaning: "Tôi đi ngủ lúc 9 giờ 45 phút.",
        imageEmoji: "🛌"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What time is it? - It's...",
        usage: "Hỏi và trả lời về giờ giấc"
      },
      {
        pattern: "What time do you...? - I... at...",
        usage: "Hỏi và trả lời về thời gian làm các hoạt động hàng ngày"
      }
    ],
    quizzes: [
      {
        question: "What time do you get up? - I get up _____ six o'clock.",
        options: ["at", "on", "in", "to"],
        answerIndex: 0,
        explanation: "Dùng giới từ 'at' trước mốc thời gian / giờ giấc cụ thể."
      },
      {
        question: "What time is it? - It's seven _____.",
        options: ["o'clock", "clock", "watch", "time"],
        answerIndex: 0,
        explanation: "Dùng 'o'clock' sau số giờ đúng."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "time", "is", "it?"],
        correctSentence: "What time is it?",
        vietnameseMeaning: "Mấy giờ rồi?"
      },
      {
        scrambledWords: ["I", "get", "up", "at", "six", "o'clock."],
        correctSentence: "I get up at six o'clock.",
        vietnameseMeaning: "Tôi thức dậy lúc 6 giờ đúng."
      }
    ]
  },
  {
    unit: 3,
    book: "Phần 1",
    title: "My week",
    emoji: "📅",
    color: "from-emerald-500 to-teal-600",
    vocabulary: [
      {
        word: "Monday",
        phonetic: "/ˈmʌndeɪ/",
        meaning: "thứ Hai",
        example: "I go to school on Mondays.",
        exampleMeaning: "Tôi đi học vào các ngày thứ Hai.",
        imageEmoji: "📌"
      },
      {
        word: "Tuesday",
        phonetic: "/ˈtjuːzdeɪ/",
        meaning: "thứ Ba",
        example: "I play football on Tuesdays.",
        exampleMeaning: "Tôi đá bóng vào thứ Ba.",
        imageEmoji: "⚽"
      },
      {
        word: "Wednesday",
        phonetic: "/ˈwenzdeɪ/",
        meaning: "thứ Tư",
        example: "I play the guitar on Wednesdays.",
        exampleMeaning: "Tôi chơi đàn ghi-ta vào thứ Tư.",
        imageEmoji: "🎸"
      },
      {
        word: "Thursday",
        phonetic: "/ˈθɜːzdeɪ/",
        meaning: "thứ Năm",
        example: "I study at school on Thursdays.",
        exampleMeaning: "Tôi học ở trường vào thứ Năm.",
        imageEmoji: "📚"
      },
      {
        word: "Friday",
        phonetic: "/ˈfraɪdeɪ/",
        meaning: "thứ Sáu",
        example: "I listen to music on Fridays.",
        exampleMeaning: "Tôi nghe nhạc vào thứ Sáu.",
        imageEmoji: "🎧"
      },
      {
        word: "Saturday",
        phonetic: "/ˈsætədeɪ/",
        meaning: "thứ Bảy",
        example: "I do housework on Saturdays.",
        exampleMeaning: "Tôi làm việc nhà vào thứ Bảy.",
        imageEmoji: "🧹"
      },
      {
        word: "Sunday",
        phonetic: "/ˈsʌndeɪ/",
        meaning: "Chủ nhật",
        example: "I watch TV on Sundays.",
        exampleMeaning: "Tôi xem ti-vi vào Chủ nhật.",
        imageEmoji: "📺"
      },
      {
        word: "do housework",
        phonetic: "/duː ˈhaʊswɜːk/",
        meaning: "làm việc nhà",
        example: "I do housework at the weekend.",
        exampleMeaning: "Tôi làm việc nhà vào cuối tuần.",
        imageEmoji: "🧽"
      },
      {
        word: "listen to music",
        phonetic: "/ˈlɪsn tə ˈmjuːzɪk/",
        meaning: "nghe nhạc",
        example: "I listen to music on Sundays.",
        exampleMeaning: "Tôi nghe nhạc vào Chủ nhật.",
        imageEmoji: "🎵"
      },
      {
        word: "study at school",
        phonetic: "/ˈstʌdi ət ˈskuːl/",
        meaning: "học ở trường",
        example: "I study at school from Monday to Friday.",
        exampleMeaning: "Tôi học ở trường từ thứ Hai đến thứ Sáu.",
        imageEmoji: "🏫"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What day is it today? - It's...",
        usage: "Hỏi và trả lời về thứ trong tuần"
      },
      {
        pattern: "What do you do on...? - I...",
        usage: "Hỏi và trả lời về hoạt động làm vào một ngày cụ thể"
      }
    ],
    quizzes: [
      {
        question: "What day is it today? - _____ Monday.",
        options: ["It's", "Is", "They're", "I'm"],
        answerIndex: 0,
        explanation: "Dùng 'It's + thứ trong tuần' để trả lời cho câu hỏi 'What day is it today?'."
      },
      {
        question: "I play football _____ Tuesdays.",
        options: ["on", "at", "in", "to"],
        answerIndex: 0,
        explanation: "Dùng giới từ 'on' trước các ngày trong tuần (on Mondays, on Tuesdays...)."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "day", "is", "it", "today?"],
        correctSentence: "What day is it today?",
        vietnameseMeaning: "Hôm nay là thứ mấy?"
      },
      {
        scrambledWords: ["I", "listen", "to", "music", "on", "Fridays."],
        correctSentence: "I listen to music on Fridays.",
        vietnameseMeaning: "Tôi nghe nhạc vào các ngày thứ Sáu."
      }
    ]
  },
  {
    unit: 4,
    book: "Phần 1",
    title: "My birthday party",
    emoji: "🎂",
    color: "from-pink-500 to-rose-600",
    vocabulary: [
      {
        word: "January",
        phonetic: "/ˈdʒænjuəri/",
        meaning: "tháng Một",
        example: "My birthday is in January.",
        exampleMeaning: "Sinh nhật của tôi vào tháng Một.",
        imageEmoji: "❄️"
      },
      {
        word: "February",
        phonetic: "/ˈfebruəri/",
        meaning: "tháng Hai",
        example: "His birthday is in February.",
        exampleMeaning: "Sinh nhật của cậu ấy vào tháng Hai.",
        imageEmoji: "🌹"
      },
      {
        word: "March",
        phonetic: "/mɑːtʃ/",
        meaning: "tháng Ba",
        example: "Her birthday is in March.",
        exampleMeaning: "Sinh nhật của cô ấy vào tháng Ba.",
        imageEmoji: "🌱"
      },
      {
        word: "April",
        phonetic: "/ˈeɪprəl/",
        meaning: "tháng Tư",
        example: "It's in April.",
        exampleMeaning: "Nó vào tháng Tư.",
        imageEmoji: "🌧️"
      },
      {
        word: "jam",
        phonetic: "/dʒæm/",
        meaning: "mứt",
        example: "I want some jam.",
        exampleMeaning: "Tôi muốn một ít mứt.",
        imageEmoji: "🍓"
      },
      {
        word: "juice",
        phonetic: "/dʒuːs/",
        meaning: "nước ép hoa quả",
        example: "I want some juice.",
        exampleMeaning: "Tôi muốn một ít nước ép.",
        imageEmoji: "🧃"
      },
      {
        word: "lemonade",
        phonetic: "/ˌleməˈneɪd/",
        meaning: "nước chanh",
        example: "I want some lemonade.",
        exampleMeaning: "Tôi muốn một ít nước chanh.",
        imageEmoji: "🍋"
      },
      {
        word: "water",
        phonetic: "/ˈwɔːtə/",
        meaning: "nước lọc",
        example: "I want some water.",
        exampleMeaning: "Tôi muốn một ít nước lọc.",
        imageEmoji: "💧"
      },
      {
        word: "chips",
        phonetic: "/tʃɪps/",
        meaning: "khoai tây rán",
        example: "I want some chips.",
        exampleMeaning: "Tôi muốn một ít khoai tây rán.",
        imageEmoji: "🍟"
      },
      {
        word: "grapes",
        phonetic: "/ɡreɪps/",
        meaning: "quả nho",
        example: "I want some grapes.",
        exampleMeaning: "Tôi muốn một ít nho.",
        imageEmoji: "🍇"
      }
    ],
    sentencePatterns: [
      {
        pattern: "When's your birthday? - It's in...",
        usage: "Hỏi và trả lời về tháng sinh nhật"
      },
      {
        pattern: "What do you want to eat / drink? - I want...",
        usage: "Hỏi và trả lời về đồ ăn/thức uống muốn dùng"
      }
    ],
    quizzes: [
      {
        question: "When's your birthday? - It's _____ March.",
        options: ["in", "on", "at", "to"],
        answerIndex: 0,
        explanation: "Dùng giới từ 'in' trước tháng trong năm (in January, in March...)."
      },
      {
        question: "What do you want to drink? - I want some _____.",
        options: ["lemonade", "chips", "grapes", "pizza"],
        answerIndex: 0,
        explanation: "Câu hỏi hỏi về đồ uống ('drink'), lemonade (nước chanh) là đồ uống."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["When's", "your", "birthday?", "It's", "in", "May."],
        correctSentence: "When's your birthday? It's in May.",
        vietnameseMeaning: "Khi nào sinh nhật bạn? Vào tháng Năm."
      },
      {
        scrambledWords: ["I", "want", "some", "orange", "juice."],
        correctSentence: "I want some orange juice.",
        vietnameseMeaning: "Tôi muốn một chút nước cam ép."
      }
    ]
  },
  {
    unit: 5,
    book: "Phần 1",
    title: "Things we can do",
    emoji: "🎨",
    color: "from-purple-500 to-violet-600",
    vocabulary: [
      {
        word: "can",
        phonetic: "/kæn/",
        meaning: "có thể, biết (làm gì)",
        example: "I can play the piano.",
        exampleMeaning: "Tôi có thể chơi đàn piano.",
        imageEmoji: "⭐"
      },
      {
        word: "cook",
        phonetic: "/kʊk/",
        meaning: "nấu ăn",
        example: "She can cook.",
        exampleMeaning: "Cô ấy biết nấu ăn.",
        imageEmoji: "🍳"
      },
      {
        word: "draw",
        phonetic: "/drɔː/",
        meaning: "vẽ",
        example: "He can draw.",
        exampleMeaning: "Cậu ấy biết vẽ.",
        imageEmoji: "🖍️"
      },
      {
        word: "play the guitar",
        phonetic: "/pleɪ ðə ɡɪˈtɑː/",
        meaning: "chơi đàn ghi-ta",
        example: "I can play the guitar.",
        exampleMeaning: "Tôi biết chơi đàn ghi-ta.",
        imageEmoji: "🎸"
      },
      {
        word: "play the piano",
        phonetic: "/pleɪ ðə piˈænəʊ/",
        meaning: "chơi đàn pi-a-nô",
        example: "She can play the piano.",
        exampleMeaning: "Cô ấy biết chơi đàn pi-a-nô.",
        imageEmoji: "🎹"
      },
      {
        word: "ride a bike",
        phonetic: "/raɪd ə ˈbaɪk/",
        meaning: "đạp xe",
        example: "Can you ride a bike?",
        exampleMeaning: "Bạn có biết đi xe đạp không?",
        imageEmoji: "🚲"
      },
      {
        word: "ride a horse",
        phonetic: "/raɪd ə ˈhɔːs/",
        meaning: "cưỡi ngựa",
        example: "He can't ride a horse.",
        exampleMeaning: "Cậu ấy không biết cưỡi ngựa.",
        imageEmoji: "🐎"
      },
      {
        word: "roller skate",
        phonetic: "/ˈrəʊlə skeɪt/",
        meaning: "trượt pa-tanh",
        example: "She can roller skate.",
        exampleMeaning: "Cô ấy biết trượt pa-tanh.",
        imageEmoji: "🛼"
      },
      {
        word: "swim",
        phonetic: "/swɪm/",
        meaning: "bơi",
        example: "Can he swim?",
        exampleMeaning: "Cậu ấy có biết bơi không?",
        imageEmoji: "🏊"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Can you...? - Yes, I can. / No, I can't.",
        usage: "Hỏi và trả lời về năng khiếu, khả năng làm việc gì của ai đó"
      },
      {
        pattern: "Can he / she...? - Yes, he / she can. / No, he / she can't...",
        usage: "Hỏi về khả năng của người khác"
      }
    ],
    quizzes: [
      {
        question: "Can you ride a bike? - Yes, I _____.",
        options: ["can", "can't", "do", "don't"],
        answerIndex: 0,
        explanation: "Câu hỏi bắt đầu bằng 'Can you...?', trả lời khẳng định là 'Yes, I can.'."
      },
      {
        question: "Can she swim? - No, she _____.",
        options: ["can't", "can", "isn't", "doesn't"],
        answerIndex: 0,
        explanation: "Trả lời phủ định: 'No, she can't.'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Can", "you", "play", "the", "piano?"],
        correctSentence: "Can you play the piano?",
        vietnameseMeaning: "Bạn có biết chơi đàn pi-a-nô không?"
      },
      {
        scrambledWords: ["I", "can", "ride", "a", "bike."],
        correctSentence: "I can ride a bike.",
        vietnameseMeaning: "Tôi biết đi xe đạp."
      }
    ]
  },
  {
    unit: 6,
    book: "Phần 1",
    title: "Our school facilities",
    emoji: "🏫",
    color: "from-sky-500 to-blue-600",
    vocabulary: [
      {
        word: "building",
        phonetic: "/ˈbɪldɪŋ/",
        meaning: "tòa nhà",
        example: "There are two buildings at my school.",
        exampleMeaning: "Có hai tòa nhà ở trường tôi.",
        imageEmoji: "🏢"
      },
      {
        word: "city",
        phonetic: "/ˈsɪti/",
        meaning: "thành phố",
        example: "My school is in the city.",
        exampleMeaning: "Trường của tôi ở thành phố.",
        imageEmoji: "🏙️"
      },
      {
        word: "computer room",
        phonetic: "/kəmˈpjuːtə ruːm/",
        meaning: "phòng máy tính",
        example: "We have a computer room.",
        exampleMeaning: "Chúng tôi có một phòng máy tính.",
        imageEmoji: "💻"
      },
      {
        word: "garden",
        phonetic: "/ˈɡɑːdn/",
        meaning: "khu vườn",
        example: "It's a school garden.",
        exampleMeaning: "Đó là khu vườn trường.",
        imageEmoji: "🌷"
      },
      {
        word: "mountains",
        phonetic: "/ˈmaʊntɪnz/",
        meaning: "ở vùng núi",
        example: "My school is in the mountains.",
        exampleMeaning: "Trường của tôi ở vùng núi.",
        imageEmoji: "⛰️"
      },
      {
        word: "playground",
        phonetic: "/ˈpleɪɡraʊnd/",
        meaning: "sân trường / sân chơi",
        example: "The playground is big.",
        exampleMeaning: "Sân trường rất rộng.",
        imageEmoji: "🛝"
      },
      {
        word: "town",
        phonetic: "/taʊn/",
        meaning: "thị trấn",
        example: "It's in the town.",
        exampleMeaning: "Nó ở thị trấn.",
        imageEmoji: "🏘️"
      },
      {
        word: "village",
        phonetic: "/ˈvɪlɪdʒ/",
        meaning: "ngôi làng",
        example: "My school is in the village.",
        exampleMeaning: "Trường của tôi ở trong làng.",
        imageEmoji: "🏡"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Where's your school? - It's in the...",
        usage: "Hỏi và trả lời về vị trí của trường học"
      },
      {
        pattern: "How many... are there at your school? - There is / are...",
        usage: "Hỏi và trả lời về số lượng cơ sở vật chất ở trường"
      }
    ],
    quizzes: [
      {
        question: "Where's your school? - It's _____ the city.",
        options: ["in", "on", "at", "under"],
        answerIndex: 0,
        explanation: "Dùng 'in the city' để chỉ vị trí ở thành phố."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Where's", "your", "school?", "It's", "in", "the", "village."],
        correctSentence: "Where's your school? It's in the village.",
        vietnameseMeaning: "Trường bạn ở đâu? Ở trong làng."
      }
    ]
  },
  {
    unit: 7,
    book: "Phần 1",
    title: "Our timetables",
    emoji: "📖",
    color: "from-teal-500 to-emerald-600",
    vocabulary: [
      {
        word: "art",
        phonetic: "/ɑːt/",
        meaning: "môn Mỹ thuật",
        example: "I have art today.",
        exampleMeaning: "Hôm nay tôi có môn Mỹ thuật.",
        imageEmoji: "🎨"
      },
      {
        word: "English",
        phonetic: "/ˈɪŋɡlɪʃ/",
        meaning: "môn Tiếng Anh",
        example: "I have English on Mondays.",
        exampleMeaning: "Tôi có môn Tiếng Anh vào thứ Hai.",
        imageEmoji: "🇬🇧"
      },
      {
        word: "history and geography",
        phonetic: "/ˈhɪstri ænd dʒiˈɒɡrəfi/",
        meaning: "môn Lịch sử và Địa lí",
        example: "We have history and geography today.",
        exampleMeaning: "Hôm nay chúng tôi có môn Lịch sử và Địa lí.",
        imageEmoji: "🗺️"
      },
      {
        word: "maths",
        phonetic: "/mæθs/",
        meaning: "môn Toán",
        example: "I have maths and science.",
        exampleMeaning: "Tôi có môn Toán và Khoa học.",
        imageEmoji: "🔢"
      },
      {
        word: "music",
        phonetic: "/ˈmjuːzɪk/",
        meaning: "môn Âm nhạc",
        example: "She has music on Tuesdays.",
        exampleMeaning: "Cô ấy có môn Âm nhạc vào thứ Ba.",
        imageEmoji: "🎶"
      },
      {
        word: "science",
        phonetic: "/ˈsaɪəns/",
        meaning: "môn Khoa học",
        example: "We have science today.",
        exampleMeaning: "Hôm nay chúng tôi có môn Khoa học.",
        imageEmoji: "🔬"
      },
      {
        word: "Vietnamese",
        phonetic: "/ˌvietnəˈmiːz/",
        meaning: "môn Tiếng Việt",
        example: "When do you have Vietnamese?",
        exampleMeaning: "Khi nào bạn có môn Tiếng Việt?",
        imageEmoji: "🇻🇳"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What subjects do you have today? - I have...",
        usage: "Hỏi và trả lời về các môn học có trong ngày"
      },
      {
        pattern: "When do you have...? - I have it on...",
        usage: "Hỏi và trả lời về thời điểm/ngày có môn học cụ thể"
      }
    ],
    quizzes: [
      {
        question: "What _____ do you have today? - I have maths and art.",
        options: ["subjects", "colors", "animals", "days"],
        answerIndex: 0,
        explanation: "Từ 'subjects' có nghĩa là môn học."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "subjects", "do", "you", "have", "today?"],
        correctSentence: "What subjects do you have today?",
        vietnameseMeaning: "Hôm nay bạn có những môn học nào?"
      }
    ]
  },
  {
    unit: 8,
    book: "Phần 1",
    title: "My favourite subjects",
    emoji: "💡",
    color: "from-cyan-500 to-blue-600",
    vocabulary: [
      {
        word: "IT",
        phonetic: "/ˌaɪ ˈtiː/",
        meaning: "môn Tin học / Công nghệ thông tin",
        example: "My favourite subject is IT.",
        exampleMeaning: "Môn học yêu thích của tôi là Tin học.",
        imageEmoji: "💻"
      },
      {
        word: "PE",
        phonetic: "/ˌpiː ˈiː/",
        meaning: "môn Giáo dục thể chất",
        example: "I like PE.",
        exampleMeaning: "Tôi thích môn Giáo dục thể chất.",
        imageEmoji: "⚽"
      },
      {
        word: "English teacher",
        phonetic: "/ˈɪŋɡlɪʃ ˈtiːtʃə/",
        meaning: "giáo viên tiếng Anh",
        example: "I want to be an English teacher.",
        exampleMeaning: "Tôi muốn trở thành giáo viên tiếng Anh.",
        imageEmoji: "👩‍🏫"
      },
      {
        word: "painter",
        phonetic: "/ˈpeɪntə/",
        meaning: "hoạ sĩ",
        example: "Because I want to be a painter.",
        exampleMeaning: "Vì tôi muốn trở thành họa sĩ.",
        imageEmoji: "🎨"
      },
      {
        word: "maths teacher",
        phonetic: "/mæθs ˈtiːtʃə/",
        meaning: "giáo viên Toán",
        example: "He wants to be a maths teacher.",
        exampleMeaning: "Cậu ấy muốn trở thành giáo viên Toán.",
        imageEmoji: "👨‍🏫"
      },
      {
        word: "because",
        phonetic: "/bɪˈkɒz/",
        meaning: "bởi vì",
        example: "Because I want to be a singer.",
        exampleMeaning: "Bởi vì tôi muốn trở thành ca sĩ.",
        imageEmoji: "💭"
      },
      {
        word: "why",
        phonetic: "/waɪ/",
        meaning: "tại sao",
        example: "Why do you like art?",
        exampleMeaning: "Tại sao bạn lại thích môn Mỹ thuật?",
        imageEmoji: "❓"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What's your favourite subject? - It's...",
        usage: "Hỏi và trả lời về môn học yêu thích nhất"
      },
      {
        pattern: "Why do you like...? - Because I want to be...",
        usage: "Hỏi và giải thích lý do thích một môn học"
      }
    ],
    quizzes: [
      {
        question: "Why do you like English? - _____ I want to be an English teacher.",
        options: ["Because", "So", "And", "But"],
        answerIndex: 0,
        explanation: "Câu hỏi bắt đầu bằng 'Why...?' thì câu trả lời bắt đầu bằng 'Because...'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What's", "your", "favourite", "subject?", "It's", "music."],
        correctSentence: "What's your favourite subject? It's music.",
        vietnameseMeaning: "Môn học yêu thích của bạn là gì? Là môn Âm nhạc."
      }
    ]
  },
  {
    unit: 9,
    book: "Phần 1",
    title: "Our sports day",
    emoji: "🏆",
    color: "from-yellow-500 to-amber-600",
    vocabulary: [
      {
        word: "sports day",
        phonetic: "/ˈspɔːts deɪ/",
        meaning: "ngày hội thể thao",
        example: "Our sports day is in May.",
        exampleMeaning: "Ngày hội thể thao của chúng tôi vào tháng Năm.",
        imageEmoji: "🥇"
      },
      {
        word: "August",
        phonetic: "/ˈɔːɡəst/",
        meaning: "tháng Tám",
        example: "Is your sports day in August?",
        exampleMeaning: "Ngày hội thể thao của bạn vào tháng Tám phải không?",
        imageEmoji: "🌞"
      },
      {
        word: "September",
        phonetic: "/sepˈtembə/",
        meaning: "tháng Chín",
        example: "It's in September.",
        exampleMeaning: "Nó vào tháng Chín.",
        imageEmoji: "🍂"
      },
      {
        word: "October",
        phonetic: "/ɒkˈtəʊbə/",
        meaning: "tháng Mười",
        example: "When's your sports day? - It's in October.",
        exampleMeaning: "Khi nào là ngày hội thể thao? - Vào tháng Mười.",
        imageEmoji: "🎃"
      },
      {
        word: "November",
        phonetic: "/nəʊˈvembə/",
        meaning: "tháng Mười Một",
        example: "Our sports day is in November.",
        exampleMeaning: "Ngày hội thể thao của chúng tôi vào tháng Mười Một.",
        imageEmoji: "🍁"
      },
      {
        word: "December",
        phonetic: "/dɪˈsembə/",
        meaning: "tháng Mười Hai",
        example: "Is it in December?",
        exampleMeaning: "Nó vào tháng Mười Hai phải không?",
        imageEmoji: "🎄"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Is your sports day in...? - Yes, it is. / No, it isn't.",
        usage: "Hỏi và xác nhận thời điểm diễn ra ngày hội thể thao"
      },
      {
        pattern: "When's your sports day? - It's in...",
        usage: "Hỏi và trả lời về tháng diễn ra ngày hội thể thao"
      }
    ],
    quizzes: [
      {
        question: "Is your sports day in October? - No, it _____.",
        options: ["isn't", "is", "don't", "aren't"],
        answerIndex: 0,
        explanation: "Câu hỏi phủ định với 'Is your...?' trả lời là 'No, it isn't.'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["When's", "your", "sports", "day?", "It's", "in", "November."],
        correctSentence: "When's your sports day? It's in November.",
        vietnameseMeaning: "Khi nào là ngày hội thể thao của bạn? Vào tháng Mười Một."
      }
    ]
  },
  {
    unit: 10,
    book: "Phần 1",
    title: "Our summer holidays",
    emoji: "🏖️",
    color: "from-blue-400 to-indigo-500",
    vocabulary: [
      {
        word: "beach",
        phonetic: "/biːtʃ/",
        meaning: "bãi biển",
        example: "I was on the beach yesterday.",
        exampleMeaning: "Hôm qua tôi ở trên bãi biển.",
        imageEmoji: "🏖️"
      },
      {
        word: "campsite",
        phonetic: "/ˈkæmpsaɪt/",
        meaning: "khu cắm trại",
        example: "I was at the campsite last weekend.",
        exampleMeaning: "Tôi ở khu cắm trại cuối tuần trước.",
        imageEmoji: "⛺"
      },
      {
        word: "countryside",
        phonetic: "/ˈkʌntrisaɪd/",
        meaning: "nông thôn, vùng quê",
        example: "I was in the countryside.",
        exampleMeaning: "Tôi đã ở miền quê.",
        imageEmoji: "🌾"
      },
      {
        word: "London",
        phonetic: "/ˈlʌndən/",
        meaning: "Luân Đôn (thủ đô nước Anh)",
        example: "I was in London last summer.",
        exampleMeaning: "Tôi đã ở Luân Đôn mùa hè năm ngoái.",
        imageEmoji: "🎡"
      },
      {
        word: "Bangkok",
        phonetic: "/bæŋˈkɒk/",
        meaning: "Băng Cốc (thủ đô Thái Lan)",
        example: "Were you in Bangkok?",
        exampleMeaning: "Bạn đã ở Băng Cốc phải không?",
        imageEmoji: "🛕"
      },
      {
        word: "Tokyo",
        phonetic: "/ˈtəʊkiəʊ/",
        meaning: "Tô-ki-ô (thủ đô Nhật Bản)",
        example: "I was in Tokyo.",
        exampleMeaning: "Tôi đã ở Tô-ki-ô.",
        imageEmoji: "🗼"
      },
      {
        word: "Sydney",
        phonetic: "/ˈsɪdni/",
        meaning: "Xít-ni (thành phố Úc)",
        example: "She was in Sydney last summer.",
        exampleMeaning: "Cô ấy đã ở Xít-ni mùa hè năm ngoái.",
        imageEmoji: "🦘"
      },
      {
        word: "last",
        phonetic: "/lɑːst/",
        meaning: "trước, vừa qua",
        example: "Where were you last weekend?",
        exampleMeaning: "Cuối tuần trước bạn đã ở đâu?",
        imageEmoji: "⏮️"
      },
      {
        word: "yesterday",
        phonetic: "/ˈjestədeɪ/",
        meaning: "ngày hôm qua",
        example: "I was at home yesterday.",
        exampleMeaning: "Hôm qua tôi đã ở nhà.",
        imageEmoji: "⏪"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Were you... last weekend? - Yes, I was. / No, I wasn't.",
        usage: "Hỏi và trả lời xem có ở đâu vào cuối tuần trước hay không"
      },
      {
        pattern: "Where were you last summer? - I was in...",
        usage: "Hỏi và trả lời về địa điểm đã ở vào mùa hè năm ngoái"
      }
    ],
    quizzes: [
      {
        question: "Where _____ you last summer? - I was in London.",
        options: ["were", "was", "are", "is"],
        answerIndex: 0,
        explanation: "Dùng động từ to be ở quá khứ 'were' đi với chủ ngữ 'you'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Where", "were", "you", "last", "weekend?"],
        correctSentence: "Where were you last weekend?",
        vietnameseMeaning: "Cuối tuần trước bạn đã ở đâu?"
      },
      {
        scrambledWords: ["I", "was", "on", "the", "beach."],
        correctSentence: "I was on the beach.",
        vietnameseMeaning: "Tôi đã ở trên bãi biển."
      }
    ]
  },
  {
    unit: 11,
    book: "Phần 2",
    title: "My home",
    emoji: "🏡",
    color: "from-green-500 to-emerald-600",
    vocabulary: [
      {
        word: "road",
        phonetic: "/rəʊd/",
        meaning: "con đường",
        example: "I live in Hoa Binh Road.",
        exampleMeaning: "Tôi sống ở đường Hòa Bình.",
        imageEmoji: "🛣️"
      },
      {
        word: "street",
        phonetic: "/striːt/",
        meaning: "phố, đường phố",
        example: "I live in Tran Hung Dao Street.",
        exampleMeaning: "Tôi sống ở phố Trần Hưng Đạo.",
        imageEmoji: "🚦"
      },
      {
        word: "big",
        phonetic: "/bɪɡ/",
        meaning: "to, lớn",
        example: "It's a big city.",
        exampleMeaning: "Đó là một thành phố lớn.",
        imageEmoji: "🐘"
      },
      {
        word: "busy",
        phonetic: "/ˈbɪzi/",
        meaning: "bận rộn, nhộn nhịp",
        example: "It's a busy street.",
        exampleMeaning: "Đó là một con phố nhộn nhịp.",
        imageEmoji: "🚗"
      },
      {
        word: "noisy",
        phonetic: "/ˈnɔɪzi/",
        meaning: "ồn ào, ầm ĩ",
        example: "It's a noisy road.",
        exampleMeaning: "Đó là một con đường ồn ào.",
        imageEmoji: "📢"
      },
      {
        word: "quiet",
        phonetic: "/ˈkwaɪət/",
        meaning: "yên tĩnh, thanh bình",
        example: "It's a quiet village.",
        exampleMeaning: "Đó là một ngôi làng yên tĩnh.",
        imageEmoji: "🤫"
      },
      {
        word: "live",
        phonetic: "/lɪv/",
        meaning: "sống, sinh sống",
        example: "Where do you live?",
        exampleMeaning: "Bạn sống ở đâu?",
        imageEmoji: "🏠"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Where do you live? - I live...",
        usage: "Hỏi và trả lời về nơi chốn/địa chỉ sinh sống"
      },
      {
        pattern: "What's the... like? - It's...",
        usage: "Hỏi và mô tả đặc điểm của một con đường / ngôi làng / thành phố"
      }
    ],
    quizzes: [
      {
        question: "Where do you live? - I live _____ Tran Hung Dao Street.",
        options: ["in", "at", "on", "under"],
        answerIndex: 0,
        explanation: "Dùng 'I live in + tên phố' (hoặc 'at' nếu có số nhà)."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Where", "do", "you", "live?"],
        correctSentence: "Where do you live?",
        vietnameseMeaning: "Bạn sống ở đâu?"
      },
      {
        scrambledWords: ["It's", "a", "quiet", "and", "peaceful", "village."],
        correctSentence: "It's a quiet and peaceful village.",
        vietnameseMeaning: "Đó là một ngôi làng yên tĩnh và thanh bình."
      }
    ]
  },
  {
    unit: 12,
    book: "Phần 2",
    title: "Jobs",
    emoji: "👨‍⚕️",
    color: "from-indigo-500 to-violet-600",
    vocabulary: [
      {
        word: "actor",
        phonetic: "/ˈæktə/",
        meaning: "diễn viên (nam)",
        example: "He's an actor.",
        exampleMeaning: "Cậu ấy là một diễn viên.",
        imageEmoji: "🎭"
      },
      {
        word: "farmer",
        phonetic: "/ˈfɑːmə/",
        meaning: "nông dân",
        example: "My father is a farmer.",
        exampleMeaning: "Bố tôi là một nông dân.",
        imageEmoji: "🌾"
      },
      {
        word: "nurse",
        phonetic: "/nɜːs/",
        meaning: "y tá, điều dưỡng viên",
        example: "My mother is a nurse.",
        exampleMeaning: "Mẹ tôi là một y tá.",
        imageEmoji: "👩‍⚕️"
      },
      {
        word: "office worker",
        phonetic: "/ˈɒfɪs ˈwɜːkə/",
        meaning: "nhân viên văn phòng",
        example: "She's an office worker.",
        exampleMeaning: "Cô ấy là nhân viên văn phòng.",
        imageEmoji: "💼"
      },
      {
        word: "policeman",
        phonetic: "/pəˈliːsmən/",
        meaning: "cảnh sát (nam)",
        example: "He's a policeman.",
        exampleMeaning: "Chú ấy là cảnh sát.",
        imageEmoji: "👮"
      },
      {
        word: "factory",
        phonetic: "/ˈfæktri/",
        meaning: "nhà máy",
        example: "He works at a factory.",
        exampleMeaning: "Ông ấy làm việc ở nhà máy.",
        imageEmoji: "🏭"
      },
      {
        word: "farm",
        phonetic: "/fɑːm/",
        meaning: "trang trại",
        example: "He works on a farm.",
        exampleMeaning: "Ông ấy làm việc trên trang trại.",
        imageEmoji: "🚜"
      },
      {
        word: "hospital",
        phonetic: "/ˈhɒspɪtl/",
        meaning: "bệnh viện",
        example: "She works at a hospital.",
        exampleMeaning: "Bà ấy làm việc tại bệnh viện.",
        imageEmoji: "🏥"
      },
      {
        word: "nursing home",
        phonetic: "/ˈnɜːsɪŋ həʊm/",
        meaning: "viện dưỡng lão",
        example: "She works at a nursing home.",
        exampleMeaning: "Cô ấy làm việc tại viện dưỡng lão.",
        imageEmoji: "👵"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What does he / she do? - He's / She's...",
        usage: "Hỏi và trả lời về nghề nghiệp của một người"
      },
      {
        pattern: "Where does he / she work? - He / She works...",
        usage: "Hỏi và trả lời về nơi làm việc của một người"
      }
    ],
    quizzes: [
      {
        question: "What does your father do? - He _____ a farmer.",
        options: ["is", "are", "does", "works"],
        answerIndex: 0,
        explanation: "Trả lời nghề nghiệp: 'He is a farmer'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "does", "she", "do?", "She's", "a", "nurse."],
        correctSentence: "What does she do? She's a nurse.",
        vietnameseMeaning: "Cô ấy làm nghề gì? Cô ấy là một y tá."
      }
    ]
  },
  {
    unit: 13,
    book: "Phần 2",
    title: "Appearance",
    emoji: "👀",
    color: "from-rose-500 to-pink-600",
    vocabulary: [
      {
        word: "short",
        phonetic: "/ʃɔːt/",
        meaning: "thấp, ngắn",
        example: "He has short hair.",
        exampleMeaning: "Cậu ấy có mái tóc ngắn.",
        imageEmoji: "👦"
      },
      {
        word: "slim",
        phonetic: "/slɪm/",
        meaning: "mảnh mai",
        example: "She's slim.",
        exampleMeaning: "Cô ấy mảnh mai.",
        imageEmoji: "🧍‍♀️"
      },
      {
        word: "tall",
        phonetic: "/tɔːl/",
        meaning: "cao",
        example: "My father is tall.",
        exampleMeaning: "Bố tôi rất cao.",
        imageEmoji: "🦒"
      },
      {
        word: "eye",
        phonetic: "/aɪ/",
        meaning: "mắt",
        example: "She has big eyes.",
        exampleMeaning: "Cô ấy có đôi mắt to.",
        imageEmoji: "👁️"
      },
      {
        word: "face",
        phonetic: "/feɪs/",
        meaning: "khuôn mặt",
        example: "He has a round face.",
        exampleMeaning: "Cậu ấy có khuôn mặt tròn.",
        imageEmoji: "🙂"
      },
      {
        word: "hair",
        phonetic: "/heə/",
        meaning: "mái tóc",
        example: "She has long hair.",
        exampleMeaning: "Cô ấy có mái tóc dài.",
        imageEmoji: "💇‍♀️"
      },
      {
        word: "long",
        phonetic: "/lɒŋ/",
        meaning: "dài",
        example: "My mother has long hair.",
        exampleMeaning: "Mẹ tôi có mái tóc dài.",
        imageEmoji: "📏"
      },
      {
        word: "round",
        phonetic: "/raʊnd/",
        meaning: "tròn",
        example: "My sister has a round face.",
        exampleMeaning: "Em gái tôi có khuôn mặt tròn.",
        imageEmoji: "⚪"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What does he / she look like? - He's / She's... / He / She has...",
        usage: "Hỏi và mô tả ngoại hình của ai đó"
      }
    ],
    quizzes: [
      {
        question: "What does she look like? - She _____ long hair.",
        options: ["has", "is", "does", "have"],
        answerIndex: 0,
        explanation: "Chủ ngữ ngôi thứ 3 số ít 'She' đi với động từ 'has'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "does", "he", "look", "like?"],
        correctSentence: "What does he look like?",
        vietnameseMeaning: "Cậu ấy trông như thế nào?"
      },
      {
        scrambledWords: ["She", "has", "big", "eyes", "and", "long", "hair."],
        correctSentence: "She has big eyes and long hair.",
        vietnameseMeaning: "Cô ấy có đôi mắt to và mái tóc dài."
      }
    ]
  },
  {
    unit: 14,
    book: "Phần 2",
    title: "Daily activities",
    emoji: "🧼",
    color: "from-amber-500 to-yellow-600",
    vocabulary: [
      {
        word: "noon",
        phonetic: "/nuːn/",
        meaning: "buổi trưa",
        example: "I watch TV at noon.",
        exampleMeaning: "Tôi xem ti-vi vào buổi trưa.",
        imageEmoji: "🕛"
      },
      {
        word: "afternoon",
        phonetic: "/ˌɑːftəˈnuːn/",
        meaning: "buổi chiều",
        example: "I watch TV in the afternoon.",
        exampleMeaning: "Tôi xem ti-vi vào buổi chiều.",
        imageEmoji: "🌤️"
      },
      {
        word: "evening",
        phonetic: "/ˈiːvnɪŋ/",
        meaning: "buổi tối",
        example: "I wash my clothes in the evening.",
        exampleMeaning: "Tôi giặt quần áo vào buổi tối.",
        imageEmoji: "🌙"
      },
      {
        word: "morning",
        phonetic: "/ˈmɔːnɪŋ/",
        meaning: "buổi sáng",
        example: "What do you do in the morning?",
        exampleMeaning: "Bạn làm gì vào buổi sáng?",
        imageEmoji: "🌄"
      },
      {
        word: "clean the floor",
        phonetic: "/kliːn ðə flɔː/",
        meaning: "lau (sàn nhà)",
        example: "I clean the floor in the afternoon.",
        exampleMeaning: "Tôi lau nhà vào buổi chiều.",
        imageEmoji: "🧹"
      },
      {
        word: "help with the cooking",
        phonetic: "/help wɪð ðə ˈkʊkɪŋ/",
        meaning: "giúp đỡ việc nấu ăn",
        example: "I help with the cooking.",
        exampleMeaning: "Tôi phụ giúp việc nấu ăn.",
        imageEmoji: "🍲"
      },
      {
        word: "wash the clothes",
        phonetic: "/wɒʃ ðə kləʊðz/",
        meaning: "giặt quần áo",
        example: "I wash the clothes on Sundays.",
        exampleMeaning: "Tôi giặt quần áo vào các ngày Chủ nhật.",
        imageEmoji: "🧺"
      },
      {
        word: "wash the dishes",
        phonetic: "/wɒʃ ðə dɪʃɪz/",
        meaning: "rửa (bát đĩa)",
        example: "My dad and I wash the dishes.",
        exampleMeaning: "Bố và tôi cùng rửa bát đĩa.",
        imageEmoji: "🍽️"
      }
    ],
    sentencePatterns: [
      {
        pattern: "When do you watch TV? - I watch TV...",
        usage: "Hỏi và trả lời về thời điểm thực hiện một hoạt động"
      },
      {
        pattern: "What do you do in the morning? - I...",
        usage: "Hỏi và trả lời về công việc hàng ngày vào các buổi"
      }
    ],
    quizzes: [
      {
        question: "When do you watch TV? - I watch TV _____ the evening.",
        options: ["in", "at", "on", "to"],
        answerIndex: 0,
        explanation: "Dùng cụm từ 'in the evening' để chỉ buổi tối."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "do", "you", "do", "in", "the", "morning?"],
        correctSentence: "What do you do in the morning?",
        vietnameseMeaning: "Bạn làm gì vào buổi sáng?"
      }
    ]
  },
  {
    unit: 15,
    book: "Phần 2",
    title: "My family's weekends",
    emoji: "🎬",
    color: "from-fuchsia-500 to-purple-600",
    vocabulary: [
      {
        word: "cinema",
        phonetic: "/ˈsɪnəmə/",
        meaning: "rạp chiếu phim",
        example: "My sister goes to the cinema.",
        exampleMeaning: "Chị tôi đến rạp chiếu phim.",
        imageEmoji: "🍿"
      },
      {
        word: "shopping centre",
        phonetic: "/ˈʃɒpɪŋ ˌsentə/",
        meaning: "trung tâm mua sắm",
        example: "His mother goes to the shopping centre.",
        exampleMeaning: "Mẹ cậu ấy đi trung tâm mua sắm.",
        imageEmoji: "🛍️"
      },
      {
        word: "sports centre",
        phonetic: "/ˈspɔːts ˌsentə/",
        meaning: "trung tâm thể thao",
        example: "He goes to the sports centre.",
        exampleMeaning: "Cậu ấy đi đến trung tâm thể thao.",
        imageEmoji: "🏀"
      },
      {
        word: "swimming pool",
        phonetic: "/ˈswɪmɪŋ puːl/",
        meaning: "bể bơi",
        example: "They go to the swimming pool.",
        exampleMeaning: "Họ đi đến bể bơi.",
        imageEmoji: "🏊‍♀️"
      },
      {
        word: "cook meals",
        phonetic: "/kʊk miːlz/",
        meaning: "nấu các bữa ăn",
        example: "She cooks meals on Sundays.",
        exampleMeaning: "Cô ấy nấu ăn vào Chủ nhật.",
        imageEmoji: "🍳"
      },
      {
        word: "do yoga",
        phonetic: "/duː ˈjəʊɡə/",
        meaning: "tập yoga",
        example: "My mother does yoga.",
        exampleMeaning: "Mẹ tôi tập yoga.",
        imageEmoji: "🧘‍♀️"
      },
      {
        word: "play tennis",
        phonetic: "/pleɪ ˈtenɪs/",
        meaning: "chơi quần vợt",
        example: "He plays tennis at the weekend.",
        exampleMeaning: "Cậu ấy chơi quần vợt vào cuối tuần.",
        imageEmoji: "🎾"
      },
      {
        word: "watch films",
        phonetic: "/wɒtʃ fɪlmz/",
        meaning: "xem phim",
        example: "They watch films at the cinema.",
        exampleMeaning: "Họ xem phim ở rạp chiếu phim.",
        imageEmoji: "🎥"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Where does he / she go on Saturdays? - He / She goes to the...",
        usage: "Hỏi và trả lời về địa điểm ai đó đi vào thứ Bảy"
      },
      {
        pattern: "What does he / she do on Sundays? - He / She...",
        usage: "Hỏi và trả lời về hoạt động ai đó làm vào Chủ nhật"
      }
    ],
    quizzes: [
      {
        question: "Where does your father go on Saturdays? - He _____ to the sports centre.",
        options: ["goes", "go", "going", "went"],
        answerIndex: 0,
        explanation: "Chủ ngữ ngôi thứ 3 số ít 'He' chia động từ 'goes'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Where", "does", "she", "go", "on", "Saturdays?"],
        correctSentence: "Where does she go on Saturdays?",
        vietnameseMeaning: "Cô ấy đi đâu vào các ngày thứ Bảy?"
      }
    ]
  },
  {
    unit: 16,
    book: "Phần 2",
    title: "Weather",
    emoji: "⛅",
    color: "from-sky-400 to-cyan-600",
    vocabulary: [
      {
        word: "cloudy",
        phonetic: "/ˈklaʊdi/",
        meaning: "có mây, nhiều mây",
        example: "It's cloudy today.",
        exampleMeaning: "Hôm nay trời nhiều mây.",
        imageEmoji: "☁️"
      },
      {
        word: "rainy",
        phonetic: "/ˈreɪni/",
        meaning: "có mưa",
        example: "It was rainy yesterday.",
        exampleMeaning: "Hôm qua trời có mưa.",
        imageEmoji: "🌧️"
      },
      {
        word: "sunny",
        phonetic: "/ˈsʌni/",
        meaning: "có nắng",
        example: "It was sunny in Sa Pa.",
        exampleMeaning: "Ở Sa Pa trời có nắng.",
        imageEmoji: "☀️"
      },
      {
        word: "weather",
        phonetic: "/ˈweðə/",
        meaning: "thời tiết",
        example: "What was the weather like?",
        exampleMeaning: "Thời tiết đã như thế nào?",
        imageEmoji: "🌤️"
      },
      {
        word: "windy",
        phonetic: "/ˈwɪndi/",
        meaning: "có gió",
        example: "It was windy yesterday.",
        exampleMeaning: "Hôm qua trời nhiều gió.",
        imageEmoji: "💨"
      },
      {
        word: "bakery",
        phonetic: "/ˈbeɪkəri/",
        meaning: "hiệu bánh mì",
        example: "I want to go to the bakery.",
        exampleMeaning: "Tôi muốn đi đến hiệu bánh mì.",
        imageEmoji: "🥐"
      },
      {
        word: "bookshop",
        phonetic: "/ˈbʊkʃɒp/",
        meaning: "hiệu sách",
        example: "There's a bookshop in Hoa Binh Street.",
        exampleMeaning: "Có một hiệu sách ở đường Hòa Bình.",
        imageEmoji: "📚"
      },
      {
        word: "food stall",
        phonetic: "/ˈfuːd stɔːl/",
        meaning: "quầy hàng thực phẩm",
        example: "He's at the food stall.",
        exampleMeaning: "Cậu ấy đang ở quầy thực phẩm.",
        imageEmoji: "🌭"
      },
      {
        word: "water park",
        phonetic: "/ˈwɔːtə pɑːk/",
        meaning: "công viên nước",
        example: "Do you want to go to the water park?",
        exampleMeaning: "Bạn có muốn đi công viên nước không?",
        imageEmoji: "🌊"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What was the weather like last weekend? - It was...",
        usage: "Hỏi và mô tả thời tiết trong quá khứ"
      },
      {
        pattern: "Do you want to go to the...? - Great! Let's go.",
        usage: "Đưa ra lời rủ và cách phản hồi"
      }
    ],
    quizzes: [
      {
        question: "What _____ the weather like last weekend? - It was sunny.",
        options: ["was", "is", "were", "are"],
        answerIndex: 0,
        explanation: "Hỏi thời tiết trong quá khứ ('last weekend') dùng 'was'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "was", "the", "weather", "like?", "It", "was", "sunny."],
        correctSentence: "What was the weather like? It was sunny.",
        vietnameseMeaning: "Thời tiết đã như thế nào? Trời có nắng."
      }
    ]
  },
  {
    unit: 17,
    book: "Phần 2",
    title: "In the city",
    emoji: "🚦",
    color: "from-blue-600 to-indigo-700",
    vocabulary: [
      {
        word: "go straight",
        phonetic: "/ɡəʊ streɪt/",
        meaning: "đi thẳng",
        example: "Go straight and turn left.",
        exampleMeaning: "Đi thẳng và rẽ trái.",
        imageEmoji: "⬆️"
      },
      {
        word: "left",
        phonetic: "/left/",
        meaning: "bên trái",
        example: "Turn left at the bakery.",
        exampleMeaning: "Rẽ trái ở hiệu bánh mì.",
        imageEmoji: "⬅️"
      },
      {
        word: "right",
        phonetic: "/raɪt/",
        meaning: "bên phải",
        example: "Turn right here.",
        exampleMeaning: "Rẽ phải ở đây.",
        imageEmoji: "➡️"
      },
      {
        word: "stop",
        phonetic: "/stɒp/",
        meaning: "dừng lại",
        example: "It says 'stop'.",
        exampleMeaning: "Biển báo nói 'dừng lại'.",
        imageEmoji: "🛑"
      },
      {
        word: "turn left",
        phonetic: "/tɜːn left/",
        meaning: "rẽ trái",
        example: "Turn left at the corner.",
        exampleMeaning: "Rẽ trái ở góc đường.",
        imageEmoji: "↩️"
      },
      {
        word: "turn right",
        phonetic: "/tɜːn raɪt/",
        meaning: "rẽ phải",
        example: "Turn right, please.",
        exampleMeaning: "Xin vui lòng rẽ phải.",
        imageEmoji: "↪️"
      },
      {
        word: "turn round",
        phonetic: "/tɜːn raʊnd/",
        meaning: "quay lại, đổi hướng ngược lại",
        example: "Go straight and turn round.",
        exampleMeaning: "Đi thẳng và quay đầu lại.",
        imageEmoji: "🔄"
      },
      {
        word: "road sign",
        phonetic: "/ˈrəʊd saɪn/",
        meaning: "biển chỉ đường",
        example: "Look at the road sign.",
        exampleMeaning: "Hãy nhìn biển báo giao thông.",
        imageEmoji: "🚸"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What does it say? - It says '...'.",
        usage: "Hỏi và đọc thông tin trên biển chỉ đường"
      },
      {
        pattern: "How can I get to the...? - Go straight / turn left...",
        usage: "Hỏi và chỉ đường đi đến một địa điểm"
      }
    ],
    quizzes: [
      {
        question: "How can I get to the bookshop? - _____ straight and turn left.",
        options: ["Go", "Turn", "Get", "See"],
        answerIndex: 0,
        explanation: "Dùng cụm động từ 'Go straight' để chỉ hướng 'đi thẳng'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Go", "straight", "and", "turn", "left."],
        correctSentence: "Go straight and turn left.",
        vietnameseMeaning: "Hãy đi thẳng và rẽ trái."
      }
    ]
  },
  {
    unit: 18,
    book: "Phần 2",
    title: "At the shopping centre",
    emoji: "🛍️",
    color: "from-pink-500 to-rose-600",
    vocabulary: [
      {
        word: "behind",
        phonetic: "/bɪˈhaɪnd/",
        meaning: "đằng sau",
        example: "The bakery is behind the bookshop.",
        exampleMeaning: "Hiệu bánh ở đằng sau hiệu sách.",
        imageEmoji: "🔙"
      },
      {
        word: "between",
        phonetic: "/bɪˈtwiːn/",
        meaning: "ở giữa",
        example: "It's between the gift shop and the bakery.",
        exampleMeaning: "Nó nằm ở giữa cửa hàng quà tặng và hiệu bánh.",
        imageEmoji: "↔️"
      },
      {
        word: "near",
        phonetic: "/nɪə/",
        meaning: "ở gần",
        example: "It's near the gift shop.",
        exampleMeaning: "Nó ở gần cửa hàng quà tặng.",
        imageEmoji: "📍"
      },
      {
        word: "opposite",
        phonetic: "/ˈɒpəzɪt/",
        meaning: "đối diện",
        example: "The bookshop is opposite the shoe shop.",
        exampleMeaning: "Hiệu sách đối diện với cửa hàng giày.",
        imageEmoji: "🔄"
      },
      {
        word: "gift shop",
        phonetic: "/ˈɡɪft ʃɒp/",
        meaning: "cửa hàng quà tặng",
        example: "She is at the gift shop.",
        exampleMeaning: "Cô ấy đang ở cửa hàng quà tặng.",
        imageEmoji: "🎁"
      },
      {
        word: "skirt",
        phonetic: "/skɜːt/",
        meaning: "chiếc váy",
        example: "How much is the skirt?",
        exampleMeaning: "Chiếc váy này giá bao nhiêu?",
        imageEmoji: "👗"
      },
      {
        word: "T-shirt",
        phonetic: "/ˈtiː ʃɜːt/",
        meaning: "áo thun / áo phông",
        example: "It's sixty thousand dong.",
        exampleMeaning: "Nó giá 60.000 đồng.",
        imageEmoji: "👕"
      },
      {
        word: "dong",
        phonetic: "/dɒŋ/",
        meaning: "đồng (tiền tệ Việt Nam)",
        example: "It's fifty thousand dong.",
        exampleMeaning: "Nó giá 50.000 đồng.",
        imageEmoji: "💵"
      },
      {
        word: "thousand",
        phonetic: "/ˈθaʊznd/",
        meaning: "nghìn, ngàn",
        example: "It's eighty thousand dong.",
        exampleMeaning: "Nó giá 80.000 đồng.",
        imageEmoji: "🔢"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Where's the bookshop? - It's...",
        usage: "Hỏi và trả lời về vị trí của cửa hàng"
      },
      {
        pattern: "How much is the...? - It's...",
        usage: "Hỏi và trả lời về giá tiền món đồ"
      }
    ],
    quizzes: [
      {
        question: "_____ much is this T-shirt? - It's fifty thousand dong.",
        options: ["How", "What", "Where", "When"],
        answerIndex: 0,
        explanation: "Dùng 'How much is + món đồ?' để hỏi giá tiền."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["How", "much", "is", "the", "T-shirt?"],
        correctSentence: "How much is the T-shirt?",
        vietnameseMeaning: "Chiếc áo thun này giá bao nhiêu?"
      }
    ]
  },
  {
    unit: 19,
    book: "Phần 2",
    title: "The animal world",
    emoji: "🦁",
    color: "from-amber-600 to-orange-700",
    vocabulary: [
      {
        word: "crocodile",
        phonetic: "/ˈkrɒkədaɪl/",
        meaning: "cá sấu",
        example: "They're crocodiles.",
        exampleMeaning: "Chúng là những con cá sấu.",
        imageEmoji: "🐊"
      },
      {
        word: "giraffe",
        phonetic: "/dʒəˈrɑːf/",
        meaning: "hươu cao cổ",
        example: "They're giraffes.",
        exampleMeaning: "Chúng là hươu cao cổ.",
        imageEmoji: "🦒"
      },
      {
        word: "hippo",
        phonetic: "/ˈhɪpəʊ/",
        meaning: "hà mã",
        example: "They're hippos.",
        exampleMeaning: "Chúng là hà mã.",
        imageEmoji: "🦛"
      },
      {
        word: "lion",
        phonetic: "/ˈlaɪən/",
        meaning: "con sư tử",
        example: "They're lions.",
        exampleMeaning: "Chúng là những con sư tử.",
        imageEmoji: "🦁"
      },
      {
        word: "dance beautifully",
        phonetic: "/dɑːns ˈbjuːtɪfli/",
        meaning: "múa / khiêu vũ rất đẹp",
        example: "Because they dance beautifully.",
        exampleMeaning: "Bởi vì chúng múa rất đẹp.",
        imageEmoji: "💃"
      },
      {
        word: "roar loudly",
        phonetic: "/rɔː ˈlaʊdli/",
        meaning: "gầm, rống lên rất to",
        example: "Because they roar loudly.",
        exampleMeaning: "Bởi vì chúng gầm rất to.",
        imageEmoji: "🦁"
      },
      {
        word: "run quickly",
        phonetic: "/rʌn ˈkwɪkli/",
        meaning: "chạy rất nhanh",
        example: "Because they run quickly.",
        exampleMeaning: "Bởi vì chúng chạy rất nhanh.",
        imageEmoji: "🐆"
      },
      {
        word: "sing merrily",
        phonetic: "/sɪŋ ˈmerɪli/",
        meaning: "hót / hát líu lo vui vẻ",
        example: "Because they sing merrily.",
        exampleMeaning: "Bởi vì chúng hót rất vui vẻ.",
        imageEmoji: "🐦"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What are these animals? - They're...",
        usage: "Hỏi và nhận biết tên các loài động vật"
      },
      {
        pattern: "Why do you like...? - Because they...",
        usage: "Hỏi và giải thích lý do thích một loài động vật"
      }
    ],
    quizzes: [
      {
        question: "Why do you like lions? - Because they roar _____.",
        options: ["loudly", "loud", "loudness", "sing"],
        answerIndex: 0,
        explanation: "Dùng trạng từ 'loudly' để bổ nghĩa cho động từ 'roar'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Why", "do", "you", "like", "giraffes?", "Because", "they", "are", "tall."],
        correctSentence: "Why do you like giraffes? Because they are tall.",
        vietnameseMeaning: "Tại sao bạn thích hươu cao cổ? Vì chúng rất cao."
      }
    ]
  },
  {
    unit: 20,
    book: "Phần 2",
    title: "At summer camp",
    emoji: "⛺",
    color: "from-emerald-600 to-green-700",
    vocabulary: [
      {
        word: "build a campfire",
        phonetic: "/bɪld ə ˈkæmpfaɪə/",
        meaning: "đốt lửa trại",
        example: "He's building a campfire.",
        exampleMeaning: "Cậu ấy đang đốt lửa trại.",
        imageEmoji: "🔥"
      },
      {
        word: "dance around the campfire",
        phonetic: "/dɑːns əˈraʊnd ðə ˈkæmpfaɪə/",
        meaning: "nhảy múa quanh lửa trại",
        example: "They're dancing around the campfire.",
        exampleMeaning: "Họ đang nhảy múa quanh lửa trại.",
        imageEmoji: "💃"
      },
      {
        word: "play card games",
        phonetic: "/pleɪ kɑːd ɡeɪmz/",
        meaning: "chơi trò chơi thẻ bài",
        example: "They're playing card games.",
        exampleMeaning: "Họ đang chơi đánh bài.",
        imageEmoji: "🃏"
      },
      {
        word: "play tug of war",
        phonetic: "/pleɪ ˌtʌɡ əv ˈwɔː/",
        meaning: "chơi kéo co",
        example: "Some friends are playing tug of war.",
        exampleMeaning: "Một số bạn đang chơi kéo co.",
        imageEmoji: "🪢"
      },
      {
        word: "put up a tent",
        phonetic: "/pʊt ʌp ə ˈtent/",
        meaning: "dựng lều / cắm trại",
        example: "He's putting up a tent.",
        exampleMeaning: "Cậu ấy đang dựng lều.",
        imageEmoji: "⛺"
      },
      {
        word: "sing songs",
        phonetic: "/sɪŋ sɒŋz/",
        meaning: "hát các bài hát",
        example: "They are singing songs.",
        exampleMeaning: "Họ đang hát các bài hát.",
        imageEmoji: "🎤"
      },
      {
        word: "take a photo",
        phonetic: "/teɪk ə ˈfəʊtəʊ/",
        meaning: "chụp ảnh",
        example: "I am taking a photo.",
        exampleMeaning: "Tôi đang chụp một bức ảnh.",
        imageEmoji: "📸"
      },
      {
        word: "tell a story",
        phonetic: "/tel ə ˈstɔːri/",
        meaning: "kể câu chuyện",
        example: "Mai is telling a story.",
        exampleMeaning: "Mai đang kể một câu chuyện.",
        imageEmoji: "📖"
      }
    ],
    sentencePatterns: [
      {
        pattern: "What's he / she doing? - He's / She's...",
        usage: "Hỏi và trả lời về hoạt động một người đang làm"
      },
      {
        pattern: "What are they doing? - They're...",
        usage: "Hỏi và trả lời về hoạt động nhiều người đang làm"
      }
    ],
    quizzes: [
      {
        question: "What are they doing? - They're _____ card games.",
        options: ["playing", "play", "plays", "played"],
        answerIndex: 0,
        explanation: "Câu hỏi thì Hiện tại tiếp diễn trả lời với 'They're + V-ing'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["What", "are", "they", "doing?", "They're", "singing", "songs."],
        correctSentence: "What are they doing? They're singing songs.",
        vietnameseMeaning: "Họ đang làm gì? Họ đang hát các bài hát."
      }
    ]
  }
];

export const BADGES: { id: string; title: string; description: string; icon: string; reqSummary: string }[] = [
  {
    id: "first_word",
    title: "Bước Chân Đầu Tiên",
    description: "Hoàn thành bài Học từ vựng đầu tiên",
    icon: "🌱",
    reqSummary: "Học 1 Unit bất kỳ"
  },
  {
    id: "memory_champion",
    title: "Trí Nhớ Siêu Phàm",
    description: "Đạt thắng Lật thẻ 3 sao với tất cả các Unit",
    icon: "🧠",
    reqSummary: "Thắng Lật thẻ 3 sao tất cả các Unit"
  },
  {
    id: "spelling_hero",
    title: "Dũng Sĩ Ghép Từ",
    description: "Ghép đúng 3 sao với tất cả các Unit",
    icon: "🏹",
    reqSummary: "Ghép đúng 3 sao tất cả các Unit"
  },
  {
    id: "sentence_master",
    title: "Bậc Thầy Cú Pháp",
    description: "Ghép đúng 3 sao tất cả các Unit",
    icon: "🏰",
    reqSummary: "Ghép đúng 3 sao tất cả các Unit"
  },
  {
    id: "quiz_scholar",
    title: "Trạng Nguyên Tiếng Anh",
    description: "Đạt 3 sao điểm trắc nghiệm tất cả các Unit",
    icon: "👑",
    reqSummary: "Đạt 3 sao trắc nghiệm tất cả các Unit"
  },
  {
    id: "volume2_grad",
    title: "Đại Sứ Toàn Năng",
    description: "Chinh phục toàn bộ các Unit của chương trình học",
    icon: "🌟",
    reqSummary: "Hoàn thành toàn bộ Unit"
  }
];

export const AVATARS = [
  { id: "fox", name: "Cáo Thông Thái", icon: "🦊", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { id: "astronaut", name: "Phi Hành Gia", icon: "👨‍🚀", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "dino", name: "Khủng Long Dino", icon: "🦖", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { id: "panda", name: "Gấu Trúc Panda", icon: "🐼", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { id: "cat", name: "Mèo Thám Hiểm", icon: "🐱", color: "bg-pink-100 text-pink-700 border-pink-300" },
  { id: "owl", name: "Cú Mèo Học Giả", icon: "🦉", color: "bg-purple-100 text-purple-700 border-purple-300" }
];
