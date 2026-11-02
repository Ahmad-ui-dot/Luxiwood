// Тестовые данные. Безопасно запускать много раз:
// недостающие категории, материалы и товары добавляются, существующие не меняются;
// демо-заказы и отзывы создаются только в пустой базе,
// администратор, клиент и настройки не перезаписываются.
// Все цены — примерные, их нужно заменить реальными ценами мастерской.
import 'dotenv/config';
import { calcProductPrice, normalizePhone, WOOD_MODEL_KEYS } from '@luxiwood/shared';
import { Badge, Material, MaterialType, Model3dKey, OrderStatus, PrismaClient, ProductKind, Room } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { DEFAULT_SETTINGS } from '../src/settings/settings.defaults';

const prisma = new PrismaClient();

// Тестовый клиент — для входа на сайт и проверки личного кабинета
const DEMO_CLIENT = { name: 'Мадина', phone: '+992 93 000 00 01', email: 'madina@gmail.com', password: 'client12345' };

const categories = [
  { slug: 'divany', name: 'Диваны', sortOrder: 1 },
  { slug: 'kresla', name: 'Кресла', sortOrder: 2 },
  { slug: 'krovati', name: 'Кровати', sortOrder: 3 },
  { slug: 'shkafy', name: 'Шкафы', sortOrder: 4 },
  { slug: 'obedennye-stoly', name: 'Обеденные столы', sortOrder: 5 },
  { slug: 'pismennye-stoly', name: 'Письменные столы', sortOrder: 6 },
  { slug: 'stulya', name: 'Стулья', sortOrder: 7 },
  { slug: 'komody', name: 'Комоды и тумбы', sortOrder: 8 },
  { slug: 'stellazhi', name: 'Стеллажи', sortOrder: 9 },
  { slug: 'pufy', name: 'Пуфы и скамьи', sortOrder: 10 },
];

const materials: { type: MaterialType; name: string; hex: string; priceDelta: number }[] = [
  // Ткани обивки
  { type: 'FABRIC', name: 'Букле', hex: '#EDE6DA', priceDelta: 0 },
  { type: 'FABRIC', name: 'Велюр', hex: '#8E7F72', priceDelta: 400 },
  { type: 'FABRIC', name: 'Рогожка', hex: '#B9A88F', priceDelta: 200 },
  { type: 'FABRIC', name: 'Кожа', hex: '#5A3B2A', priceDelta: 1800 },
  // Цвета обивки
  { type: 'COLOR', name: 'Изумруд', hex: '#1F6B55', priceDelta: 0 },
  { type: 'COLOR', name: 'Карамель', hex: '#B8834F', priceDelta: 0 },
  { type: 'COLOR', name: 'Бордо', hex: '#7A2638', priceDelta: 100 },
  { type: 'COLOR', name: 'Полночь', hex: '#26365C', priceDelta: 100 },
  { type: 'COLOR', name: 'Графит', hex: '#4A4A4E', priceDelta: 0 },
  // Породы дерева
  { type: 'WOOD', name: 'Дуб', hex: '#C29A6B', priceDelta: 0 },
  { type: 'WOOD', name: 'Орех', hex: '#6B4630', priceDelta: 600 },
  { type: 'WOOD', name: 'Венге', hex: '#3B2A20', priceDelta: 400 },
  { type: 'WOOD', name: 'Белёный дуб', hex: '#E3D3BC', priceDelta: 200 },
  { type: 'WOOD', name: 'Ясень', hex: '#D9BE94', priceDelta: 100 },
  // Покрытие дерева
  { type: 'FINISH', name: 'Масло-воск', hex: '#D8C3A0', priceDelta: 0 },
  { type: 'FINISH', name: 'Матовый лак', hex: '#CBB89A', priceDelta: 200 },
  { type: 'FINISH', name: 'Глянец', hex: '#E9DCC6', priceDelta: 400 },
];

type SeedSize = [label: string, widthCm: number, heightCm: number, depthCm: number, priceDelta: number];

interface SeedProduct {
  slug: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  oldPrice?: number;
  room: Room;
  badge?: Badge;
  materialsText: string;
  productionDays: number;
  model3dKey: Model3dKey;
  defaultColor?: string;
  sizes: SeedSize[]; // второй размер — по умолчанию
}

const SOFT = 'Каркас: массив сосны · Обивка: ткань на выбор · Ножки: массив дерева';
const CABINET = 'Корпус: мебельный щит · Фасады: массив дерева на выбор · Покрытие: масло-воск';
const TABLE = 'Столешница: массив дерева на выбор · Ножки: массив дерева';

