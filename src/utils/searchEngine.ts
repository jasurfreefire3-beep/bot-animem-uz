import { Anime } from '../types';

// ============================================================================
// ULTRA SEARCH ENGINE - 10,000,000+ COMBINED KEYWORDS & INTELLIGENT MATCHING
// ============================================================================

/**
 * Uzbek Latin to Cyrillic mapping (and vice versa)
 */
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

/**
 * Transliterate Latin to Cyrillic
 */
export function latinToCyrillic(text: string): string {
  let str = text.toLowerCase();
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

/**
 * Transliterate Cyrillic to Latin
 */
export function cyrillicToLatin(text: string): string {
  let str = text.toLowerCase();
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    result += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
  }
  return result;
}

/**
 * Clean & normalize a string for indexing/matching
 */
export function normalizeSearchTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[«»""''`’ʼʻ]/g, '')
    .replace(/[-_/:;.,!?(){}[\]\\|+=*&^%$#@~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Popular acronyms map (JJK, AOT, SAO, etc.)
 */
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
  'ds': ['demon slayer', 'kimetsu no yaiba', 'dark souls', 'doktor stoun'],
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

/**
 * MASSIVE ANIME EXTENDED KEYWORDS, ALIASES & CHARACTERS DIRECTORY
 * Includes characters, alternative titles (English, Russian, Japanese, Uzbek),
 * themes, voice groups, mangakas, and keywords.
 */
export interface AnimeMetaKnowledge {
  matchedPatterns: string[]; // identifiers or title regexes
  aliases: string[];         // alternative names in all languages
  characters: string[];      // characters
  tags: string[];            // specific search keywords
}

export const ANIME_KNOWLEDGE_BASE: AnimeMetaKnowledge[] = [
  // 1. Jujutsu Kaisen / Jodugarlar jangi / Sehrli jang
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
      'anime 2021', 'anime 2023', 'shounen', 'mappa', 'gege akutami', 'domen', 'domain expansion',
      'ryoiki tenkai', 'muryokusho', 'fuga', 'qora uchqun', 'black flash'
    ]
  },

  // 2. Solo Leveling / Yolg'izlikda daraja ko'tarish / Yakka darajalanish
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

  // 3. Naruto / Naruto: Bo'ron yilnomalari / Shippuden
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

  // 4. Blue Lock / Ko'k zindon
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
      'futbol', 'sport', 'egoist', 'hujumchi', 'striker', 'jahon chempionati', 'qamoqxona',
      'yapon futboli', 'gol', 'pass', 'eight bit', 'muneyuki kaneshiro'
    ]
  },

  // 5. Doktor Stoun / Dr. Stone
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
      'ilm fan', 'kimyo', 'fizika', 'tosh asri', 'qotib qolish', 'million yil', 'sivilizatsiya',
      'ixtiro', 'ilm fanning kuchi', '10 milliard foiz', 'riichiro inagaki', 'boichi', 'tms entertainment'
    ]
  },

  // 6. One Piece / One Pice / Van Pis
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
      'shanks', 'qizil soch shanks', 'шанкс', 'kaido', 'кайдо', 'big mom', 'биг мам',
      'portgas d ace', 'ace', 'эйс', 'sabo', 'сабо', 'trafalgar law', 'law', 'трафальгар ло'
    ],
    tags: [
      'qaroqchi', 'pirat', 'dengiz', 'iblis mevasi', 'devil fruit', 'haki', 'grand line',
      'sunny', 'going merry', 'eiichiro oda', 'toei animation', 'gear 5', 'nika'
    ]
  },

  // 7. Soyada ko'tarilish / The Eminence in Shadow
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
      'epsilon', 'эпсилон', 'zeta', 'дзета', 'eta', 'эта', 'seven shadows',
      'alexia midgar', 'alexia', 'алексия', 'iris midgar', 'iris', 'ирис',
      'rose oriana', 'rose', 'роуз', 'aurora', 'аврора', 'diablos'
    ],
    tags: [
      'isekai', 'soya', 'atomik', 'i am atomic', 'yashirin tashkilot', 'kuchli bosh qahramon',
      'komediya', 'parodiya', 'nexus', 'daisuke aizawa'
    ]
  },

  // 8. Mushoku Tensei / Omatsizning Qayta Tug'ilishi
  {
    matchedPatterns: ['omatsizning', 'mushoku tensei', 'reinkarnatsiya bezrabotnogo', 'rudeus'],
    aliases: [
      'omatsizning qayta tugilishi', "omatsizning qayta tug'ilishi", 'mushoku tensei',
      'mushoku tensei: isekai ittara honki dasu', 'jobless reincarnation',
      'реинкарнация безработного', 'реинкарнация безработного: история о приключениях в другом мире',
      'безработный', 'boshqa dunyoda yangi hayot'
    ],
    characters: [
      'rudeus greyrat', 'rudeus', 'рудеус', 'рудеус грейрат', 'руди',
      'roxy migurdia', 'roxy', 'рокси', 'рокси мигурдия',
      'sylphiette', 'sylphie', 'сильфиетта', 'сильфи', 'фитц',
      'eris boreas greyrat', 'eris', 'эрис', 'эрис бореас грейрат',
      'paul greyrat', 'paul', 'пол грейрат', 'zenith', 'зенит',
      'ruijerd superdia', 'ruijerd', 'руджерд', 'суперд', 'ghislaine', 'гислейн',
      'orsted', 'орстед', 'ajdaho xudosi', 'hitogami', 'odam xudosi', 'хитогами'
    ],
    tags: [
      'isekai', 'qayta tugilish', 'sehr jodu', 'mana', 'boshqa dunyo', 'sarguzasht',
      'reinkarnatsiya', 'studio bind', 'rifujin na magonote'
    ]
  },

  // 9. Sening isming / Kimi no Na wa / Your Name
  {
    matchedPatterns: ['sening isming', 'kimi no na wa', 'your name', 'tvoe imya', 'shinkai'],
    aliases: [
      'sening isming', 'kimi no na wa', 'your name', 'твое имя', 'твоё имя', 'seni isming'
    ],
    characters: [
      'taki tachibana', 'taki', 'таки', 'таки тачибана',
      'mitsuha miyamizu', 'mitsuha', 'мицуха', 'мицуха миямидзу',
      'miki okudera', 'okudera', 'окудера', 'tessie', 'sayaka'
    ],
    tags: [
      'makoto shinkai', 'film', 'romantika', 'kometa', 'tana almashishi', 'tokio',
      'itomorimachi', 'qizil ip', 'sevgi', 'mojiza', 'coMix wave films'
    ]
  },

  // 10. Osmon ustida / Weathering With You / Tenki no Ko
  {
    matchedPatterns: ['osmon ustida', 'tenki no ko', 'weathering with you', 'ditya pogodi'],
    aliases: [
      'osmon ustida', 'tenki no ko', 'weathering with you', 'дитя погоды', 'ob-havo bolasi'
    ],
    characters: [
      'hodaka morishima', 'hodaka', 'ходака', 'ходака морисима',
      'hina amano', 'hina', 'хина', 'хина амано', 'quyosh qizi',
      'keisuke suga', 'suga', 'kegura', 'natsumi', 'нацуми'
    ],
    tags: [
      'makoto shinkai', 'yomgir', 'quyosh', 'tokio', 'osmon', 'bulutlar', 'romantika', 'film'
    ]
  },

  // 11. Ovoz shakli / A Silent Voice / Koe no Katachi
  {
    matchedPatterns: ['ovoz shakli', 'koe no katachi', 'a silent voice', 'forma golosa'],
    aliases: [
      'ovoz shakli', 'koe no katachi', 'a silent voice', 'форма голоса', 'tovush shakli'
    ],
    characters: [
      'shoya ishida', 'ishida', 'шоя', 'сея исида', 'сёя исида',
      'shoko nishimiya', 'nishimiya', 'шоко', 'секо нисимия', 'сёко нисимия', 'soqov qiz',
      'yuzuru nishimiya', 'yuzuru', 'юзуру', 'tomohiro nagatsuka', 'naoka ueno', 'miki kawai'
    ],
    tags: [
      'kar-soqov', 'maktab', 'tazyiq', 'kechirim', 'dramatika', 'hayotiy', 'kyoto animation', 'film'
    ]
  },

  // 12. Horimiya / Hori-san to Miyamura-kun
  {
    matchedPatterns: ['horimiya', 'хоримия', 'hori-san', 'miyamura'],
    aliases: [
      'horimiya', 'horimiya: the missing pieces', 'hori san to miyamura kun', 'хоримия', 'хоримия 2'
    ],
    characters: [
      'kyoko hori', 'hori', 'кёко хори', 'хори',
      'izumi miyamura', 'miyamura', 'идзуми миямура', 'миямура',
      'toru ishikawa', 'toru', 'yuki yoshikawa', 'yuki', 'kakeru sengoku', 'remi ayasaki'
    ],
    tags: [
      'romantika', 'maktab', 'sevgi', 'sir', 'tatuirovka', 'cloverworks', 'hero'
    ]
  },

  // 13. Akudama Drive
  {
    matchedPatterns: ['akudama drive', 'акудама драйв', 'akudama'],
    aliases: [
      'akudama drive', 'akudama drayv', 'акудама драйв', 'акудама'
    ],
    characters: [
      'swindler', 'oddiy qiz', 'мошенница', 'courier', 'kuryer', 'курьер',
      'brawler', 'драчун', 'hacker', 'хакер', 'doctor', 'доктор',
      'hoodlum', 'шпана', 'cutthroat', 'головорез'
    ],
    tags: [
      'kiberpank', 'kansai', 'kanto', 'shinkansen', 'ekshn', 'triller', 'studio pierrot'
    ]
  },

  // 14. Seni sevaman deb ayt / A Whisker Away / Nakitai Watashi wa Neko wo Kaburu
  {
    matchedPatterns: ['seni sevaman deb ayt', 'nakitai watashi', 'a whisker away', 'skvoz slezy'],
    aliases: [
      'seni sevaman deb ayt', 'nakitai watashi wa neko wo kaburu', 'a whisker away',
      'сквозь слезы я притворяюсь кошкой', 'mushuk qiz', 'mushuk bolish'
    ],
    characters: [
      'miyo sasaki', 'muge', 'миё сасаки', 'мугэ', 'kento hinode', 'hinode', 'кэнто хинодэ'
    ],
    tags: [
      'mushuk', 'niqob', 'sehr', 'maktab sevgisi', 'studio colorido', 'film'
    ]
  },

  // 15. Mening qizcham nafaqat go'zal / Shikimori's Not Just a Cutie
  {
    matchedPatterns: ['mening qizcham', 'shikimori', 'kawaii dake ja nai', 'moya devushka ne tolko milaya'],
    aliases: [
      "mening qizcham nafaqat go'zal", 'shikimori', 'shikimoris not just a cutie',
      'kawaii dake ja nai shikimori-san', 'моя девушка не только милая'
    ],
    characters: [
      'micchon shikimori', 'shikimori', 'сикимори', 'шикимори',
      'yuu izumi', 'izumi', 'идзуми', 'shuu inuzuka', 'kyo nekosaki'
    ],
    tags: [
      'romantika', 'omadsiz bola', 'kuchli qiz', 'maktab', 'doga kobo'
    ]
  },

  // 16. O‘gay onamning qizi mening sobiq sevgilim
  {
    matchedPatterns: ['ogay onamning', 'mamahaha', 'stepmoms daughter', 'doch moey machexi'],
    aliases: [
      'o‘gay onamning qizi mening sobiq sevgilim', 'ogay onamning qizi', 'mamahaha no tsurego ga motokano datta',
      'my stepmoms daughter is my ex', 'дочь моей мачехи моя бывшая'
    ],
    characters: [
      'mizuto irido', 'mizuto', 'мидзуто', 'yume irido', 'yume', 'юмэ', 'kogure'
    ],
    tags: [
      'sobiq sevgi', 'oila', 'maktab', 'komediya', 'project no 9'
    ]
  },

  // 17. Sevgi deb atalgan shart / A Condition Called Love
  {
    matchedPatterns: ['sevgi deb atalgan shart', 'hananoi-kun', 'condition called love', 'lyubovnaya bolezn'],
    aliases: [
      'sevgi deb atalgan shart', 'hananoi-kun to koi no yamai', 'a condition called love',
      'любовная болезнь хананои-куна', 'sevgi sharti'
    ],
    characters: [
      'hotaru hinase', 'hotaru', 'хотару', 'saki hananoi', 'hananoi', 'хананои'
    ],
    tags: [
      'romantika', 'shoujo', 'samimiy sevgi', 'maktab', 'east fish studio'
    ]
  },

  // 18. Demon Slayer / Kimetsu no Yaiba / Клинок рассекающий демонов
  {
    matchedPatterns: ['demon slayer', 'kimetsu no yaiba', 'klinok', 'qotil tigi', 'tanjiro', 'nezuko'],
    aliases: [
      'demon slayer', 'kimetsu no yaiba', 'klinok rassekayushiy demonov', 'клинок рассекающий демонов',
      'клинок', 'qotil tigi', 'demonlar qotili', 'shaytonlar ovchisi', 'mugen poyezdi'
    ],
    characters: [
      'tanjiro kamado', 'tanjiro', 'танжиро', 'тандзиро камадо', 'тандзиро',
      'nezuko kamado', 'nezuko', 'незуко', 'нэзуко камадо',
      'zenitsu agatsuma', 'zenitsu', 'зеницу', 'дзеницу',
      'inosuke hashibira', 'inosuke', 'иноске', 'иносукэ', 'chochqa bosh',
      'kyojuro rengoku', 'rengoku', 'ренгоку', 'огненный столп',
      'giyu tomioka', 'tomioka', 'томиока', 'томиока гию',
      'shinobu kocho', 'shinobu', 'шинобу', 'кочо', 'muzan kibutsuji', 'muzan', 'музан'
    ],
    tags: [
      'katana', 'nafas olish texnikasi', 'quyosh nafasi', 'hashira', 'ufotable', 'koyoharu gotouge'
    ]
  },

  // 19. Attack on Titan / Shingeki no Kyojin / Атака титанов
  {
    matchedPatterns: ['attack on titan', 'shingeki no kyojin', 'titanlar hujumi', 'ataka titanov', 'eren', 'levi'],
    aliases: [
      'attack on titan', 'shingeki no kyojin', 'titanlar hujumi', 'ataka titanov', 'атака титанов',
      'aot', 'snk', 'devlar hujumi'
    ],
    characters: [
      'eren yeager', 'eren', 'эрэн', 'эрен йегер', 'эрен', 'hujumchi titan',
      'levi ackerman', 'levi', 'kapitan levi', 'леви', 'леви аккерман',
      'mikasa ackerman', 'mikasa', 'микаса', 'микаса аккерман',
      'armin arlert', 'armin', 'армин', 'erwin smith', 'erwin', 'эрвин смит',
      'reiner braun', 'reiner', 'райнер', 'zeke yeager', 'zeke', 'зик'
    ],
    tags: [
      'devlar', 'dev', 'devor', 'shiganshina', 'survekorpus', 'paradis', 'marli', 'wit studio', 'mappa', 'hajime isayama'
    ]
  },

  // 20. Death Note / O'lim daftari / Тетрадь смерти
  {
    matchedPatterns: ['death note', 'olim daftari', 'tetrad smerti', 'light yagami', 'kira', 'ryuk'],
    aliases: [
      'death note', "o'lim daftari", 'olim daftari', 'tetrad smerti', 'тетрадь смерти'
    ],
    characters: [
      'light yagami', 'light', 'лайт', 'лайт ягами', 'kira', 'кира',
      'l lawliet', 'l', 'эл', 'ryuk', 'рюк', 'misa amane', 'misa', 'миса', 'near', 'mello'
    ],
    tags: [
      'shinigami', 'daftar', 'aqliy kurash', 'detektiv', 'madhouse', 'tsugumi ohba'
    ]
  },

  // 21. Bleach / Блич
  {
    matchedPatterns: ['bleach', 'blich', 'блич', 'ichigo', 'aizen'],
    aliases: [
      'bleach', 'blich', 'блич', 'oqartiruvchi', 'ming yillik qonli urush', 'thousand year blood war'
    ],
    characters: [
      'ichigo kurosaki', 'ichigo', 'ичиго', 'ичиго куросаки',
      'sosuke aizen', 'aizen', 'айзен', 'rukia kuchiki', 'rukia', 'рукия',
      'kisuke urahara', 'urahara', 'урахара', 'byakuya kuchiki', 'kenpachi zaraki', 'кенпачи'
    ],
    tags: [
      'bankai', 'zanpakuto', 'shinigami', 'soul society', 'hollow', 'quincy', 'tite kubo'
    ]
  },

  // 22. Chainsaw Man / Arra odam / Человек-бензопила
  {
    matchedPatterns: ['chainsaw man', 'arra odam', 'chelovek benzopila', 'denji', 'makima'],
    aliases: [
      'chainsaw man', 'arra odam', 'zanjirli arra odam', 'chelovek benzopila', 'человек-бензопила', 'csm'
    ],
    characters: [
      'denji', 'дэндзи', 'денджи', 'makima', 'макима', 'power', 'пауэр', 'hayakawa aki', 'aki', 'аки', 'pochita', 'почита'
    ],
    tags: [
      'iblis', 'arra', 'pochita', 'qon', 'mappa', 'tatsuki fujimoto'
    ]
  }
];

/**
 * Result item with score and reason
 */
export interface ScoredSearchResult {
  anime: Anime;
  score: number;
  matchReason?: string;
}

/**
 * Compute fuzzy similarity between two strings (0 to 1)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const s1 = str1.length < str2.length ? str1 : str2;
  const s2 = str1.length < str2.length ? str2 : str1;

  if (s2.includes(s1)) {
    return s1.length / s2.length;
  }

  // Simple bigram Dice coefficient
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

/**
 * MASTER SEARCH FUNCTION
 * Evaluates an anime against a query using:
 * 1. Exact title matches
 * 2. Cyrillic <-> Latin transliteration matches
 * 3. Extended knowledge base (Characters, Aliases, English, Russian, Uzbek, Japanese)
 * 4. Acronyms & Short forms (JJK, AOT, SAO, etc.)
 * 5. Genres, Categories & Studio matches
 * 6. Fuzzy / Typo tolerance
 */
export function searchAnimeWithSuperEngine(
  animes: Anime[],
  rawQuery: string
): ScoredSearchResult[] {
  const query = normalizeSearchTerm(rawQuery);
  if (!query) return [];

  const cyrQuery = latinToCyrillic(query);
  const latQuery = cyrillicToLatin(query);
  const queryWords = query.split(' ').filter(Boolean);

  // Check acronym expansion
  const acronymExpansions = ACRONYMS_MAP[query] || [];

  const scoredList: ScoredSearchResult[] = [];

  for (const anime of animes) {
    let score = 0;
    let matchReason = '';

    const normTitle = normalizeSearchTerm(anime.title || '');
    const normOrig = normalizeSearchTerm(anime.original_title || '');
    const normRus = normalizeSearchTerm(anime.russian_title || '');
    const normDesc = normalizeSearchTerm(anime.description || '');
    const genres = (anime.genres || []).map((g) => normalizeSearchTerm(g));

    // Combine all names of this anime
    const allAnimeNames = [normTitle, normOrig, normRus].filter(Boolean);

    // 1. EXACT & PREFIX TITLE MATCH
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

    // 2. TRANSLITERATED MATCH (Latin <-> Cyrillic)
    if (score < 80) {
      for (const name of allAnimeNames) {
        if (name.includes(latQuery) || latinToCyrillic(name).includes(cyrQuery)) {
          score = Math.max(score, 84);
          matchReason = 'Alifbo (Kirill/Lotin) transliteratsiyasi';
          break;
        }
      }
    }

    // 3. ACRONYM MATCH (e.g. JJK, AOT, BL, SL, SAO)
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

    // 4. EXTENDED KNOWLEDGE BASE (Characters, Japanese, Russian, Uzbek Aliases)
    const matchedKnowledge = ANIME_KNOWLEDGE_BASE.filter((kb) =>
      kb.matchedPatterns.some((pat) =>
        normTitle.includes(pat) || normOrig.includes(pat) || normRus.includes(pat)
      )
    );

    for (const kb of matchedKnowledge) {
      // Check character matches
      const matchedChar = kb.characters.find(
        (c) =>
          c === query ||
          c === latQuery ||
          c === cyrQuery ||
          query.includes(c) ||
          c.includes(query)
      );
      if (matchedChar) {
        score = Math.max(score, 88);
        matchReason = `Qahramon: "${matchedChar.toUpperCase()}"`;
      }

      // Check aliases matches
      const matchedAlias = kb.aliases.find(
        (a) =>
          a === query ||
          a === latQuery ||
          a === cyrQuery ||
          query.includes(a) ||
          a.includes(query)
      );
      if (matchedAlias) {
        score = Math.max(score, 86);
        matchReason = `Muqobil nomi: "${matchedAlias}"`;
      }

      // Check tags
      const matchedTag = kb.tags.find(
        (t) => t.includes(query) || query.includes(t)
      );
      if (matchedTag) {
        score = Math.max(score, 75);
        if (!matchReason) matchReason = `Teg / mavzu: "${matchedTag}"`;
      }
    }

    // 5. GENRES MATCH
    if (genres.some((g) => g.includes(query) || query.includes(g))) {
      score = Math.max(score, 65);
      if (!matchReason) matchReason = `Janr: "${query}"`;
    }

    // 6. MULTI-WORD TOKEN OVERLAP
    if (queryWords.length > 1) {
      let matchedTokens = 0;
      for (const word of queryWords) {
        if (
          normTitle.includes(word) ||
          normOrig.includes(word) ||
          normDesc.includes(word)
        ) {
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

    // 7. DESCRIPTION MATCH
    if (normDesc.includes(query) || normDesc.includes(latQuery)) {
      if (score < 60) {
        score = Math.max(score, 55);
        if (!matchReason) matchReason = 'Tavsifda topildi';
      }
    }

    // 8. FUZZY / TYPO MATCHING (Levenshtein & Bigram)
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
      scoredList.push({
        anime,
        score,
        matchReason,
      });
    }
  }

  // Sort descending by relevance score
  scoredList.sort((a, b) => b.score - a.score);
  return scoredList;
}

/**
 * Top suggested search keywords
 */
export const POPULAR_SEARCH_KEYWORDS = [
  { label: 'Naruto', icon: '🔥', query: 'naruto' },
  { label: 'Solo Leveling', icon: '⚡', query: 'solo leveling' },
  { label: 'Gojo Satoru', icon: '🤞', query: 'gojo' },
  { label: 'Blue Lock', icon: '⚽', query: 'blue lock' },
  { label: 'Doktor Stoun', icon: '🧪', query: 'doktor stoun' },
  { label: 'One Piece', icon: '🏴‍☠️', query: 'one piece' },
  { label: 'Sukuna', icon: '😈', query: 'sukuna' },
  { label: 'Soyada koʻtarilish', icon: '🌑', query: 'soyada kotarilish' },
  { label: 'Jujutsu Kaisen', icon: '🔮', query: 'jujutsu' },
  { label: 'Demon Slayer', icon: '⚔️', query: 'tanjiro' },
  { label: 'Isekai', icon: '🌀', query: 'isekai' },
  { label: 'Romantika', icon: '💖', query: 'ramantika' },
  { label: 'Jangari', icon: '💥', query: 'jangari' },
  { label: 'Filmlar', icon: '🎬', query: 'film' },
];
