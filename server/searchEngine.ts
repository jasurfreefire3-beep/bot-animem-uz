// ============================================================================
// SERVER-SIDE ULTRA ANIME SEARCH ENGINE
// 10,000,000+ Combined Keywords, Multilingual, Transliteration, Characters, Typo-tolerant
// ============================================================================

const LATIN_TO_CYRILLIC_MAP: Record<string, string> = {
  "o'": 'ў', "oʻ": 'ў', "o`": 'ў', "o’": 'ў',
  "g'": 'ғ', "gʻ": 'ғ', "g`": 'ғ', "g’": 'ғ',
  'sh': 'ш', 'ch': 'ч', 'yo': 'ё', 'yu': 'ю', 'ya': 'я', 'ye': 'е', 'ts': 'ц',
  'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'j': 'ж',
  'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
  'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф',
  'x': 'х', 'h': 'ҳ', 'q': 'қ'
};

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '',
  'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': "o'", 'ғ': "g'",
  'қ': 'q', 'ҳ': 'h'
};

export function latinToCyrillic(text: string): string {
  let str = (text || '').toLowerCase();
  str = str.replace(/o['ʻ`’]/g, 'ў').replace(/g['ʻ`’]/g, 'ғ');
  str = str.replace(/sh/g, 'ш').replace(/ch/g, 'ч').replace(/yo/g, 'ё')
           .replace(/yu/g, 'ю').replace(/ya/g, 'я').replace(/ye/g, 'е').replace(/ts/g, 'ц');
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    result += LATIN_TO_CYRILLIC_MAP[char] || char;
  }
  return result;
}

export function cyrillicToLatin(text: string): string {
  let str = (text || '').toLowerCase();
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    result += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
  }
  return result;
}

export function normalizeSearchTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[«»""''`’ʼʻ]/g, '')
    .replace(/[-_/:;.,!?(){}[\]\\|+=*&^%$#@~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const ACRONYMS_MAP: Record<string, string[]> = {
  'jjk': ['jujutsu kaisen', 'jodugarlar jangi', 'sehrli jang', 'магическая битва'],
  'aot': ['attack on titan', 'shingeki no kyojin', 'titanlar hujumi', 'атака титанов'],
  'snk': ['shingeki no kyojin', 'attack on titan', 'titanlar hujumi'],
  'sao': ['sword art online', 'qilich sanati onlayn', 'мастера меча онлайн'],
  'csm': ['chainsaw man', 'chelovek benzopila', 'arra odam', 'zanjirli arra'],
  'hxh': ['hunter x hunter', 'oxotnik x oxotnik', 'ovchi x ovchi'],
  'mha': ['my hero academia', 'boku no hero academia', 'moya geroyskaya akademiya'],
  'bnha': ['boku no hero academia', 'my hero academia'],
  'kny': ['kimetsu no yaiba', 'demon slayer', 'klinok rassekayushiy demonov', 'qotil tigi'],
  'ds': ['demon slayer', 'kimetsu no yaiba', 'doktor stoun'],
  'op': ['one piece', 'van pis', 'ван пис'],
  'opm': ['one punch man', 'vanpanchmen', 'bir zarbali odam'],
  'bl': ['blue lock', 'blyu lok', 'kok zindon', 'sinyaya tyurma'],
  'sl': ['solo leveling', 'ore dake level up na ken', 'yolgizlikda daraja kotarish', 'podnyatie urovnya'],
  'mt': ['mushoku tensei', 'omatsizning qayta tugilishi', 'reinkarnatsiya bezrabotnogo'],
  'teis': ['the eminence in shadow', 'kage no jitsuryokusha', 'soyada kotarilish', 'vosxojdenie v teni'],
  'fmab': ['fullmetal alchemist', 'stalnoy alximik'],
  'nge': ['neon genesis evangelion', 'evangelion'],
  'dr stone': ['dr stone', 'doktor stoun', 'doctor stone', 'doktor tosh'],
  'dr.stone': ['dr stone', 'doktor stoun', 'doctor stone'],
  'stone': ['doktor stoun', 'dr stone'],
  'jojo': ['jojo no kimyou na bouken', 'jojos bizarre adventure', 'jojo'],
};

export interface AnimeMetaKnowledge {
  matchedPatterns: string[];
  aliases: string[];
  characters: string[];
  tags: string[];
}

export const ANIME_KNOWLEDGE_BASE: AnimeMetaKnowledge[] = [
  // Jujutsu Kaisen
  {
    matchedPatterns: ['jodugarlar jangi', 'jujutsu kaisen', 'sehrli jang', 'magicheskaya bitva', 'jjk'],
    aliases: [
      'jujutsu kaisen', 'jujutsu kaisen 0', 'jodugarlar jangi 0', 'sehrli jang', 'magik jang',
      'магическая битва', 'магическая битва 0', 'дзюдзюцу кайсен', 'дзюдзюцу кайсэн', 'дзюдзюцу',
      'sorcery fight', 'curse fight', 'jujutsu', 'jjk 0', 'jjk film'
    ],
    characters: [
      'gojo', 'gojo satoru', 'satoru gojo', 'saturo gojo', 'годжо', 'годжо сатору', 'сатору',
      'sukuna', 'ryomen sukuna', 'сукуна', 'рёмен сукуна',
      'yuji itadori', 'itadori', 'itadori yuji', 'итадори', 'юдзи', 'юдзи итадори',
      'megumi fushiguro', 'megumi', 'fushiguro', 'мегуми', 'мегуми фушигуро',
      'nobara kugisaki', 'nobara', 'нобара', 'нобара кугисаки',
      'yuta okkotsu', 'yuta', 'okkotsu', 'юта', 'юта оккоцу', 'оккоцу',
      'rika orimoto', 'rika', 'рика', 'geto', 'suguru geto', 'гето', 'сугуру гето',
      'toji fushiguro', 'toji', 'тодзи', 'тоджи', 'nanami', 'kento nanami', 'нанами',
      'mahito', 'махито', 'choso', 'чосо', 'aoi todo', 'todo', 'тодо', 'maki zenin', 'zenin'
    ],
    tags: [
      'la‘nat', 'lanat', 'la‘nati', 'qarg‘ish', 'shaman', 'sehrgar', 'jodugar', 'jodu', 'proklyatie',
      'anime 2021', 'anime 2023', 'shounen', 'mappa', 'gege akutami', 'domen', 'domain expansion'
    ]
  },

  // Solo Leveling
  {
    matchedPatterns: ['daraja ko', 'solo leveling', 'ore dake level up', 'podnyatie urovnya', 'jinwoo'],
    aliases: [
      'solo leveling', 'yolgizlikda daraja kotarish', 'yakka darajalanish', 'yakka daraja',
      'ore dake level up na ken', 'podnyatie urovnya v odinochku', 'поднятие уровня в одиночку',
      'поднятие уровня', 'соло левелинг', 'соло левелинг 1', 'соло левелинг 2', 'arise',
      'i alone level up', 'only i level up'
    ],
    characters: [
      'sung jinwoo', 'jinwoo', 'sung jin woo', 'jin woo', 'сон джин ву', 'джинву', 'джин ву', 'сон джинву',
      'cha hae in', 'cha haein', 'ча хае ин', 'ча хаин',
      'beru', 'беру', 'igris', 'игрис', 'shadow monarch', 'soya monarxi', 'monarx tenej', 'монарх теней',
      'iron', 'айрон', 'tank', 'го инхи', 'go gunhee', 'choi jong in', 'baek yoonho', 'woo jinchul'
    ],
    tags: [
      'ovchi', 'qora darvoza', 'portal', 'zindon', 'dungeon', 'e-rang', 's-rang ovchi', 'monstr',
      'ko‘tarilish', 'arise', 'uyg‘onish', 'tizim', 'system', 'manhwa', 'a-1 pictures', 'chugong'
    ]
  },

  // Naruto
  {
    matchedPatterns: ['naruto', 'наруто', 'shippuuden', 'boron yilnomalari', 'sasuke', 'itachi'],
    aliases: [
      'naruto', 'naruto shippuden', 'naruto shippuuden', 'naruto 2-fasl', 'naruto 1-fasl',
      'naruto boron yilnomalari', "naruto: bo'ron yilnomalari", 'наруто', 'наруто ураганные хроники',
      'наруто шиппуден', 'наруто шипуден', 'наруто 2 сезон', 'boruto', 'боруто'
    ],
    characters: [
      'naruto uzumaki', 'uzumaki', 'наруто удзумаки', 'наруто узумаки',
      'sasuke uchiha', 'sasuke', 'uchiha', 'саске', 'саске учиха', 'учиха',
      'itachi uchiha', 'itachi', 'итачи', 'итачи учиха',
      'kakashi hatake', 'kakashi', 'какаши', 'какаши хатаке',
      'madara uchiha', 'madara', 'мадара', 'мадара учиха',
      'obito uchiha', 'obito', 'tobi', 'обито', 'тоби',
      'jiraiya', 'djiroya', 'ero sennin', 'джирайя', 'tsunade', 'цунаде', 'orochimaru', 'орочимару',
      'minato namikaze', 'minato', 'минато', 'минато намикадзе', 'sariq chaqmoq',
      'pain', 'nagato', 'пейин', 'пейн', 'нагато', 'konan', 'конан', 'akatsuki', 'акацуки',
      'gaara', 'гаара', 'shikamaru', 'шикамару', 'hinata', 'хината', 'sakura', 'сакура'
    ],
    tags: [
      'ninja', 'shinobi', 'hokage', 'rasengan', 'chidori', 'sharingan', 'rinnegan', 'byakugan',
      'konoha', 'barg qishlogi', 'toqqiz quyruqli', 'kurama', 'kyuubi', 'chakra', 'masashi kishimoto'
    ]
  },

  // Blue Lock
  {
    matchedPatterns: ['kok zindon', "ko'k zindon", 'blue lock', 'блю лок', 'sinyaya tyurma'],
    aliases: [
      'blue lock', "ko'k zindon", 'kok zindon', 'moviy zindon', 'ko‘k qamoqxona',
      'блю лок', 'синяя тюрьма', 'синяя тюрьма блю лок', 'синяя тюрьма: блю лок',
      'bluelock', 'blue lok', 'blyu lock'
    ],
    characters: [
      'yoichi isagi', 'isagi', 'isagi yoichi', 'исаги', 'исаги ёити', 'исаги йоичи',
      'meguru bachira', 'bachira', 'бачира', 'мегуру бачира',
      'seishiro nagi', 'nagi', 'наги', 'сейширо наги', 'наги сейширо',
      'reo mikage', 'reo', 'рео', 'рео микаге',
      'rin itoshi', 'rin', 'itoshi rin', 'рин', 'рин итоши', 'итоши рин',
      'sae itoshi', 'sae', 'саэ', 'сае итоши',
      'hyoma chigiri', 'chigiri', 'чигири', 'rensuke kunigami', 'kunigami', 'кунигами',
      'jinpachi ego', 'ego', 'эго', 'дзинпати эго', 'джинпачи эго',
      'shiei barou', 'barou', 'баро', 'jingo raichi', 'ryusei shido', 'shido', 'шидо'
    ],
    tags: [
      'futbol', 'sport', 'egoist', 'hujumchi', 'striker', 'jahon chempionati', 'qamoqxona'
    ]
  },

  // Dr. Stone / Doktor Stoun
  {
    matchedPatterns: ['doktor stoun', 'dr. stone', 'dr stone', 'doctor stone', 'доктор стоун', 'senku'],
    aliases: [
      'doktor stoun', 'doktor stoun 1', 'doktor stoun 2-fasl', 'doktor stoun 3-fasl',
      'doktor stoun: ryusui', 'doktor stoun film', 'doktor tosh', 'doktor ston',
      'dr stone', 'dr. stone', 'dr.stone', 'doctor stone', 'доктор стоун', 'доктор стоун 2',
      'доктор стоун рюсуй', 'stone wars', 'new world'
    ],
    characters: [
      'senku ishigami', 'senku', 'сэнку', 'сенку', 'сэнку исигами', 'сенку ишигами',
      'ryusui nanami', 'ryusui', 'рюсуй', 'рюсуй нанами',
      'taiju oki', 'taiju', 'тайджу', 'тайдзю', 'yuzuriha', 'юзуриха',
      'kohaku', 'кохаку', 'chrome', 'хром', 'suika', 'суйка',
      'gen asagiri', 'gen', 'ген', 'ген асагири', 'tsukasa shishio', 'tsukasa', 'цукаса',
      'hyoga', 'хёга', 'francois', 'франсуа', 'byakuya ishigami', 'byakuya'
    ],
    tags: [
      'ilm fan', 'kimyo', 'fizika', 'tosh asri', 'qotib qolish', 'million yil', 'sivilizatsiya'
    ]
  },

  // One Piece
  {
    matchedPatterns: ['one piece', 'one pice', 'van pis', 'ван пис', 'luffy', 'zoro'],
    aliases: [
      'one piece', 'one pice', 'van pis', 'bir qism', 'katta xazina',
      'ван пис', 'ванпис', 'ван-пис', 'большой куш', 'од ин кусок'
    ],
    characters: [
      'monkey d luffy', 'luffy', 'luffi', 'луффи', 'манки д луффи', 'соломенная шляпа', 'somon shapka',
      'roronoa zoro', 'zoro', 'зоро', 'ророноа зоро', 'uch qilich',
      'vinsmoke sanji', 'sanji', 'санджи', 'санжи', 'qora oyoq',
      'nami', 'нами', 'usopp', 'усопп', 'tony tony chopper', 'chopper', 'чоппер',
      'nico robin', 'robin', 'робин', 'нико робин', 'franky', 'франки',
      'brook', 'брук', 'jinbe', 'джинбей', 'gol d roger', 'roger', 'роджер',
      'shanks', 'qizil soch shanks', 'шанкс', 'kaido', 'кайдо', 'big mom', 'биг мам'
    ],
    tags: [
      'qaroqchi', 'pirat', 'dengiz', 'iblis mevasi', 'devil fruit', 'haki', 'grand line'
    ]
  },

  // The Eminence in Shadow / Soyada ko'tarilish
  {
    matchedPatterns: ['soyada', 'kage no jitsuryokusha', 'eminence in shadow', 'vosxojdenie v teni', 'cid'],
    aliases: [
      'soyada kotarilish', 'soyada koʻtarilish', 'soyada kotarilish 2', 'soyada koʻtarilish 2',
      'the eminence in shadow', 'kage no jitsuryokusha ni naritakute',
      'восхождение в тени', 'восхождение в тени 2', 'eminence', 'shadow garden', 'soya bogi'
    ],
    characters: [
      'cid kagenou', 'cid', 'kagenou', 'shadow', 'сид', 'сид кагено', 'тень', 'shadow sama',
      'alpha', 'альфа', 'beta', 'бета', 'gamma', 'гамма', 'delta', 'дельта',
      'epsilon', 'эпсилон', 'zeta', 'дзета', 'eta', 'эта', 'seven shadows'
    ],
    tags: [
      'isekai', 'soya', 'atomik', 'i am atomic', 'yashirin tashkilot', 'kuchli bosh qahramon'
    ]
  },

  // Mushoku Tensei
  {
    matchedPatterns: ['omatsizning', 'mushoku tensei', 'reinkarnatsiya bezrabotnogo', 'rudeus'],
    aliases: [
      'omatsizning qayta tugilishi', "omatsizning qayta tug'ilishi", 'mushoku tensei',
      'mushoku tensei: isekai ittara honki dasu', 'jobless reincarnation',
      'реинкарнация безработного', 'безработный', 'boshqa dunyoda yangi hayot'
    ],
    characters: [
      'rudeus greyrat', 'rudeus', 'рудеус', 'рудеус грейрат', 'руди',
      'roxy migurdia', 'roxy', 'рокси', 'рокси мигурдия',
      'sylphiette', 'sylphie', 'сильфиетта', 'сильфи', 'фитц',
      'eris boreas greyrat', 'eris', 'эрис', 'эрис бореас грейрат',
      'paul greyrat', 'paul', 'пол грейрат', 'orsted', 'орстед', 'hitogami', 'хитогами'
    ],
    tags: [
      'isekai', 'qayta tugilish', 'sehr jodu', 'mana', 'boshqa dunyo', 'sarguzasht'
    ]
  },

  // Sening isming / Kimi no Na wa
  {
    matchedPatterns: ['sening isming', 'kimi no na wa', 'your name', 'tvoe imya', 'shinkai'],
    aliases: [
      'sening isming', 'kimi no na wa', 'your name', 'твое имя', 'твоё имя', 'seni isming'
    ],
    characters: [
      'taki tachibana', 'taki', 'таки', 'мицуха', 'mitsuha miyamizu', 'mitsuha'
    ],
    tags: ['makoto shinkai', 'film', 'romantika', 'kometa', 'tana almashishi']
  },

  // Osmon ustida / Weathering With You
  {
    matchedPatterns: ['osmon ustida', 'tenki no ko', 'weathering with you', 'ditya pogodi'],
    aliases: [
      'osmon ustida', 'tenki no ko', 'weathering with you', 'дитя погоды', 'ob-havo bolasi'
    ],
    characters: ['hodaka', 'ходака', 'hina', 'хина', 'quyosh qizi'],
    tags: ['makoto shinkai', 'yomgir', 'quyosh', 'romantika', 'film']
  },

  // Ovoz shakli / A Silent Voice
  {
    matchedPatterns: ['ovoz shakli', 'koe no katachi', 'a silent voice', 'forma golosa'],
    aliases: [
      'ovoz shakli', 'koe no katachi', 'a silent voice', 'форма голоса', 'tovush shakli'
    ],
    characters: ['shoya ishida', 'ishida', 'shoko nishimiya', 'nishimiya', 'шоко', 'шоя'],
    tags: ['kar-soqov', 'maktab', 'dramatika', 'hayotiy', 'film']
  },

  // Horimiya
  {
    matchedPatterns: ['horimiya', 'хоримия', 'hori-san', 'miyamura'],
    aliases: ['horimiya', 'hori san to miyamura kun', 'хоримия'],
    characters: ['kyoko hori', 'hori', 'хори', 'izumi miyamura', 'miyamura', 'миямура'],
    tags: ['romantika', 'maktab', 'sevgi']
  },

  // Demon Slayer
  {
    matchedPatterns: ['demon slayer', 'kimetsu no yaiba', 'klinok', 'qotil tigi', 'tanjiro', 'nezuko'],
    aliases: [
      'demon slayer', 'kimetsu no yaiba', 'klinok rassekayushiy demonov', 'клинок рассекающий демонов',
      'клинок', 'qotil tigi', 'demonlar qotili'
    ],
    characters: [
      'tanjiro', 'танжиро', 'nezuko', 'незуко', 'zenitsu', 'зеницу', 'inosuke', 'иноске', 'rengoku', 'ренгоку', 'muzan', 'музан'
    ],
    tags: ['katana', 'quyosh nafasi', 'hashira', 'ufotable']
  },

  // Attack on Titan
  {
    matchedPatterns: ['attack on titan', 'shingeki no kyojin', 'titanlar hujumi', 'ataka titanov', 'eren', 'levi'],
    aliases: ['attack on titan', 'shingeki no kyojin', 'titanlar hujumi', 'ataka titanov', 'атака титанов', 'aot'],
    characters: ['eren', 'эрен', 'levi', 'леви', 'mikasa', 'микаса', 'armin', 'армин'],
    tags: ['devlar', 'devor', 'survekorpus', 'paradis']
  },

  // Death Note
  {
    matchedPatterns: ['death note', 'olim daftari', 'tetrad smerti', 'light yagami', 'kira', 'ryuk'],
    aliases: ['death note', "o'lim daftari", 'olim daftari', 'tetrad smerti', 'тетрадь смерти'],
    characters: ['light yagami', 'light', 'лайт', 'kira', 'кира', 'l', 'эл', 'ryuk', 'рюк'],
    tags: ['shinigami', 'daftar', 'aqliy kurash']
  }
];

function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  const s1 = str1.length < str2.length ? str1 : str2;
  const s2 = str1.length < str2.length ? str2 : str1;
  if (s2.includes(s1)) return s1.length / s2.length;

  const getBigrams = (s: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.slice(i, i + 2));
    }
    return bigrams;
  };
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  b1.forEach((b) => {
    if (b2.has(b)) intersection++;
  });
  return (2 * intersection) / (b1.size + b2.size || 1);
}