const products: SeedProduct[] = [
  // Диваны
  { slug: 'divan-orom', sku: 'LX-101', name: 'Диван трёхместный', category: 'divany', basePrice: 8900, room: 'LIVING', badge: 'HIT', productionDays: 14, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Карамель',
    description: 'Трёхместный диван с мягкими подушками и деревянными ножками. Спокойная форма для гостиной.',
    sizes: [['190 см', 190, 85, 95, -800], ['210 см', 210, 85, 95, 0], ['240 см', 240, 85, 95, 1400]] },
  { slug: 'divan-pamir', sku: 'LX-102', name: 'Угловой диван', category: 'divany', basePrice: 12400, oldPrice: 13900, room: 'LIVING', productionDays: 16, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Графит',
    description: 'Большой угловой диван для всей семьи. Угол можно поставить слева или справа.',
    sizes: [['240 см', 240, 88, 160, -1500], ['280 см', 280, 88, 160, 0], ['320 см', 320, 88, 170, 1900]] },
  { slug: 'divan-nurek', sku: 'LX-103', name: 'Двухместный диван', category: 'divany', basePrice: 6400, room: 'OFFICE', productionDays: 12, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Полночь',
    description: 'Компактный диван для кабинета или небольшой комнаты.',
    sizes: [['150 см', 150, 82, 88, -600], ['170 см', 170, 82, 88, 0], ['190 см', 190, 82, 88, 700]] },
  { slug: 'divan-iskandar', sku: 'LX-104', name: 'Диван', category: 'divany', basePrice: 10900, room: 'LIVING', badge: 'NEW', productionDays: 18, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Бордо',
    description: 'Строгий диван с высокими подлокотниками. Хорошо смотрится в коже.',
    sizes: [['200 см', 200, 80, 98, -900], ['220 см', 220, 80, 98, 0], ['250 см', 250, 80, 98, 1300]] },
  { slug: 'divan-hissar', sku: 'LX-105', name: 'Диван-кровать', category: 'divany', basePrice: 9600, oldPrice: 10500, room: 'KIDS', productionDays: 15, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Изумруд',
    description: 'Раскладывается в спальное место 140×200. Ящик для белья под сиденьем.',
    sizes: [['180 см', 180, 90, 100, -700], ['200 см', 200, 90, 100, 0], ['220 см', 220, 90, 100, 800]] },
  // Кресла
  { slug: 'kreslo-navruz', sku: 'LX-201', name: 'Кресло', category: 'kresla', basePrice: 3400, room: 'LIVING', badge: 'HIT', productionDays: 10, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Карамель',
    description: 'Удобное кресло с высокой спинкой. Хорошо смотрится в паре с нашими диванами.',
    sizes: [['76 см', 76, 90, 80, -300], ['82 см', 82, 92, 84, 0], ['90 см', 90, 95, 88, 450]] },
  { slug: 'kreslo-somon', sku: 'LX-202', name: 'Кресло', category: 'kresla', basePrice: 2900, oldPrice: 3300, room: 'OFFICE', productionDays: 9, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Графит',
    description: 'Лёгкое кресло для кабинета и чтения у окна.',
    sizes: [['70 см', 70, 86, 78, -250], ['76 см', 76, 88, 80, 0], ['82 см', 82, 90, 84, 300]] },
  { slug: 'kreslo-lola', sku: 'LX-203', name: 'Детское кресло', category: 'kresla', basePrice: 1900, room: 'KIDS', badge: 'NEW', productionDays: 7, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Изумруд',
    description: 'Небольшое мягкое кресло для детской, без острых углов.',
    sizes: [['55 см', 55, 60, 50, -200], ['60 см', 60, 65, 55, 0], ['65 см', 65, 70, 60, 200]] },
  { slug: 'kreslo-kuhiston', sku: 'LX-204', name: 'Кресло', category: 'kresla', basePrice: 4200, room: 'LIVING', productionDays: 12, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Бордо',
    description: 'Глубокое кресло с широкими подлокотниками для долгого отдыха.',
    sizes: [['85 см', 85, 95, 90, -400], ['92 см', 92, 98, 94, 0], ['100 см', 100, 100, 98, 500]] },
  { slug: 'kreslo-bahor', sku: 'LX-205', name: 'Кресло', category: 'kresla', basePrice: 3100, room: 'BEDROOM', productionDays: 10, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Полночь',
    description: 'Мягкое кресло для спальни, подходит к нашим кроватям.',
    sizes: [['72 см', 72, 88, 78, -250], ['78 см', 78, 90, 82, 0], ['84 см', 84, 92, 86, 300]] },
  // Кровати
  { slug: 'krovat-varzob', sku: 'LX-301', name: 'Кровать', category: 'krovati', basePrice: 6500, room: 'BEDROOM', badge: 'HIT', productionDays: 14, model3dKey: 'bed', materialsText: 'Каркас: массив сосны · Изголовье: ткань на выбор · Ножки: массив дерева', defaultColor: 'Карамель',
    description: 'Кровать с мягким изголовьем и прочным основанием под ортопедический матрас.',
    sizes: [['140×200', 150, 110, 210, -900], ['160×200', 170, 110, 210, 0], ['180×200', 190, 110, 210, 1100]] },
  { slug: 'krovat-zarafshan', sku: 'LX-302', name: 'Кровать', category: 'krovati', basePrice: 7800, room: 'BEDROOM', badge: 'NEW', productionDays: 16, model3dKey: 'bed', materialsText: 'Каркас: массив сосны · Изголовье: ткань на выбор · Ножки: массив дерева', defaultColor: 'Изумруд',
    description: 'Кровать с высоким изголовьем и подъёмным основанием.',
    sizes: [['140×200', 152, 120, 212, -1000], ['160×200', 172, 120, 212, 0], ['180×200', 192, 120, 212, 1200]] },
  { slug: 'krovat-yagnob', sku: 'LX-303', name: 'Кровать', category: 'krovati', basePrice: 5900, oldPrice: 6600, room: 'BEDROOM', productionDays: 12, model3dKey: 'bed', materialsText: 'Каркас: массив сосны · Изголовье: ткань на выбор · Ножки: массив дерева', defaultColor: 'Графит',
    description: 'Простая кровать с низким изголовьем для небольшой спальни.',
    sizes: [['140×200', 148, 95, 208, -800], ['160×200', 168, 95, 208, 0], ['180×200', 188, 95, 208, 1000]] },
  { slug: 'krovat-zvezdochka', sku: 'LX-304', name: 'Детская кровать', category: 'krovati', basePrice: 3900, room: 'KIDS', productionDays: 10, model3dKey: 'bed', materialsText: 'Каркас: массив сосны · Изголовье: ткань на выбор · Бортик: массив дерева', defaultColor: 'Полночь',
    description: 'Кровать для детской с невысоким бортиком.',
    sizes: [['80×160', 88, 80, 168, -500], ['90×190', 98, 80, 198, 0], ['90×200', 98, 80, 208, 200]] },
  // Шкафы
  { slug: 'shkaf-pamir', sku: 'LX-401', name: 'Распашной шкаф', category: 'shkafy', basePrice: 7200, room: 'BEDROOM', badge: 'HIT', productionDays: 16, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Распашной шкаф с полками и штангой для одежды. Нужен другой размер — соберите шкаф в конструкторе.',
    sizes: [['120 см', 120, 220, 60, -1500], ['160 см', 160, 220, 60, 0], ['200 см', 200, 220, 60, 1700]] },
  { slug: 'shkaf-dushanbe', sku: 'LX-402', name: 'Шкаф-купе', category: 'shkafy', basePrice: 9800, room: 'BEDROOM', badge: 'NEW', productionDays: 18, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Шкаф-купе с раздвижными дверями — не нужно место перед шкафом.',
    sizes: [['180 см', 180, 240, 62, -1200], ['220 см', 220, 240, 62, 0], ['260 см', 260, 240, 62, 1500]] },
  { slug: 'shkaf-ravshan', sku: 'LX-403', name: 'Шкаф для прихожей', category: 'shkafy', basePrice: 4600, room: 'HALLWAY', productionDays: 12, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Неглубокий шкаф для верхней одежды и обуви.',
    sizes: [['80 см', 80, 210, 40, -700], ['100 см', 100, 210, 40, 0], ['120 см', 120, 210, 40, 600]] },
  { slug: 'shkaf-mehr', sku: 'LX-404', name: 'Детский шкаф', category: 'shkafy', basePrice: 3800, oldPrice: 4300, room: 'KIDS', productionDays: 12, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Невысокий шкаф, до верхней полки ребёнок дотягивается сам.',
    sizes: [['80 см', 80, 160, 50, -500], ['100 см', 100, 160, 50, 0], ['120 см', 120, 160, 50, 500]] },
  { slug: 'shkaf-dono', sku: 'LX-405', name: 'Книжный шкаф', category: 'shkafy', basePrice: 5200, room: 'OFFICE', productionDays: 14, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Открытые полки сверху и закрытые дверцы снизу.',
    sizes: [['80 см', 80, 200, 35, -600], ['100 см', 100, 200, 35, 0], ['120 см', 120, 200, 35, 700]] },
  // Столы
  { slug: 'stol-dastarkhan', sku: 'LX-501', name: 'Обеденный стол', category: 'obedennye-stoly', basePrice: 2900, room: 'DINING', badge: 'HIT', productionDays: 10, model3dKey: 'table', materialsText: TABLE,
    description: 'Обеденный стол из массива для большой семьи и гостей.',
    sizes: [['140×80', 140, 75, 80, -400], ['160×90', 160, 75, 90, 0], ['180×90', 180, 75, 90, 500]] },
  { slug: 'stol-oila', sku: 'LX-502', name: 'Раздвижной стол', category: 'obedennye-stoly', basePrice: 4100, room: 'DINING', badge: 'NEW', productionDays: 14, model3dKey: 'table', materialsText: TABLE,
    description: 'Раздвигается на 50 см — для праздников, когда собирается вся семья.',
    sizes: [['140×85', 140, 76, 85, -500], ['160×90', 160, 76, 90, 0], ['180×95', 180, 76, 95, 600]] },
  { slug: 'stol-chaykhona', sku: 'LX-503', name: 'Круглый стол', category: 'obedennye-stoly', basePrice: 3300, oldPrice: 3700, room: 'DINING', productionDays: 10, model3dKey: 'table', materialsText: TABLE,
    description: 'Круглый стол на одной опоре для кухни или веранды.',
    sizes: [['Ø 90', 90, 75, 90, -400], ['Ø 110', 110, 75, 110, 0], ['Ø 130', 130, 75, 130, 500]] },
  { slug: 'stol-donish', sku: 'LX-504', name: 'Письменный стол', category: 'pismennye-stoly', basePrice: 2400, room: 'OFFICE', productionDays: 9, model3dKey: 'table', materialsText: TABLE,
    description: 'Письменный стол с ящиком для бумаг.',
    sizes: [['100×55', 100, 75, 55, -300], ['120×60', 120, 75, 60, 0], ['140×65', 140, 75, 65, 300]] },
  { slug: 'stol-shkolnik', sku: 'LX-505', name: 'Стол школьника', category: 'pismennye-stoly', basePrice: 1800, room: 'KIDS', productionDays: 7, model3dKey: 'table', materialsText: TABLE,
    description: 'Стол для уроков с полкой для учебников.',
    sizes: [['90×50', 90, 72, 50, -200], ['100×55', 100, 72, 55, 0], ['110×60', 110, 72, 60, 200]] },
  // Дополнительные модели
  { slug: 'divan-khujand', sku: 'LX-106', name: 'Модульный диван', category: 'divany', basePrice: 14200, room: 'LIVING', badge: 'NEW', productionDays: 20, model3dKey: 'sofa', materialsText: SOFT, defaultColor: 'Изумруд',
    description: 'Диван из отдельных модулей: можно переставить в угол или разделить на два кресла.',
    sizes: [['260 см', 260, 78, 105, -1600], ['300 см', 300, 78, 105, 0], ['340 см', 340, 78, 105, 1800]] },
  { slug: 'kreslo-sitora', sku: 'LX-206', name: 'Кресло-шезлонг', category: 'kresla', basePrice: 3900, oldPrice: 4400, room: 'BEDROOM', productionDays: 11, model3dKey: 'armchair', materialsText: SOFT, defaultColor: 'Бордо',
    description: 'Низкое кресло с длинным сиденьем, чтобы читать, вытянув ноги.',
    sizes: [['70 см', 70, 82, 130, -300], ['76 см', 76, 84, 140, 0], ['82 см', 82, 86, 150, 350]] },
  { slug: 'krovat-kulob', sku: 'LX-305', name: 'Кровать с ящиками', category: 'krovati', basePrice: 7100, room: 'BEDROOM', productionDays: 15, model3dKey: 'bed', materialsText: 'Каркас: массив сосны · Изголовье: ткань на выбор · Ящики: мебельный щит', defaultColor: 'Карамель',
    description: 'Под основанием два выдвижных ящика для одеял и подушек.',
    sizes: [['140×200', 150, 105, 210, -900], ['160×200', 170, 105, 210, 0], ['180×200', 190, 105, 210, 1100]] },
  { slug: 'shkaf-anor', sku: 'LX-406', name: 'Шкаф-витрина', category: 'shkafy', basePrice: 6300, room: 'DINING', badge: 'HIT', productionDays: 15, model3dKey: 'wardrobe', materialsText: CABINET,
    description: 'Шкаф для посуды и сервиза в столовую. Верхние полки за стеклом.',
    sizes: [['90 см', 90, 200, 45, -700], ['110 см', 110, 200, 45, 0], ['130 см', 130, 200, 45, 800]] },
  { slug: 'stol-ruboi', sku: 'LX-506', name: 'Журнальный стол', category: 'obedennye-stoly', basePrice: 1600, room: 'LIVING', badge: 'NEW', productionDays: 6, model3dKey: 'table', materialsText: TABLE,
    description: 'Низкий стол к дивану: для чая, книг и пульта.',
    sizes: [['80×50', 80, 45, 50, -200], ['100×60', 100, 45, 60, 0], ['120×65', 120, 45, 65, 250]] },
  { slug: 'stol-masnavi', sku: 'LX-507', name: 'Угловой стол', category: 'pismennye-stoly', basePrice: 3600, oldPrice: 3900, room: 'OFFICE', productionDays: 12, model3dKey: 'table', materialsText: TABLE,
    description: 'Большой стол для работы за компьютером, с местом под второй монитор.',
    sizes: [['140×120', 140, 75, 120, -400], ['160×130', 160, 75, 130, 0], ['180×140', 180, 75, 140, 450]] },
  // Стулья — мягкое сиденье, ножки из дерева
  { slug: 'stul-bakht', sku: 'LX-601', name: 'Стул', category: 'stulya', basePrice: 1200, room: 'DINING', badge: 'HIT', productionDays: 7, model3dKey: 'chair', materialsText: 'Каркас: массив бука · Сиденье: ткань на выбор', defaultColor: 'Карамель',
    description: 'Обеденный стул с мягким сиденьем. Обычно заказывают комплектом к столу.',
    sizes: [['42 см', 42, 88, 48, -100], ['45 см', 45, 90, 50, 0], ['48 см', 48, 92, 52, 120]] },
  { slug: 'stul-shirin', sku: 'LX-602', name: 'Полукресло', category: 'stulya', basePrice: 1700, room: 'DINING', badge: 'NEW', productionDays: 9, model3dKey: 'chair', materialsText: 'Каркас: массив бука · Сиденье и спинка: ткань на выбор', defaultColor: 'Изумруд',
    description: 'Стул пошире, с высокой спинкой — удобно сидеть за долгим ужином.',
    sizes: [['48 см', 48, 90, 52, -150], ['52 см', 52, 92, 54, 0], ['56 см', 56, 94, 56, 180]] },
  { slug: 'stul-regar', sku: 'LX-603', name: 'Барный стул', category: 'stulya', basePrice: 1400, room: 'DINING', productionDays: 8, model3dKey: 'chair', materialsText: 'Каркас: массив бука · Сиденье: ткань на выбор', defaultColor: 'Графит',
    description: 'Высокий стул для кухонного острова или барной стойки, с подножкой.',
    sizes: [['40 см', 40, 100, 42, -100], ['42 см', 42, 105, 44, 0], ['45 см', 45, 110, 46, 120]] },
  // Комоды и тумбы
  { slug: 'komod-sugd', sku: 'LX-701', name: 'Комод', category: 'komody', basePrice: 4300, room: 'BEDROOM', badge: 'HIT', productionDays: 12, model3dKey: 'dresser', materialsText: CABINET,
    description: 'Комод на четыре широких ящика с плавным закрыванием.',
    sizes: [['80 см', 80, 90, 45, -500], ['100 см', 100, 90, 45, 0], ['120 см', 120, 90, 45, 600]] },
  { slug: 'komod-khatlon', sku: 'LX-702', name: 'Комод', category: 'komody', basePrice: 5100, oldPrice: 5700, room: 'LIVING', productionDays: 14, model3dKey: 'dresser', materialsText: CABINET,
    description: 'Низкий и длинный комод для гостиной: сверху можно поставить телевизор или вазы.',
    sizes: [['120 см', 120, 75, 45, -600], ['150 см', 150, 75, 45, 0], ['180 см', 180, 75, 45, 700]] },
  { slug: 'tumba-shab', sku: 'LX-703', name: 'Прикроватная тумба', category: 'komody', basePrice: 1500, room: 'BEDROOM', badge: 'NEW', productionDays: 7, model3dKey: 'nightstand', materialsText: CABINET,
    description: 'Тумба с ящиком и открытой полкой — к любой из наших кроватей.',
    sizes: [['40 см', 40, 55, 38, -150], ['45 см', 45, 55, 40, 0], ['50 см', 50, 58, 42, 150]] },
  { slug: 'tumba-rovshan', sku: 'LX-704', name: 'Тумба для прихожей', category: 'komody', basePrice: 2100, room: 'HALLWAY', productionDays: 9, model3dKey: 'nightstand', materialsText: CABINET,
    description: 'Невысокая тумба для ключей, перчаток и мелочей у входной двери.',
    sizes: [['50 см', 50, 75, 35, -200], ['60 см', 60, 75, 35, 0], ['70 см', 70, 78, 38, 250]] },
  // Стеллажи
  { slug: 'stellazh-kitob', sku: 'LX-801', name: 'Стеллаж', category: 'stellazhi', basePrice: 2600, room: 'OFFICE', badge: 'HIT', productionDays: 10, model3dKey: 'shelf', materialsText: 'Стойки и полки: массив дерева на выбор · Покрытие: масло-воск',
    description: 'Открытый стеллаж на пять полок для книг и папок.',
    sizes: [['80 см', 80, 180, 35, -300], ['100 см', 100, 190, 35, 0], ['120 см', 120, 200, 35, 400]] },
  { slug: 'stellazh-bozicha', sku: 'LX-802', name: 'Детский стеллаж', category: 'stellazhi', basePrice: 1900, room: 'KIDS', productionDays: 8, model3dKey: 'shelf', materialsText: 'Стойки и полки: массив дерева на выбор · Покрытие: детское масло',
    description: 'Невысокий стеллаж для игрушек: ребёнок сам достаёт до верхней полки.',
    sizes: [['70 см', 70, 110, 32, -200], ['90 см', 90, 120, 32, 0], ['110 см', 110, 130, 32, 250]] },
  // Пуфы и скамьи
  { slug: 'puf-gulbahor', sku: 'LX-901', name: 'Пуф', category: 'pufy', basePrice: 900, room: 'LIVING', badge: 'NEW', productionDays: 5, model3dKey: 'pouf', materialsText: 'Основа: фанера · Обивка: ткань на выбор', defaultColor: 'Бордо',
    description: 'Круглый мягкий пуф: можно сесть, а можно поставить поднос с чаем.',
    sizes: [['Ø 45', 45, 42, 45, -100], ['Ø 55', 55, 44, 55, 0], ['Ø 65', 65, 45, 65, 150]] },
  { slug: 'puf-nigina', sku: 'LX-902', name: 'Пуф-банкетка', category: 'pufy', basePrice: 1300, room: 'BEDROOM', productionDays: 6, model3dKey: 'pouf', materialsText: 'Основа: фанера · Обивка: ткань на выбор', defaultColor: 'Полночь',
    description: 'Вытянутый пуф к изножью кровати или к туалетному столику.',
    sizes: [['80 см', 80, 45, 40, -150], ['100 см', 100, 45, 40, 0], ['120 см', 120, 45, 42, 200]] },
  { slug: 'skamya-ostona', sku: 'LX-903', name: 'Скамья для прихожей', category: 'pufy', basePrice: 2200, room: 'HALLWAY', badge: 'HIT', productionDays: 9, model3dKey: 'bench', materialsText: TABLE,
    description: 'Скамья с полкой для обуви снизу: удобно разуваться сидя.',
    sizes: [['80 см', 80, 48, 35, -250], ['100 см', 100, 48, 35, 0], ['120 см', 120, 48, 38, 300]] },
  { slug: 'skamya-mehmon', sku: 'LX-904', name: 'Обеденная скамья', category: 'pufy', basePrice: 2500, oldPrice: 2800, room: 'DINING', productionDays: 10, model3dKey: 'bench', materialsText: TABLE,
    description: 'Длинная скамья к обеденному столу — на неё садятся трое.',
    sizes: [['140 см', 140, 45, 38, -300], ['160 см', 160, 45, 38, 0], ['180 см', 180, 45, 40, 350]] },
];

