import { UnitData } from '../types';

export const GRADE_7_UNITS_DATA: UnitData[] = [
  {
    unit: 1,
    book: "Phần 1",
    title: "Hobbies",
    emoji: "🎨",
    color: "from-blue-500 to-indigo-600",
    vocabulary: [
      {
        word: "belong to",
        phonetic: "/bɪˈlɒŋ tə/",
        meaning: "thuộc về",
        example: "Gardening belongs to the most popular group.",
        exampleMeaning: "Làm vườn thuộc nhóm phổ biến nhất.",
        imageEmoji: "🏷️"
      },
      {
        word: "benefit",
        phonetic: "/ˈbenɪfɪt/",
        meaning: "lợi ích",
        example: "Each hobby has its own benefits.",
        exampleMeaning: "Mỗi sở thích đều có lợi ích riêng.",
        imageEmoji: "💎"
      },
      {
        word: "cardboard",
        phonetic: "/ˈkɑːdbɔːd/",
        meaning: "bìa các tông",
        example: "She uses cardboard to build a dollhouse.",
        exampleMeaning: "Cô ấy dùng bìa các tông để dựng nhà búp bê.",
        imageEmoji: "📦"
      },
      {
        word: "dollhouse",
        phonetic: "/ˈdɒlhaʊs/",
        meaning: "nhà búp bê",
        example: "My sister likes building dollhouses.",
        exampleMeaning: "Em gái tôi thích làm nhà búp bê.",
        imageEmoji: "🏠"
      },
      {
        word: "gardening",
        phonetic: "/ˈɡɑːdnɪŋ/",
        meaning: "làm vườn",
        example: "Gardening teaches children about flowers and plants.",
        exampleMeaning: "Làm vườn dạy trẻ em về hoa và cây cối.",
        imageEmoji: "🌱"
      },
      {
        word: "horse riding",
        phonetic: "/ˈhɔːs raɪdɪŋ/",
        meaning: "cưỡi ngựa",
        example: "Ann goes to a horse riding club every Sunday.",
        exampleMeaning: "Ann đến câu lạc bộ cưỡi ngựa mỗi Chủ nhật.",
        imageEmoji: "🐎"
      },
      {
        word: "jogging",
        phonetic: "/ˈdʒɒɡɪŋ/",
        meaning: "đi / chạy bộ thư giãn",
        example: "I go jogging every Thursday.",
        exampleMeaning: "Tôi đi chạy bộ vào mỗi thứ Năm.",
        imageEmoji: "🏃"
      },
      {
        word: "making models",
        phonetic: "/ˈmeɪkɪŋ ˈmɒdlz/",
        meaning: "làm mô hình",
        example: "My brother likes making models.",
        exampleMeaning: "Anh tôi thích làm mô hình.",
        imageEmoji: "✈️"
      },
      {
        word: "patience",
        phonetic: "/ˈpeɪʃns/",
        meaning: "sự kiên nhẫn",
        example: "Gardening helps you be more patient.",
        exampleMeaning: "Làm vườn giúp bạn kiên nhẫn hơn.",
        imageEmoji: "⏳"
      },
      {
        word: "responsibility",
        phonetic: "/rɪˌspɒnsəˈbɪləti/",
        meaning: "sự chịu trách nhiệm",
        example: "Children learn to take on responsibility.",
        exampleMeaning: "Trẻ em học cách gánh vác trách nhiệm.",
        imageEmoji: "🤝"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Do you like + V-ing? - Yes, I do. / No, I don't.",
        usage: "Hỏi và trả lời về sở thích (thích/không thích làm gì)"
      },
      {
        pattern: "S + like / love / enjoy / hate + V-ing...",
        usage: "Mô tả mức độ yêu thích hoặc ghét một hoạt động nào đó"
      }
    ],
    quizzes: [
      {
        question: "My dad loves _____ in the garden every morning.",
        options: [
          "working",
          "work",
          "worked",
          "works"
        ],
        answerIndex: 0,
        explanation: "Sau động từ chỉ sự yêu thích 'love' ta dùng động từ ở dạng V-ing ('working')."
      },
      {
        question: "Do you enjoy _____ models in your free time?",
        options: [
          "making",
          "make",
          "made",
          "makes"
        ],
        answerIndex: 0,
        explanation: "Động từ 'enjoy' luôn đi cùng V-ing."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["My", "sister", "likes", "building", "dollhouses."],
        correctSentence: "My sister likes building dollhouses.",
        vietnameseMeaning: "Em gái tôi thích làm nhà búp bê."
      },
      {
        scrambledWords: ["Gardening", "helps", "you", "be", "more", "patient."],
        correctSentence: "Gardening helps you be more patient.",
        vietnameseMeaning: "Làm vườn giúp bạn trở nên kiên nhẫn hơn."
      }
    ]
  },
  {
    unit: 2,
    book: "Phần 1",
    title: "Healthy living",
    emoji: "🥗",
    color: "from-emerald-500 to-green-600",
    vocabulary: [
      {
        word: "acne",
        phonetic: "/ˈækni/",
        meaning: "mụn trứng cá",
        example: "Acne affects 80% of young people.",
        exampleMeaning: "Mụn trứng cá ảnh hưởng đến 80% giới trẻ.",
        imageEmoji: "🤕"
      },
      {
        word: "affect",
        phonetic: "/əˈfekt/",
        meaning: "tác động, ảnh hưởng đến",
        example: "The weather may affect our skin condition.",
        exampleMeaning: "Thời tiết có thể ảnh hưởng đến tình trạng da của chúng ta.",
        imageEmoji: "⚡"
      },
      {
        word: "avoid",
        phonetic: "/əˈvɔɪd/",
        meaning: "tránh",
        example: "We avoid sweetened food and soft drinks.",
        exampleMeaning: "Chúng tôi tránh đồ ăn ngọt và nước nước ngọt.",
        imageEmoji: "🚫"
      },
      {
        word: "chapped lips",
        phonetic: "/tʃæpt lɪps/",
        meaning: "môi bị nứt nẻ",
        example: "I use lip balm for chapped lips.",
        exampleMeaning: "Tôi dùng son dưỡng cho môi nứt nẻ.",
        imageEmoji: "👄"
      },
      {
        word: "dim light",
        phonetic: "/dɪm laɪt/",
        meaning: "ánh sáng lờ mờ",
        example: "Don't read in dim light.",
        exampleMeaning: "Đừng đọc sách trong ánh sáng lờ mờ.",
        imageEmoji: "🕯️"
      },
      {
        word: "fit",
        phonetic: "/fɪt/",
        meaning: "gọn gàng, cân đối, khoẻ mạnh",
        example: "Being active helps keep you fit.",
        exampleMeaning: "Năng động giúp bạn giữ cơ thể cân đối.",
        imageEmoji: "💪"
      },
      {
        word: "health problem",
        phonetic: "/helθ ˈprɒbləm/",
        meaning: "vấn đề sức khỏe",
        example: "What health problems do you have?",
        exampleMeaning: "Bạn có vấn đề sức khỏe nào?",
        imageEmoji: "🏥"
      },
      {
        word: "sunburn",
        phonetic: "/ˈsʌnbɜːn/",
        meaning: "sự cháy nắng",
        example: "Wear a hat and suncream to avoid sunburn.",
        exampleMeaning: "Đội mũ và bôi kem chống nắng để tránh cháy nắng.",
        imageEmoji: "☀️"
      },
      {
        word: "tofu",
        phonetic: "/ˈtəʊfuː/",
        meaning: "đậu phụ",
        example: "Tofu has vegetable protein.",
        exampleMeaning: "Đậu phụ có đạm thực vật.",
        imageEmoji: "🥢"
      },
      {
        word: "vitamin",
        phonetic: "/ˈvɪtəmɪn/",
        meaning: "vi-ta-min",
        example: "Carrots are good for your eyes because they have vitamin A.",
        exampleMeaning: "Cà rốt tốt cho mắt vì chứa vitamin A.",
        imageEmoji: "🥕"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Simple sentence: S + V (+ O / Adv)",
        usage: "Cấu trúc câu đơn chỉ gồm một mệnh đề độc lập"
      },
      {
        pattern: "You should / shouldn't + V-bare...",
        usage: "Đưa ra lời khuyên về thói quen sức khỏe"
      }
    ],
    quizzes: [
      {
        question: "You _____ read in dim light because it is bad for your eyes.",
        options: [
          "shouldn't",
          "should",
          "can",
          "must"
        ],
        answerIndex: 0,
        explanation: "Dùng 'shouldn't' để đưa ra lời khuyên không nên làm điều gì có hại cho sức khỏe."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Don't", "read", "in", "dim", "light."],
        correctSentence: "Don't read in dim light.",
        vietnameseMeaning: "Đừng đọc sách trong ánh sáng lờ mờ."
      },
      {
        scrambledWords: ["Being", "active", "helps", "keep", "you", "fit."],
        correctSentence: "Being active helps keep you fit.",
        vietnameseMeaning: "Năng động giúp bạn giữ vóc dáng cân đối."
      }
    ]
  },
  {
    unit: 3,
    book: "Phần 1",
    title: "Community service",
    emoji: "🤝",
    color: "from-amber-500 to-orange-600",
    vocabulary: [
      {
        word: "clean-up activity",
        phonetic: "/ˈkliːn ʌp ækˈtɪvəti/",
        meaning: "hoạt động dọn dẹp",
        example: "We joined clean-up activities last summer.",
        exampleMeaning: "Chúng tôi đã tham gia các hoạt động dọn dẹp vào mùa hè ngoái.",
        imageEmoji: "🧹"
      },
      {
        word: "collect",
        phonetic: "/kəˈlekt/",
        meaning: "thu thập, gom góp",
        example: "They collect warm clothes for poor children.",
        exampleMeaning: "Họ gom quần áo ấm cho trẻ em nghèo.",
        imageEmoji: "📦"
      },
      {
        word: "community service",
        phonetic: "/kəˈmjuːnəti ˈsɜːvɪs/",
        meaning: "phục vụ cộng đồng",
        example: "Community service helps students develop themselves.",
        exampleMeaning: "Phục vụ cộng đồng giúp học sinh phát triển bản thân.",
        imageEmoji: "🌍"
      },
      {
        word: "donate",
        phonetic: "/dəʊˈneɪt/",
        meaning: "quyên góp, cho, tặng",
        example: "We donated books to homeless children.",
        exampleMeaning: "Chúng tôi đã quyên góp sách cho trẻ em lang thang.",
        imageEmoji: "🎁"
      },
      {
        word: "elderly",
        phonetic: "/ˈeldəli/",
        meaning: "người lớn tuổi, cao tuổi",
        example: "They read books to the elderly in the nursing home.",
        exampleMeaning: "Họ đọc sách cho các cụ già ở viện dưỡng lão.",
        imageEmoji: "👵"
      },
      {
        word: "exchange",
        phonetic: "/ɪksˈtʃeɪndʒ/",
        meaning: "trao đổi",
        example: "Students exchange used paper for notebooks.",
        exampleMeaning: "Học sinh đổi giấy cũ lấy vở viết.",
        imageEmoji: "🔄"
      },
      {
        word: "homeless children",
        phonetic: "/ˈhəʊmləs ˈtʃɪldrən/",
        meaning: "trẻ em vô gia cư",
        example: "The club cooked meals for homeless children.",
        exampleMeaning: "Câu lạc bộ đã nấu bữa ăn cho trẻ em vô gia cư.",
        imageEmoji: "🍲"
      },
      {
        word: "nursing home",
        phonetic: "/ˈnɜːsɪŋ həʊm/",
        meaning: "viện dưỡng lão",
        example: "We visited a nursing home last week.",
        exampleMeaning: "Chúng tôi đã thăm một viện dưỡng lão tuần trước.",
        imageEmoji: "🏡"
      },
      {
        word: "pick up litter",
        phonetic: "/pɪk ʌp ˈlɪtə/",
        meaning: "nhặt rác",
        example: "We picked up litter along the nearby roads.",
        exampleMeaning: "Chúng tôi đã nhặt rác dọc theo các con đường gần đó.",
        imageEmoji: "🗑️"
      },
      {
        word: "tutor",
        phonetic: "/ˈtjuːtə/",
        meaning: "phụ đạo, dạy kèm",
        example: "They tutor primary students during summer holidays.",
        exampleMeaning: "Họ dạy kèm cho học sinh tiểu học trong kỳ nghỉ hè.",
        imageEmoji: "✏️"
      }
    ],
    sentencePatterns: [
      {
        pattern: "S + V-ed / V2 (Past Simple)...",
        usage: "Thì Quá khứ đơn diễn tả hành động đã diễn ra và kết thúc trong quá khứ"
      },
      {
        pattern: "Sounds like great work! / Wonderful!",
        usage: "Đưa ra lời khen ngợi tích cực đối với một việc làm tốt"
      }
    ],
    quizzes: [
      {
        question: "Last year, our club _____ hundreds of books to poor children.",
        options: [
          "donated",
          "donate",
          "donates",
          "donating"
        ],
        answerIndex: 0,
        explanation: "Có mốc thời gian quá khứ 'Last year' nên động từ phải chia ở thì quá khứ đơn ('donated')."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["We", "donated", "books", "to", "homeless", "children."],
        correctSentence: "We donated books to homeless children.",
        vietnameseMeaning: "Chúng tôi đã quyên góp sách cho trẻ em vô gia cư."
      }
    ]
  },
  {
    unit: 4,
    book: "Phần 1",
    title: "Music and arts",
    emoji: "🎵",
    color: "from-purple-500 to-pink-600",
    vocabulary: [
      {
        word: "anthem",
        phonetic: "/ˈænθəm/",
        meaning: "bài quốc ca",
        example: "Van Cao composed Viet Nam's national anthem Tien Quan Ca.",
        exampleMeaning: "Văn Cao đã sáng tác bài quốc ca Tiến Quân Ca của Việt Nam.",
        imageEmoji: "🎼"
      },
      {
        word: "art gallery",
        phonetic: "/ɑːt ˈɡæləri/",
        meaning: "phòng triển lãm nghệ thuật",
        example: "Nick wants to go to an art gallery.",
        exampleMeaning: "Nick muốn đi đến một phòng triển lãm nghệ thuật.",
        imageEmoji: "🖼️"
      },
      {
        word: "composer",
        phonetic: "/kəmˈpəʊzə/",
        meaning: "nhà soạn nhạc",
        example: "Mozart is one of the world's greatest composers.",
        exampleMeaning: "Mozart là một trong những nhà soạn nhạc vĩ đại nhất thế giới.",
        imageEmoji: "🎻"
      },
      {
        word: "concert",
        phonetic: "/ˈkɒnsət/",
        meaning: "buổi hòa nhạc",
        example: "The orchestra will perform its final concert.",
        exampleMeaning: "Dàn nhạc sẽ biểu diễn buổi hòa nhạc cuối cùng.",
        imageEmoji: "🎷"
      },
      {
        word: "folk music",
        phonetic: "/ˈfəʊk mjuːzɪk/",
        meaning: "nhạc dân gian",
        example: "I prefer folk music to pop music.",
        exampleMeaning: "Tôi thích nhạc dân gian hơn nhạc trẻ.",
        imageEmoji: "🪕"
      },
      {
        word: "musical instrument",
        phonetic: "/ˈmjuːzɪkl ˈɪnstrəmənt/",
        meaning: "nhạc cụ",
        example: "Can you play any musical instruments?",
        exampleMeaning: "Bạn có biết chơi nhạc cụ nào không?",
        imageEmoji: "🎹"
      },
      {
        word: "painter",
        phonetic: "/ˈpeɪntə/",
        meaning: "họa sĩ",
        example: "Monet was a famous painter.",
        exampleMeaning: "Monet là một họa sĩ nổi tiếng.",
        imageEmoji: "🎨"
      },
      {
        word: "perform",
        phonetic: "/pəˈfɔːm/",
        meaning: "biểu diễn, trình diễn",
        example: "Artists perform water puppet shows in a pool.",
        exampleMeaning: "Các nghệ sĩ biểu diễn múa rối nước trong một bể nước.",
        imageEmoji: "🎭"
      },
      {
        word: "puppet theatre",
        phonetic: "/ˈpʌpɪt ˈθɪətə/",
        meaning: "rạp rối",
        example: "We went to a puppet theatre yesterday.",
        exampleMeaning: "Chúng tôi đã đến một rạp múa rối hôm qua.",
        imageEmoji: "🎪"
      },
      {
        word: "water puppetry",
        phonetic: "/ˈwɔːtə ˈpʌpɪtri/",
        meaning: "múa rối nước",
        example: "Water puppetry is a traditional Vietnamese art form.",
        exampleMeaning: "Múa rối nước là một hình thức nghệ thuật truyền thống của Việt Nam.",
        imageEmoji: "🌊"
      }
    ],
    sentencePatterns: [
      {
        pattern: "S1 + be + (not) as + adj + as + S2",
        usage: "Cấu trúc so sánh bằng hoặc không bằng"
      },
      {
        pattern: "S1 + be + like / different from + S2",
        usage: "So sánh sự giống nhau (like) hoặc khác nhau (different from)"
      }
    ],
    quizzes: [
      {
        question: "This picture is not _____ as that one.",
        options: [
          "as expensive",
          "more expensive",
          "expensive than",
          "expensive"
        ],
        answerIndex: 0,
        explanation: "Cấu trúc so sánh bằng ở dạng phủ định: 'not as + adj + as'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["This", "camera", "is", "different", "from", "mine."],
        correctSentence: "This camera is different from mine.",
        vietnameseMeaning: "Chiếc máy ảnh này khác với chiếc của tôi."
      }
    ]
  },
  {
    unit: 5,
    book: "Phần 1",
    title: "Food and drink",
    emoji: "🍲",
    color: "from-rose-500 to-red-600",
    vocabulary: [
      {
        word: "beef noodle soup",
        phonetic: "/biːf ˈnuːdl suːp/",
        meaning: "phở bò",
        example: "Pho bo is my favourite food.",
        exampleMeaning: "Phở bò là món ăn yêu thích của tôi.",
        imageEmoji: "🍜"
      },
      {
        word: "broth",
        phonetic: "/brɒθ/",
        meaning: "nước dùng, nước lèo",
        example: "The broth for pho is made by stewing bones.",
        exampleMeaning: "Nước dùng phở được ninh từ xương.",
        imageEmoji: "🥣"
      },
      {
        word: "ingredient",
        phonetic: "/ɪnˈɡriːdiənt/",
        meaning: "thành phần, nguyên liệu",
        example: "Rice noodles and beef are the main ingredients of pho.",
        exampleMeaning: "Bánh phở và thịt bò là nguyên liệu chính của phở.",
        imageEmoji: "🥩"
      },
      {
        word: "lemonade",
        phonetic: "/ˌleməˈneɪd/",
        meaning: "nước chanh",
        example: "I'd like a glass of lemonade, please.",
        exampleMeaning: "Cho tôi một ly nước chanh.",
        imageEmoji: "🍋"
      },
      {
        word: "mineral water",
        phonetic: "/ˈmɪnərəl ˈwɔːtə/",
        meaning: "nước khoáng",
        example: "How much is a bottle of mineral water?",
        exampleMeaning: "Một chai nước khoáng giá bao nhiêu?",
        imageEmoji: "💧"
      },
      {
        word: "omelette",
        phonetic: "/ˈɒmlət/",
        meaning: "trứng tráng",
        example: "We need two eggs to make an omelette.",
        exampleMeaning: "Chúng ta cần hai quả trứng để làm món trứng tráng.",
        imageEmoji: "🍳"
      },
      {
        word: "pancake",
        phonetic: "/ˈpænkeɪk/",
        meaning: "bánh kếp",
        example: "My mum makes delicious pancakes.",
        exampleMeaning: "Mẹ tôi làm bánh kếp rất ngon.",
        imageEmoji: "🥞"
      },
      {
        word: "pork",
        phonetic: "/pɔːk/",
        meaning: "thịt lợn / thịt heo",
        example: "We'd like rice with some pork.",
        exampleMeaning: "Chúng tôi muốn ăn cơm với một ít thịt lợn.",
        imageEmoji: "🍖"
      },
      {
        word: "spring roll",
        phonetic: "/ˌsprɪŋ ˈrəʊl/",
        meaning: "nem rán / chả giò",
        example: "I love spring rolls.",
        exampleMeaning: "Tôi rất thích nem rán.",
        imageEmoji: "🥢"
      },
      {
        word: "tofu",
        phonetic: "/ˈtəʊfuː/",
        meaning: "đậu phụ",
        example: "They order some fried tofu.",
        exampleMeaning: "Họ gọi một ít đậu phụ rán.",
        imageEmoji: "🥟"
      }
    ],
    sentencePatterns: [
      {
        pattern: "How much is / are...? - It's / They're...",
        usage: "Hỏi và trả lời về giá tiền của đồ ăn, thức uống"
      },
      {
        pattern: "How many + N (đếm được)...? / How much + N (không đếm được)...?",
        usage: "Hỏi số lượng đồ ăn/thức uống"
      }
    ],
    quizzes: [
      {
        question: "How _____ milk do you drink every day?",
        options: [
          "much",
          "many",
          "few",
          "long"
        ],
        answerIndex: 0,
        explanation: "'milk' là danh từ không đếm được nên dùng 'How much'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["How", "much", "is", "a", "bottle", "of", "water?"],
        correctSentence: "How much is a bottle of water?",
        vietnameseMeaning: "Một chai nước giá bao nhiêu tiền?"
      }
    ]
  },
  {
    unit: 6,
    book: "Phần 1",
    title: "A visit to a school",
    emoji: "🏫",
    color: "from-sky-500 to-blue-600",
    vocabulary: [
      {
        word: "computer room",
        phonetic: "/kəmˈpjuːtə ruːm/",
        meaning: "phòng máy tính",
        example: "We learn how to use the Internet in the computer room.",
        exampleMeaning: "Chúng tôi học cách dùng Internet trong phòng máy tính.",
        imageEmoji: "💻"
      },
      {
        word: "entrance exam",
        phonetic: "/ˈentrəns ɪɡˈzæm/",
        meaning: "kỳ thi đầu vào / tuyển sinh",
        example: "Students have to pass an entrance exam to enter this school.",
        exampleMeaning: "Học sinh phải vượt qua kỳ thi đầu vào để vào trường này.",
        imageEmoji: "📝"
      },
      {
        word: "facility",
        phonetic: "/fəˈsɪləti/",
        meaning: "cơ sở vật chất, tiện nghi",
        example: "The school has modern facilities.",
        exampleMeaning: "Trường có cơ sở vật chất hiện đại.",
        imageEmoji: "🏢"
      },
      {
        word: "gifted student",
        phonetic: "/ˈɡɪftɪd ˈstjuːdnt/",
        meaning: "học sinh năng khiếu / học sinh giỏi",
        example: "This is a famous school for gifted students.",
        exampleMeaning: "Đây là trường nổi tiếng dành cho học sinh năng khiếu.",
        imageEmoji: "🎓"
      },
      {
        word: "laboratory",
        phonetic: "/ləˈbɒrətri/",
        meaning: "phòng thí nghiệm",
        example: "We have science lessons in the laboratory.",
        exampleMeaning: "Chúng tôi học môn khoa học trong phòng thí nghiệm.",
        imageEmoji: "🔬"
      },
      {
        word: "lower secondary school",
        phonetic: "/ˌləʊə ˈsekəndri skuːl/",
        meaning: "trường trung học cơ sở",
        example: "Binh Minh Lower Secondary School is very famous.",
        exampleMeaning: "Trường THCS Bình Minh rất nổi tiếng.",
        imageEmoji: "🏫"
      },
      {
        word: "outdoor activity",
        phonetic: "/ˈaʊtdɔː ækˈtɪvəti/",
        meaning: "hoạt động ngoài trời",
        example: "My brother enjoys outdoor activities.",
        exampleMeaning: "Anh tôi thích các hoạt động ngoài trời.",
        imageEmoji: "⚽"
      },
      {
        word: "playground",
        phonetic: "/ˈpleɪɡraʊnd/",
        meaning: "sân chơi, sân trường",
        example: "Students play football in the playground.",
        exampleMeaning: "Học sinh đá bóng trên sân trường.",
        imageEmoji: "🛝"
      },
      {
        word: "school library",
        phonetic: "/skuːl ˈlaɪbrəri/",
        meaning: "thư viện trường",
        example: "There are many books in the school library.",
        exampleMeaning: "Có rất nhiều sách trong thư viện trường.",
        imageEmoji: "📚"
      },
      {
        word: "well-known",
        phonetic: "/ˌwel ˈnəʊn/",
        meaning: "nổi tiếng",
        example: "Chu Van An is a well-known teacher in Viet Nam.",
        exampleMeaning: "Chu Văn An là một người thầy nổi tiếng ở Việt Nam.",
        imageEmoji: "⭐"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Prepositions of time (at, on, in) & place (at, on, in)",
        usage: "Giới từ chỉ thời gian và nơi chốn (at 7 o'clock, on Monday, in 2023 / at school, on the wall, in the classroom)"
      },
      {
        pattern: "Can you tell me more about...? - Sure,...",
        usage: "Đưa ra lời đề nghị hỏi thêm chi tiết thông tin"
      }
    ],
    quizzes: [
      {
        question: "My class usually has PE lessons _____ Monday mornings.",
        options: [
          "on",
          "in",
          "at",
          "to"
        ],
        answerIndex: 0,
        explanation: "Dùng giới từ 'on' trước thứ hoặc buổi của một thứ cụ thể ('on Monday mornings')."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["The", "school", "has", "very", "modern", "facilities."],
        correctSentence: "The school has very modern facilities.",
        vietnameseMeaning: "Ngôi trường có cơ sở vật chất rất hiện đại."
      }
    ]
  },
  {
    unit: 7,
    book: "Phần 2",
    title: "Traffic",
    emoji: "🚦",
    color: "from-amber-600 to-yellow-600",
    vocabulary: [
      {
        word: "bumpy",
        phonetic: "/ˈbʌmpi/",
        meaning: "gồ ghề, lồi lõm",
        example: "The road is very narrow and bumpy.",
        exampleMeaning: "Con đường rất hẹp và gồ ghề.",
        imageEmoji: "〰️"
      },
      {
        word: "cycle lane",
        phonetic: "/ˈsaɪkl leɪn/",
        meaning: "làn đường dành cho xe đạp",
        example: "You should ride your bike in the cycle lane.",
        exampleMeaning: "Bạn nên đi xe đạp trong làn đường dành cho xe đạp.",
        imageEmoji: "🚲"
      },
      {
        word: "handlebars",
        phonetic: "/ˈhændlbɑːz/",
        meaning: "tay lái, ghi-đông",
        example: "Ride your bike with both hands on the handlebars.",
        exampleMeaning: "Hãy đi xe đạp bằng cả hai tay trên ghi-đông.",
        imageEmoji: "🚲"
      },
      {
        word: "means of transport",
        phonetic: "/miːnz əv ˈtrænspɔːt/",
        meaning: "phương tiện giao thông",
        example: "What means of transport do you use?",
        exampleMeaning: "Bạn sử dụng phương tiện giao thông nào?",
        imageEmoji: "🚗"
      },
      {
        word: "obey traffic rules",
        phonetic: "/əˈbeɪ ˈtræfɪk ruːlz/",
        meaning: "tuân thủ luật giao thông",
        example: "We must obey traffic rules for our safety.",
        exampleMeaning: "Chúng ta phải tuân thủ luật giao thông vì sự an toàn của mình.",
        imageEmoji: "👮"
      },
      {
        word: "passenger",
        phonetic: "/ˈpæsɪndʒə/",
        meaning: "hành khách",
        example: "The bus was carrying forty passengers.",
        exampleMeaning: "Chiếc xe buýt chở bốn mươi hành khách.",
        imageEmoji: "🚌"
      },
      {
        word: "pavement",
        phonetic: "/ˈpeɪvmənt/",
        meaning: "vỉa hè",
        example: "Pedestrians should walk on the pavement.",
        exampleMeaning: "Người đi bộ nên đi trên vỉa hè.",
        imageEmoji: "🚶"
      },
      {
        word: "pedestrian",
        phonetic: "/pəˈdestriən/",
        meaning: "người đi bộ",
        example: "A road user can be a pedestrian, cyclist or motorist.",
        exampleMeaning: "Người tham gia giao thông có thể là người đi bộ, người đi xe đạp hoặc xe máy.",
        imageEmoji: "🚶‍♂️"
      },
      {
        word: "seatbelt",
        phonetic: "/ˈsiːtbelt/",
        meaning: "dây an toàn",
        example: "Fasten your seatbelt when you are in a car.",
        exampleMeaning: "Hãy thắt dây an toàn khi bạn ngồi trong ô tô.",
        imageEmoji: "🎗️"
      },
      {
        word: "traffic jam",
        phonetic: "/ˈtræfɪk dʒæm/",
        meaning: "tắc đường",
        example: "Traffic jams are a big problem in big cities.",
        exampleMeaning: "Tắc đường là một vấn đề lớn ở các thành phố lớn.",
        imageEmoji: "🚙"
      }
    ],
    sentencePatterns: [
      {
        pattern: "How far is it from A to B? - It is about... (metres / kilometres)",
        usage: "Hỏi và trả lời về khoảng cách địa lý giữa hai điểm"
      },
      {
        pattern: "S + should / shouldn't + V-bare...",
        usage: "Khuyên nên hoặc không nên làm gì khi tham gia giao thông"
      }
    ],
    quizzes: [
      {
        question: "_____ far is it from your home to school? - It's about two kilometres.",
        options: [
          "How",
          "What",
          "Where",
          "When"
        ],
        answerIndex: 0,
        explanation: "Dùng 'How far' để hỏi khoảng cách."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["How", "far", "is", "it", "from", "your", "house", "to", "school?"],
        correctSentence: "How far is it from your house to school?",
        vietnameseMeaning: "Từ nhà bạn đến trường bao xa?"
      }
    ]
  },
  {
    unit: 8,
    book: "Phần 2",
    title: "Films",
    emoji: "🎬",
    color: "from-indigo-600 to-purple-700",
    vocabulary: [
      {
        word: "comedy",
        phonetic: "/ˈkɒmədi/",
        meaning: "phim hài",
        example: "A comedy makes the audience laugh.",
        exampleMeaning: "Phim hài khiến khán giả bật cười.",
        imageEmoji: "😂"
      },
      {
        word: "documentary",
        phonetic: "/ˌdɒkjuˈmentri/",
        meaning: "phim tài liệu",
        example: "Documentaries give us useful information.",
        exampleMeaning: "Phim tài liệu cho chúng ta nhiều thông tin bổ ích.",
        imageEmoji: "📽️"
      },
      {
        word: "fantasy",
        phonetic: "/ˈfæntəsi/",
        meaning: "phim giả tưởng",
        example: "Harry Potter is a famous fantasy film.",
        exampleMeaning: "Harry Potter là một bộ phim giả tưởng nổi tiếng.",
        imageEmoji: "🧙"
      },
      {
        word: "gripping",
        phonetic: "/ˈɡrɪpɪŋ/",
        meaning: "hấp dẫn, lôi cuốn",
        example: "The film received good reviews because the story was gripping.",
        exampleMeaning: "Bộ phim nhận được đánh giá tốt vì kịch bản rất hấp dẫn.",
        imageEmoji: "🤩"
      },
      {
        word: "horror film",
        phonetic: "/ˈhɒrə fɪlm/",
        meaning: "phim kinh dị",
        example: "Horror films make me feel scared.",
        exampleMeaning: "Phim kinh dị làm tôi cảm thấy sợ hãi.",
        imageEmoji: "👻"
      },
      {
        word: "moving",
        phonetic: "/ˈmuːvɪŋ/",
        meaning: "cảm động",
        example: "It was such a moving film that many people cried.",
        exampleMeaning: "Đó là một bộ phim cảm động đến mức nhiều người đã khóc.",
        imageEmoji: "😢"
      },
      {
        word: "must-see",
        phonetic: "/ˌmʌst ˈsiː/",
        meaning: "tác phẩm phải xem",
        example: "This documentary is a must-see for teenagers.",
        exampleMeaning: "Bộ phim tài liệu này là tác phẩm phải xem đối với thanh thiếu niên.",
        imageEmoji: "🌟"
      },
      {
        word: "review",
        phonetic: "/rɪˈvjuː/",
        meaning: "bài đánh giá, phê bình",
        example: "I read a film review on Mark's blog.",
        exampleMeaning: "Tôi đọc bài phê bình phim trên blog của Mark.",
        imageEmoji: "📰"
      },
      {
        word: "science fiction",
        phonetic: "/ˈsaɪəns ˈfɪkʃn/",
        meaning: "phim khoa học viễn tưởng",
        example: "Science fiction films are about life in the future.",
        exampleMeaning: "Phim khoa học viễn tưởng nói về cuộc sống trong tương lai.",
        imageEmoji: "🛸"
      },
      {
        word: "star",
        phonetic: "/stɑː/",
        meaning: "đóng vai chính",
        example: "Daniel Radcliffe stars in the Harry Potter films.",
        exampleMeaning: "Daniel Radcliffe đóng vai chính trong loạt phim Harry Potter.",
        imageEmoji: "⭐"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Although / Though + Clause 1, Clause 2.",
        usage: "Diễn tả sự nhượng bộ, tương phản giữa hai mệnh đề"
      },
      {
        pattern: "Clause 1. However, Clause 2.",
        usage: "Dùng trạng từ liên kết 'However' thể hiện ý trái ngược"
      }
    ],
    quizzes: [
      {
        question: "_____ the film was frightening, many children enjoyed watching it.",
        options: [
          "Although",
          "However",
          "Because",
          "Despite"
        ],
        answerIndex: 0,
        explanation: "Dùng 'Although' đứng đầu mệnh đề chỉ sự tương phản."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Although", "the", "story", "was", "sad,", "I", "loved", "it."],
        correctSentence: "Although the story was sad, I loved it.",
        vietnameseMeaning: "Mặc dù câu chuyện buồn, tôi vẫn rất thích nó."
      }
    ]
  },
  {
    unit: 9,
    book: "Phần 2",
    title: "Festivals around the world",
    emoji: "🎉",
    color: "from-pink-500 to-rose-600",
    vocabulary: [
      {
        word: "Cannes Film Festival",
        phonetic: "/ˌkæn fɪlm ˈfestɪvl/",
        meaning: "Liên hoan phim Cannes",
        example: "At the Cannes Film Festival, there are many interesting films.",
        exampleMeaning: "Tại Liên hoan phim Cannes có rất nhiều bộ phim thú vị.",
        imageEmoji: "🏆"
      },
      {
        word: "costume",
        phonetic: "/ˈkɒstjuːm/",
        meaning: "trang phục truyền thống / hoá trang",
        example: "People wear traditional costumes at the festival.",
        exampleMeaning: "Mọi người mặc trang phục truyền thống tại lễ hội.",
        imageEmoji: "👘"
      },
      {
        word: "Easter",
        phonetic: "/ˈiːstə/",
        meaning: "Lễ Phục sinh",
        example: "Children paint eggs at Easter.",
        exampleMeaning: "Trẻ em vẽ trứng vào Lễ Phục sinh.",
        imageEmoji: "🥚"
      },
      {
        word: "feast",
        phonetic: "/fiːst/",
        meaning: "bữa tiệc lớn",
        example: "Family members gather to have a feast on Thanksgiving.",
        exampleMeaning: "Các thành viên gia đình sum họp ăn tiệc vào Lễ Tạ ơn.",
        imageEmoji: "🍗"
      },
      {
        word: "fireworks display",
        phonetic: "/ˈfaɪəwɜːks dɪˈspleɪ/",
        meaning: "màn bắn pháo hoa",
        example: "We watched a fireworks display on New Year's Eve.",
        exampleMeaning: "Chúng tôi xem bắn pháo hoa vào đêm Giao thừa.",
        imageEmoji: "🎆"
      },
      {
        word: "float",
        phonetic: "/fləʊt/",
        meaning: "xe diễu hành",
        example: "I saw beautiful tulip floats at the parade.",
        exampleMeaning: "Tôi đã thấy những chiếc xe diễu hành hoa tu-lip đẹp mắt.",
        imageEmoji: "🌸"
      },
      {
        word: "Mid-Autumn Festival",
        phonetic: "/ˌmɪd ˈɔːtəm ˈfestɪvl/",
        meaning: "Tết Trung thu",
        example: "Children eat moon cakes during Mid-Autumn Festival.",
        exampleMeaning: "Trẻ em ăn bánh trung thu trong dịp Tết Trung thu.",
        imageEmoji: "🥮"
      },
      {
        word: "parade",
        phonetic: "/pəˈreɪd/",
        meaning: "cuộc diễu hành",
        example: "Thousands of twins took part in the parade.",
        exampleMeaning: "Hàng ngàn cặp sinh đôi đã tham gia cuộc diễu hành.",
        imageEmoji: "🥁"
      },
      {
        word: "symbol",
        phonetic: "/ˈsɪmbl/",
        meaning: "biểu tượng",
        example: "The Christmas tree is the symbol of long life.",
        exampleMeaning: "Cây thông Noel là biểu tượng của sự trường thọ.",
        imageEmoji: "🎄"
      },
      {
        word: "Thanksgiving",
        phonetic: "/ˌθæŋksˈɡɪvɪŋ/",
        meaning: "Lễ Tạ ơn",
        example: "Thanksgiving is celebrated on the third Thursday of November.",
        exampleMeaning: "Lễ Tạ ơn được tổ chức vào ngày thứ Năm thứ ba của tháng Mười Một.",
        imageEmoji: "🦃"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Auxiliary Verb (Do/Does/Did/Is/Are/Can...) + S + V...? - Yes, S + Aux. / No, S + Aux + not.",
        usage: "Mẫu câu hỏi Nghi vấn Yes/No questions"
      },
      {
        pattern: "Expressing disappointment: It was disappointing! / It was a big disappointment.",
        usage: "Bày tỏ sự thất vọng về một sự kiện hay trải nghiệm"
      }
    ],
    quizzes: [
      {
        question: "_____ they hold the Tulip Festival every year in the Netherlands? - Yes, they do.",
        options: [
          "Do",
          "Are",
          "Did",
          "Will"
        ],
        answerIndex: 0,
        explanation: "Câu hỏi Yes/No ở thì Hiện tại đơn với chủ ngữ 'they' và động từ thường 'hold' dùng trợ động từ 'Do'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["People", "wear", "traditional", "costumes", "at", "the", "parade."],
        correctSentence: "People wear traditional costumes at the parade.",
        vietnameseMeaning: "Mọi người mặc trang phục truyền thống tại cuộc diễu hành."
      }
    ]
  },
  {
    unit: 10,
    book: "Phần 2",
    title: "Energy sources",
    emoji: "⚡",
    color: "from-teal-500 to-cyan-600",
    vocabulary: [
      {
        word: "coal",
        phonetic: "/kəʊl/",
        meaning: "than đá",
        example: "Coal is a non-renewable energy source.",
        exampleMeaning: "Than đá là nguồn năng lượng không thể tái tạo.",
        imageEmoji: "⛏️"
      },
      {
        word: "electricity",
        phonetic: "/ɪˌlekˈtrɪsəti/",
        meaning: "điện năng",
        example: "We use energy to produce electricity.",
        exampleMeaning: "Chúng ta dùng năng lượng để sản xuất điện.",
        imageEmoji: "💡"
      },
      {
        word: "hydro energy",
        phonetic: "/ˈhaɪdrəʊ ˈenədʒi/",
        meaning: "năng lượng thủy điện",
        example: "Hydro energy comes from water.",
        exampleMeaning: "Năng lượng thủy điện đến từ nước.",
        imageEmoji: "💧"
      },
      {
        word: "non-renewable",
        phonetic: "/ˌnɒn rɪˈnjuːəbl/",
        meaning: "không thể tái tạo",
        example: "Oil and gas are non-renewable sources.",
        exampleMeaning: "Dầu mỏ và khí đốt là các nguồn không tái tạo được.",
        imageEmoji: "🛢️"
      },
      {
        word: "nuclear energy",
        phonetic: "/ˈnjuːkliə ˈenədʒi/",
        meaning: "năng lượng hạt nhân",
        example: "Nuclear energy is expensive and dangerous.",
        exampleMeaning: "Năng lượng hạt nhân đắt đỏ và nguy hiểm.",
        imageEmoji: "☢️"
      },
      {
        word: "renewable",
        phonetic: "/rɪˈnjuːəbl/",
        meaning: "có thể tái tạo",
        example: "Wind and solar are renewable energy sources.",
        exampleMeaning: "Gió và mặt trời là các nguồn năng lượng có thể tái tạo.",
        imageEmoji: "♻️"
      },
      {
        word: "solar panel",
        phonetic: "/ˈsəʊlə ˈpænl/",
        meaning: "tấm pin mặt trời",
        example: "They are putting solar panels on the roof.",
        exampleMeaning: "Họ đang lắp các tấm pin mặt trời trên mái nhà.",
        imageEmoji: "☀️"
      },
      {
        word: "solar energy",
        phonetic: "/ˈsəʊlə ˈenədʒi/",
        meaning: "năng lượng mặt trời",
        example: "Solar energy is clean and safe to use.",
        exampleMeaning: "Năng lượng mặt trời sạch và an toàn khi sử dụng.",
        imageEmoji: "🌞"
      },
      {
        word: "wind energy",
        phonetic: "/wɪnd ˈenədʒi/",
        meaning: "năng lượng gió",
        example: "Wind energy will not run out.",
        exampleMeaning: "Năng lượng gió sẽ không bao giờ cạn kiệt.",
        imageEmoji: "💨"
      },
      {
        word: "wind turbine",
        phonetic: "/wɪnd ˈtɜːbaɪn/",
        meaning: "tua-bin gió",
        example: "Wind turbines generate green electricity.",
        exampleMeaning: "Các tua-bin gió phát ra điện sạch.",
        imageEmoji: "🌬️"
      }
    ],
    sentencePatterns: [
      {
        pattern: "S + am / is / are + V-ing...",
        usage: "Thì Hiện tại tiếp diễn mô tả sự việc đang xảy ra hoặc xu hướng đang diễn ra"
      },
      {
        pattern: "What does... mean? - It means...",
        usage: "Hỏi và định nghĩa khái niệm nguồn năng lượng"
      }
    ],
    quizzes: [
      {
        question: "Look! They _____ solar panels on the roof of the school building.",
        options: [
          "are putting",
          "put",
          "puts",
          "were putting"
        ],
        answerIndex: 0,
        explanation: "Có từ nhận biết 'Look!' chỉ hành động đang xảy ra nên chia ở thì Hiện tại tiếp diễn ('are putting')."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Solar", "energy", "is", "clean", "and", "safe", "to", "use."],
        correctSentence: "Solar energy is clean and safe to use.",
        vietnameseMeaning: "Năng lượng mặt trời sạch và an toàn khi sử dụng."
      }
    ]
  },
  {
    unit: 11,
    book: "Phần 2",
    title: "Travelling in the future",
    emoji: "🚀",
    color: "from-sky-600 to-indigo-700",
    vocabulary: [
      {
        word: "bamboo-copter",
        phonetic: "/ˌbæmˈbuː ˈkɒptə/",
        meaning: "chong chóng tre",
        example: "Travelling by bamboo-copter is simple: put it on and fly.",
        exampleMeaning: "Đi lại bằng chong chóng tre thật đơn giản: chỉ cần gắn vào và bay.",
        imageEmoji: "🚁"
      },
      {
        word: "driverless car",
        phonetic: "/ˈdraɪvələs kɑː/",
        meaning: "ô tô không người lái",
        example: "Driverless cars will run on electricity.",
        exampleMeaning: "Xe ô tô không người lái sẽ chạy bằng điện.",
        imageEmoji: "🚘"
      },
      {
        word: "eco-friendly",
        phonetic: "/ˌiːkəʊ ˈfrendli/",
        meaning: "thân thiện với môi trường",
        example: "Electric scooters are eco-friendly.",
        exampleMeaning: "Xe tay ga điện rất thân thiện với môi trường.",
        imageEmoji: "🌿"
      },
      {
        word: "flying car",
        phonetic: "/ˈflaɪɪŋ kɑː/",
        meaning: "ô tô bay",
        example: "People will soon travel in flying cars.",
        exampleMeaning: "Con người sẽ sớm đi lại bằng xe ô tô bay.",
        imageEmoji: "🛸"
      },
      {
        word: "hyperloop",
        phonetic: "/ˈhaɪpəluːp/",
        meaning: "hệ thống tàu siêu tốc ống chân không",
        example: "Hyperloop is a system of tubes.",
        exampleMeaning: "Hyperloop là một hệ thống các ống dẫn.",
        imageEmoji: "🚄"
      },
      {
        word: "solowheel",
        phonetic: "/ˈsəʊləʊwiːl/",
        meaning: "xe tự hành một bánh",
        example: "A solowheel has one wheel and is eco-friendly.",
        exampleMeaning: "Xe solowheel chỉ có một bánh và rất thân thiện môi trường.",
        imageEmoji: "🛞"
      },
      {
        word: "solar-powered ship",
        phonetic: "/ˈsəʊlə ˈpaʊəd ʃɪp/",
        meaning: "tàu thủy chạy bằng năng lượng mặt trời",
        example: "Solar-powered ships won't cause pollution.",
        exampleMeaning: "Tàu thủy chạy bằng năng lượng mặt trời sẽ không gây ô nhiễm.",
        imageEmoji: "🚢"
      },
      {
        word: "teleporter",
        phonetic: "/ˈtelɪpɔːtə/",
        meaning: "phương tiện dịch chuyển tức thời",
        example: "A teleporter makes you disappear then appear in another place.",
        exampleMeaning: "Thần dịch chuyển giúp bạn biến mất rồi xuất hiện ở vị trí khác.",
        imageEmoji: "⚡"
      },
      {
        word: "possessive pronoun",
        phonetic: "/pəˈzesɪv ˈprəʊnaʊn/",
        meaning: "đại từ sở hữu (mine, yours, his, hers, ours, theirs)",
        example: "My car is electric. Hers is solar-powered.",
        exampleMeaning: "Xe của tôi chạy bằng điện. Xe của cô ấy chạy bằng năng lượng mặt trời.",
        imageEmoji: "🔑"
      },
      {
        word: "walkcar",
        phonetic: "/ˈwɔːkkɑː/",
        meaning: "thiết bị di chuyển dạng tấm đứng tự hành",
        example: "You stand on a walkcar and drive away.",
        exampleMeaning: "Bạn đứng lên walkcar và bắt đầu di chuyển.",
        imageEmoji: "🛹"
      }
    ],
    sentencePatterns: [
      {
        pattern: "S + will / won't + V-bare...",
        usage: "Thì Tương lai đơn dự đoán sự việc trong tương lai"
      },
      {
        pattern: "Possessive pronouns: mine, yours, his, hers, ours, theirs (= possessive adj + noun)",
        usage: "Đại từ sở hữu dùng để thay thế cho tính từ sở hữu + danh từ nhằm tránh lặp từ"
      }
    ],
    quizzes: [
      {
        question: "Your bicycle is blue and _____ is red.",
        options: [
          "mine",
          "my",
          "me",
          "I"
        ],
        answerIndex: 0,
        explanation: "Dùng đại từ sở hữu 'mine' làm chủ ngữ thay cho 'my bicycle'."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["People", "will", "soon", "travel", "in", "flying", "cars."],
        correctSentence: "People will soon travel in flying cars.",
        vietnameseMeaning: "Con người sẽ sớm đi lại bằng xe ô tô bay."
      }
    ]
  },
  {
    unit: 12,
    book: "Phần 2",
    title: "English-speaking countries",
    emoji: "🌏",
    color: "from-blue-600 to-emerald-600",
    vocabulary: [
      {
        word: "ancient castle",
        phonetic: "/ˈeɪnʃənt ˈkɑːsl/",
        meaning: "lâu đài cổ kính",
        example: "Scotland is famous for its ancient castles.",
        exampleMeaning: "Xót-len nổi tiếng với các lâu đài cổ kính.",
        imageEmoji: "🏰"
      },
      {
        word: "capital",
        phonetic: "/ˈkæpɪtl/",
        meaning: "thủ đô",
        example: "Canberra is the capital of Australia.",
        exampleMeaning: "Canberra là thủ đô của nước Úc.",
        imageEmoji: "🏛️"
      },
      {
        word: "coastline",
        phonetic: "/ˈkəʊstlaɪn/",
        meaning: "đường bờ biển",
        example: "New Zealand has amazing coastlines and beaches.",
        exampleMeaning: "Niu Di-lân có những đường bờ biển và bãi biển tuyệt đẹp.",
        imageEmoji: "🏖️"
      },
      {
        word: "island country",
        phonetic: "/ˈaɪlənd ˈkʌntri/",
        meaning: "đảo quốc / quốc gia đảo",
        example: "New Zealand is an island country in the Pacific Ocean.",
        exampleMeaning: "Niu Di-lân là một đảo quốc ở Thái Bình Dương.",
        imageEmoji: "🏝️"
      },
      {
        word: "kilt",
        phonetic: "/kɪlt/",
        meaning: "váy ca-rô truyền thống của nam giới Xót-len",
        example: "Scottish men wear kilts at traditional festivals.",
        exampleMeaning: "Đàn ông Xót-len mặc váy kilt tại các lễ hội truyền thống.",
        imageEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
      },
      {
        word: "landscape",
        phonetic: "/ˈlændskeɪp/",
        meaning: "phong cảnh",
        example: "Australia has amazing natural landscapes.",
        exampleMeaning: "Nước Úc có những phong cảnh thiên nhiên tuyệt vời.",
        imageEmoji: "🌄"
      },
      {
        word: "native people",
        phonetic: "/ˈneɪtɪv ˈpiːpl/",
        meaning: "người bản địa",
        example: "The Maori are the native people of New Zealand.",
        exampleMeaning: "Người Maori là người bản địa của Niu Di-lân.",
        imageEmoji: "🏹"
      },
      {
        word: "penguin",
        phonetic: "/ˈpeŋɡwɪn/",
        meaning: "chim cánh cụt",
        example: "We went penguin watching on Phillip Island.",
        exampleMeaning: "Chúng tôi đã đi ngắm chim cánh cụt ở đảo Phillip.",
        imageEmoji: "🐧"
      },
      {
        word: "tattoo",
        phonetic: "/tæˈtuː/",
        meaning: "hình xăm",
        example: "The Maori are famous for their unique tattoos.",
        exampleMeaning: "Người Maori nổi tiếng với những hình xăm độc đáo.",
        imageEmoji: "🎨"
      },
      {
        word: "attraction",
        phonetic: "/əˈtrækʃn/",
        meaning: "điểm thu hút khách du lịch",
        example: "Niagara Falls is a famous natural attraction.",
        exampleMeaning: "Thác Niagara là điểm thu hút tự nhiên nổi tiếng.",
        imageEmoji: "🎡"
      }
    ],
    sentencePatterns: [
      {
        pattern: "Articles: a / an / the",
        usage: "Cách sử dụng mạo từ xác định 'the' và mạo từ không xác định 'a / an'"
      },
      {
        pattern: "Expressing amazement: Wow... I didn't know that! / Amazing!",
        usage: "Bày tỏ sự kinh ngạc, thích thú trước một thông tin bất ngờ"
      }
    ],
    quizzes: [
      {
        question: "The Statue of Liberty is a famous landmark in _____ USA.",
        options: [
          "the",
          "a",
          "an",
          "x"
        ],
        answerIndex: 0,
        explanation: "Dùng mạo từ 'the' trước tên quốc gia có chứa chữ 'USA' ('the USA')."
      }
    ],
    sentenceChallenges: [
      {
        scrambledWords: ["Canberra", "is", "the", "capital", "of", "Australia."],
        correctSentence: "Canberra is the capital of Australia.",
        vietnameseMeaning: "Canberra là thủ đô của nước Úc."
      }
    ]
  }
];