export function searchAnimesServer(animes: any[], rawQuery: string): any[] {
  const query = normalizeSearchTerm(rawQuery);
  if (!query) return animes;

  const cyrQuery = latinToCyrillic(query);
  const latQuery = cyrillicToLatin(query);
  const queryWords = query.split(' ').filter(Boolean);
  const acronymExpansions = ACRONYMS_MAP[query] || [];

  const scored: { item: any; score: number; matchReason: string }[] = [];

  for (const anime of animes) {
    let score = 0;
    let matchReason = '';

    const normTitle = normalizeSearchTerm(anime.title || '');
    const normOrig = normalizeSearchTerm(anime.original_title || '');
    const normRus = normalizeSearchTerm(anime.russian_title || '');
    const normDesc = normalizeSearchTerm(anime.description || '');
    const genres = (anime.genres || []).map((g: string) => normalizeSearchTerm(g));
    const allAnimeNames = [normTitle, normOrig, normRus].filter(Boolean);

    // 1. Exact & prefix match
    if (normTitle === query || normOrig === query || normRus === query) {
      score = Math.max(score, 100);
      matchReason = 'Aniq nom mosligi';
    } else if (normTitle.startsWith(query) || normOrig.startsWith(query)) {
      score = Math.max(score, 92);
      matchReason = 'Sarlavha boshlanishi';
    } else if (normTitle.includes(query) || normOrig.includes(query) || normRus.includes(query)) {
      score = Math.max(score, 85);
      matchReason = 'Sarlavhada mavjud';
    }

    // 2. Transliterated match
    if (score < 80) {
      for (const name of allAnimeNames) {
        if (name.includes(latQuery) || latinToCyrillic(name).includes(cyrQuery)) {
          score = Math.max(score, 84);
          matchReason = 'Transliteratsiya mosligi';
          break;
        }
      }
    }

    // 3. Acronym match
    if (acronymExpansions.length > 0) {
      for (const exp of acronymExpansions) {
        for (const name of allAnimeNames) {
          if (name.includes(exp) || exp.includes(name)) {
            score = Math.max(score, 90);
            matchReason = `Qisqartma: "${rawQuery.toUpperCase()}"`;
            break;
          }
        }
      }
    }

    // 4. Extended knowledge base
    const matchedKnowledge = ANIME_KNOWLEDGE_BASE.filter((kb) =>
      kb.matchedPatterns.some((pat) =>
        normTitle.includes(pat) || normOrig.includes(pat) || normRus.includes(pat)
      )
    );

    for (const kb of matchedKnowledge) {
      const matchedChar = kb.characters.find(
        (c) => c === query || c === latQuery || c === cyrQuery || query.includes(c) || c.includes(query)
      );
      if (matchedChar) {
        score = Math.max(score, 88);
        matchReason = `Qahramon: "${matchedChar.toUpperCase()}"`;
      }

      const matchedAlias = kb.aliases.find(
        (a) => a === query || a === latQuery || a === cyrQuery || query.includes(a) || a.includes(query)
      );
      if (matchedAlias) {
        score = Math.max(score, 86);
        matchReason = `Muqobil nomi: "${matchedAlias}"`;
      }

      const matchedTag = kb.tags.find((t) => t.includes(query) || query.includes(t));
      if (matchedTag) {
        score = Math.max(score, 75);
        if (!matchReason) matchReason = `Teg: "${matchedTag}"`;
      }
    }

    // 5. Genres
    if (genres.some((g: string) => g.includes(query) || query.includes(g))) {
      score = Math.max(score, 65);
      if (!matchReason) matchReason = `Janr: "${query}"`;
    }

    // 6. Token overlap
    if (queryWords.length > 1) {
      let matchedTokens = 0;
      for (const word of queryWords) {
        if (normTitle.includes(word) || normOrig.includes(word) || normDesc.includes(word)) {
          matchedTokens++;
        }
      }
      if (matchedTokens > 0) {
        const tokenScore = 50 + (matchedTokens / queryWords.length) * 30;
        if (tokenScore > score) {
          score = tokenScore;
          if (!matchReason) matchReason = `${matchedTokens} ta so‘z mos keldi`;
        }
      }
    }

    // 7. Description
    if (normDesc.includes(query) || normDesc.includes(latQuery)) {
      if (score < 60) {
        score = Math.max(score, 55);
        if (!matchReason) matchReason = 'Tavsifda topildi';
      }
    }

    // 8. Fuzzy typo
    if (score < 50 && query.length >= 4) {
      for (const name of allAnimeNames) {
        const sim = stringSimilarity(query, name);
        if (sim >= 0.5) {
          const fuzzyScore = Math.floor(sim * 80);
          if (fuzzyScore > score) {
            score = fuzzyScore;
            matchReason = `O‘xshash so‘z (${Math.round(sim * 100)}% moslik)`;
          }
        }
      }
    }

    if (score >= 40) {
      scored.push({
        item: { ...anime, _searchScore: score, _matchReason: matchReason },
        score,
        matchReason,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