async function seedUsers() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Укажите ADMIN_EMAIL и ADMIN_PASSWORD в apps/api/.env');
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`Администратор ${email} уже есть — пропускаю`);
  } else {
    await prisma.user.create({
      data: { email, name: 'Администратор', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Создан администратор ${email}`);
  }

  const phone = normalizePhone(DEMO_CLIENT.phone)!;
  if (!(await prisma.user.findUnique({ where: { phone } }))) {
    await prisma.user.create({
      data: {
        name: DEMO_CLIENT.name,
        phone,
        email: DEMO_CLIENT.email,
        defaultAddress: 'Душанбе, ул. Рудаки, 10',
        passwordHash: await bcrypt.hash(DEMO_CLIENT.password, 10),
      },
    });
    console.log(`Создан тестовый клиент ${DEMO_CLIENT.phone} (пароль ${DEMO_CLIENT.password})`);
  }
}

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
}

// Добавляет только то, чего ещё нет: категории — по slug, материалы — по типу и названию, товары — по slug или артикулу.
// Поэтому в старой базе появятся новые товары, а изменённое в админке останется как есть
async function seedCatalog() {
  const wasEmpty = (await prisma.product.count()) === 0;

  const categoryIds: Record<string, number> = {};
  for (const category of categories) {
    const saved = await prisma.category.upsert({ where: { slug: category.slug }, create: category, update: {} });
    categoryIds[category.slug] = saved.id;
  }

  const created: Material[] = [];
  for (const material of materials) {
    const saved = await prisma.material.findFirst({ where: { type: material.type, name: material.name } });
    created.push(saved ?? (await prisma.material.create({ data: material })));
  }
  const ofType = (type: MaterialType) => created.filter((material) => material.type === type);

  let added = 0;
  for (const product of products) {
    if (await prisma.product.findFirst({ where: { OR: [{ slug: product.slug }, { sku: product.sku }] } })) {
      continue;
    }
    added++;
    const { category, sizes, defaultColor, ...data } = product;
    const kind: ProductKind = WOOD_MODEL_KEYS.includes(product.model3dKey) ? 'WOOD' : 'FABRIC';

    // Мягкая мебель: ткань, цвет обивки и дерево ножек. Корпусная: основной материал — дерево
    const links =
      kind === 'FABRIC'
        ? [
            ...ofType('FABRIC').map((m, i) => ({ materialId: m.id, role: 'MAIN' as const, isDefault: i === 0 })),
            ...ofType('COLOR').map((m) => ({ materialId: m.id, role: 'COLOR' as const, isDefault: m.name === defaultColor })),
            ...ofType('WOOD').map((m, i) => ({ materialId: m.id, role: 'WOOD' as const, isDefault: i === 0 })),
          ]
        : ofType('WOOD').map((m, i) => ({ materialId: m.id, role: 'MAIN' as const, isDefault: i === 0 }));

    await prisma.product.create({
      data: {
        ...data,
        kind,
        widthCm: sizes[1][1],
        categoryId: categoryIds[category],
        materials: { create: links },
        sizes: {
          create: sizes.map(([label, widthCm, heightCm, depthCm, priceDelta], i) => ({
            label,
            widthCm,
            heightCm,
            depthCm,
            priceDelta,
            isDefault: i === 1,
          })),
        },
      },
    });
  }
  console.log(added > 0 ? `Каталог: добавлено товаров — ${added}` : 'Каталог уже заполнен — пропускаю');

  await seedReviews();
  await seedOtherReviews();
  // Демо-заказы — только в новой базе, чтобы не повторялись
  if (wasEmpty) {
    await seedOrders();
  }
}

// Демо-отзывы — только если отзывов ещё нет совсем (например, каталог появился раньше отзывов)
async function seedReviews() {
  if ((await prisma.review.count()) > 0) {
    return;
  }
  const client = await prisma.user.findUniqueOrThrow({ where: { phone: normalizePhone(DEMO_CLIENT.phone)! } });
  const reviews = [
    { slug: 'divan-orom', rating: 5, text: 'Диван сделали за 12 дней, ткань как на образце. Сидеть очень удобно.' },
    { slug: 'kreslo-navruz', rating: 4, text: 'Хорошее кресло, но пришлось подождать доставку на день дольше.' },
    { slug: 'stol-dastarkhan', rating: 5, text: 'Стол крепкий, за ним спокойно помещаются восемь человек.' },
    { slug: 'krovat-varzob', rating: 5, text: 'Изголовье мягкое, кровать не скрипит. Спасибо мастерам!' },
  ];
  for (const review of reviews) {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: review.slug } });
    await prisma.review.create({ data: { productId: product.id, userId: client.id, rating: review.rating, text: review.text } });
    await prisma.product.update({ where: { id: product.id }, data: { ratingAvg: review.rating, reviewsCount: 1 } });
  }
}

// Отзывы других покупателей. Покупатель и его отзывы создаются вместе и только один раз:
// если такое имя уже есть, его пропускаем — так удалённые в админке отзывы не вернутся
const otherReviewers: { name: string; reviews: { slug: string; rating: number; text: string; daysAgo: number }[] }[] = [
  {
    name: 'Фарход',
    reviews: [
      { slug: 'divan-orom', rating: 5, text: 'Брали в гостиную — гости первым делом садятся именно на него. Ткань не скатывается.', daysAgo: 20 },
      { slug: 'shkaf-dushanbe', rating: 4, text: 'Шкаф вместительный, собрали аккуратно. Одна дверца сначала чуть скрипела, мастер приехал и подтянул.', daysAgo: 34 },
    ],
  },
  {
    name: 'Нилуфар',
    reviews: [
      { slug: 'kreslo-navruz', rating: 5, text: 'Выбрала цвет в конструкторе — в жизни ещё красивее. Кресло мягкое, но спину держит.', daysAgo: 9 },
      { slug: 'puf-nigina', rating: 5, text: 'Пуф стоит в прихожей, очень удобно обуваться. Качество отличное.', daysAgo: 15 },
    ],
  },
  {
    name: 'Рустам',
    reviews: [
      { slug: 'stol-dastarkhan', rating: 4, text: 'Стол массивный, дерево красивое. Доставили вовремя, только упаковку пришлось выносить самим.', daysAgo: 27 },
      { slug: 'stul-bakht', rating: 5, text: 'Взяли шесть стульев к столу — крепкие, не шатаются, сидеть удобно.', daysAgo: 26 },
    ],
  },
  {
    name: 'Зарина',
    reviews: [
      { slug: 'krovat-varzob', rating: 5, text: 'Наконец-то высыпаюсь. Кровать большая, изголовье приятное на ощупь.', daysAgo: 12 },
      { slug: 'komod-khatlon', rating: 4, text: 'Комод хороший, ящики выдвигаются плавно. Хотелось бы чуть больше вариантов цвета.', daysAgo: 40 },
    ],
  },
  {
    name: 'Далер',
    reviews: [
      { slug: 'stol-donish', rating: 5, text: 'Письменный стол для сына — ровный, устойчивый, ящики вместительные.', daysAgo: 6 },
      { slug: 'divan-pamir', rating: 3, text: 'Диван удобный, но изготовление заняло на несколько дней больше, чем обещали.', daysAgo: 50 },
    ],
  },
  {
    name: 'Шахноза',
    reviews: [
      { slug: 'stellazh-kitob', rating: 5, text: 'Стеллаж выдерживает все наши книги, полки не прогибаются. Смотрится очень уютно.', daysAgo: 18 },
      { slug: 'kreslo-lola', rating: 4, text: 'Красивое кресло, ребёнок его обожает. Обивку легко чистить.', daysAgo: 22 },
    ],
  },
];

async function seedOtherReviews() {
  const touched = new Set<number>();
  for (const reviewer of otherReviewers) {
    if (await prisma.user.findFirst({ where: { name: { equals: reviewer.name, mode: 'insensitive' } } })) {
      continue;
    }
    // Случайный пароль: демо-покупатели только для отзывов, входить под ними не нужно
    const user = await prisma.user.create({ data: { name: reviewer.name, passwordHash: await bcrypt.hash(randomUUID(), 10) } });
    for (const review of reviewer.reviews) {
      const product = await prisma.product.findUnique({ where: { slug: review.slug } });
      if (!product) continue;
      const createdAt = new Date(Date.now() - review.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.review.create({ data: { productId: product.id, userId: user.id, rating: review.rating, text: review.text, createdAt } });
      touched.add(product.id);
    }
  }

  // Пересчёт рейтинга — так же, как при новом отзыве на сайте
  for (const productId of touched) {
    const stats = await prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: Math.round((stats._avg.rating ?? 0) * 10) / 10, reviewsCount: stats._count._all },
    });
  }
  if (touched.size > 0) console.log(`Отзывы: добавлены отзывы покупателей для ${touched.size} товаров`);
}

// Три демо-заказа на разных этапах, чтобы в админке было что смотреть
async function seedOrders() {
  const client = await prisma.user.findUniqueOrThrow({ where: { phone: normalizePhone(DEMO_CLIENT.phone)! } });
  const year = new Date().getFullYear();
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const demo: { slug: string; quantity: number; status: OrderStatus; userId: number | null; name: string; phone: string; created: number }[] = [
    { slug: 'divan-orom', quantity: 1, status: 'DONE', userId: client.id, name: 'Мадина', phone: '+992930000001', created: 45 },
    { slug: 'stol-dastarkhan', quantity: 1, status: 'DELIVERING', userId: null, name: 'Фарход', phone: '+992901234567', created: 12 },
    { slug: 'kreslo-navruz', quantity: 2, status: 'FRAME', userId: client.id, name: 'Мадина', phone: '+992930000001', created: 3 },
  ];
  const flow: OrderStatus[] = ['NEW', 'FRAME', 'ASSEMBLY', 'UPHOLSTERY', 'DELIVERING', 'DONE'];

  for (const [index, order] of demo.entries()) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: order.slug },
      include: { materials: { where: { isDefault: true }, include: { material: true } }, sizes: { where: { isDefault: true } } },
    });
    const main = product.materials.find((link) => link.role === 'MAIN')!.material;
    const color = product.materials.find((link) => link.role === 'COLOR')?.material;
    const wood = product.materials.find((link) => link.role === 'WOOD')?.material;
    const size = product.sizes[0];
    const price = calcProductPrice({
      basePrice: product.basePrice,
      mainMaterial: main,
      colorMaterial: color,
      woodMaterial: wood,
      size: { name: size.label, priceDelta: size.priceDelta },
      quantity: order.quantity,
    });
    const deliveryPrice = price.total >= DEFAULT_SETTINGS.freeDeliveryFrom ? 0 : DEFAULT_SETTINGS.deliveryPrice;
    const createdAt = daysAgo(order.created);
    // У корпусной мебели нет этапа «Обивка»
    const stages = flow
      .slice(0, flow.indexOf(order.status) + 1)
      .filter((status) => status !== 'UPHOLSTERY' || product.kind === 'FABRIC');

    await prisma.order.create({
      data: {
        number: `LX-${year}-${String(index + 1).padStart(4, '0')}`,
        userId: order.userId,
        customerName: order.name,
        phone: order.phone,
        address: 'Душанбе, ул. Рудаки, 10',
        comment: index === 0 ? 'Позвонить за час' : null,
        status: order.status,
        subtotal: price.total,
        deliveryPrice,
        total: price.total + deliveryPrice,
        createdAt,
        items: {
          create: {
            productId: product.id,
            title: product.name,
            model3dKey: product.model3dKey,
            mainMaterialId: main.id,
            colorMaterialId: color?.id,
            woodMaterialId: wood?.id,
            sizeId: size.id,
            quantity: order.quantity,
            unitPrice: price.unitPrice,
            snapshot: { kind: 'product', sku: product.sku, size: size.label, breakdown: price.breakdown.map((line) => ({ ...line })) },
          },
        },
        history: {
          create: stages.map((status, step) => ({ status, changedAt: new Date(createdAt.getTime() + step * 2 * 86400000) })),
        },
      },
    });
  }
  console.log(`Создано демо-заказов: ${demo.length}`);
}

async function main() {
  await seedUsers();
  await seedSettings();
  await seedCatalog();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
