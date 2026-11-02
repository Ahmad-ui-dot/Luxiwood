// Главный сценарий магазина целиком: клиент → каталог → цена → заказ → админ → статус → отзыв → избранное,
// плюс админка товаров, права доступа и лимит заказов. Тесты идут по порядку и используют общие данные.
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { setupApp } from '../src/setup-app';

describe('Luxiwood API: главный сценарий', () => {
  let app: INestApplication;
  let api: () => ReturnType<typeof request>;
  let clientToken: string;
  let adminToken: string;
  let orderId: number;
  let orderNumber: string;
  let sofa: { id: number; defaults: { mainMaterialId: number; colorMaterialId: number; woodMaterialId: number; sizeId: number } };

  const clientPhone = '+992 93 111 22 33';
  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const orderBody = (items: object[]) => ({
    customerName: 'Мадина',
    phone: clientPhone,
    address: 'Душанбе, ул. Рудаки, 10',
    deliveryDate,
    payment: 'CASH',
    items,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
    setupApp(app as NestExpressApplication);
    await app.init();
    api = () => request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('регистрирует клиента и сразу выдаёт токен', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Зарина', email: 'zarina@gmail.com', phone: clientPhone, password: 'zarina12345' })
      .expect(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Зарина', phone: '+992931112233', role: 'CLIENT' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('не регистрирует занятые имя, email и телефон; email обязателен', async () => {
    const register = (body: object) => api().post('/api/auth/register').send({ password: 'nigora12345', ...body });

    const takenPhone = await register({ name: 'Нигора', email: 'nigora@gmail.com', phone: clientPhone }).expect(409);
    expect(takenPhone.body.message).toBe('Пользователь с таким телефоном уже зарегистрирован');
    // Имя — логин, сравнивается без учёта регистра
    const takenName = await register({ name: 'зарина', email: 'other@gmail.com' }).expect(409);
    expect(takenName.body.message).toMatch(/^Имя «зарина» уже занято/);
    const takenEmail = await register({ name: 'Нигора', email: 'ZARINA@gmail.com' }).expect(409);
    expect(takenEmail.body.message).toBe('Пользователь с таким email уже зарегистрирован');

    const badPhone = await register({ name: 'Нигора', email: 'nigora@gmail.com', phone: '+7 900 123 45 67' }).expect(400);
    expect(badPhone.body.errors).toContain('Неверный формат телефона. Пример: +992 90 123 45 67');
    const noEmail = await register({ name: 'Нигора', phone: '+992 93 999 88 77' }).expect(400);
    expect(noEmail.body.errors).toContain('Неверный формат email. Пример: zarina@gmail.com');
  });

  it('входит по имени или email и паролю, но не по телефону', async () => {
    const res = await api().post('/api/auth/login').send({ login: 'зарина', password: 'zarina12345' }).expect(200);
    clientToken = res.body.accessToken;
    expect(res.body.user.name).toBe('Зарина');
    await api().post('/api/auth/login').send({ login: 'Zarina@Gmail.com', password: 'zarina12345' }).expect(200);
    await api().post('/api/auth/login').send({ login: 'Зарина', password: 'wrong-password' }).expect(401);
    await api().post('/api/auth/login').send({ login: 'Нет такого', password: 'zarina12345' }).expect(401);
    await api().post('/api/auth/login').send({ login: clientPhone, password: 'zarina12345' }).expect(401);
    const me = await api().get('/api/auth/me').set(auth(clientToken)).expect(200);
    expect(me.body.phone).toBe('+992931112233');
  });

  it('показывает каталог с фильтрами', async () => {
    const res = await api().get('/api/products').query({ type: 'sofa', maxPrice: 10000, sort: 'price_asc' }).expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items.every((item: { model3dKey: string; basePrice: number }) => item.model3dKey === 'sofa' && item.basePrice <= 10000)).toBe(true);
    const prices = res.body.items.map((item: { basePrice: number }) => item.basePrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const filters = await api().get('/api/products/filters').expect(200);
    expect(filters.body.total).toBe(43);
    expect(filters.body.colors.length).toBeGreaterThan(0);

    await api().get('/api/products').query({ sort: 'cheap' }).expect(400);
  });

  it('открывает страницу товара и считает цену на сервере', async () => {
    const page = await api().get('/api/products/divan-orom').expect(200);
    sofa = page.body;
    const res = await api()
      .post('/api/pricing/quote')
      .send({ productId: sofa.id, mainMaterialId: sofa.defaults.mainMaterialId, quantity: 1 })
      .expect(200);
    expect(res.body.total).toBe(8900);
    expect(res.body.breakdown[0]).toEqual({ label: 'Базовая цена', amount: 8900 });
    expect(res.body.selection.sizeId).toBe(sofa.defaults.sizeId);

    await api().post('/api/pricing/quote').send({ productId: sofa.id, mainMaterialId: 999, quantity: 1 }).expect(400);
    const fit = await api().post('/api/pricing/fit').send({ productId: sofa.id, nicheWidthCm: 230 }).expect(200);
    expect(fit.body.fits).toBe(true);
  });

  it('считает мебель из конструктора', async () => {
    const options = await api().get('/api/configurator/options').expect(200);
    const wardrobe = options.body.types.find((type: { type: string }) => type.type === 'wardrobe');
    const res = await api()
      .post('/api/configurator/quote')
      .send({ type: 'wardrobe', widthCm: 160, depthCm: 60, heightCm: 220, woodMaterialId: wardrobe.woods[0].id, finishMaterialId: wardrobe.finishes[0].id })
      .expect(200);
    expect(res.body.price).toBe(wardrobe.basePrice);
    await api()
      .post('/api/configurator/quote')
      .send({ type: 'wardrobe', widthCm: 400, depthCm: 60, heightCm: 220, woodMaterialId: wardrobe.woods[0].id, finishMaterialId: wardrobe.finishes[0].id })
      .expect(400);
  });

  it('оформляет заказ: цену и доставку считает сервер, присланные цены не принимаются', async () => {
    const item = { productId: sofa.id, mainMaterialId: sofa.defaults.mainMaterialId, sizeId: sofa.defaults.sizeId, quantity: 1 };
    await api().post('/api/orders').set(auth(clientToken)).send(orderBody([{ ...item, unitPrice: 1 }])).expect(400);

    const res = await api().post('/api/orders').set(auth(clientToken)).send(orderBody([item])).expect(201);
    expect(res.body).toMatchObject({ status: 'NEW', subtotal: 8900, deliveryPrice: 0, total: 8900 });
    expect(res.body.number).toMatch(/^LX-\d{4}-\d{4}$/);
    orderNumber = res.body.number;
  });

  it('показывает заказ в «Моих заказах» и по номеру с телефоном', async () => {
    const mine = await api().get('/api/me/orders').set(auth(clientToken)).expect(200);
    const order = mine.body.items.find((item: { number: string }) => item.number === orderNumber);
    expect(order.history).toEqual([expect.objectContaining({ status: 'NEW', label: 'Принят' })]);
    orderId = order.id;

    await api().get('/api/orders/track').query({ number: orderNumber, phone: clientPhone }).expect(200);
    await api().get('/api/orders/track').query({ number: orderNumber, phone: '+992 90 000 00 00' }).expect(404);
  });

  it('не пускает без токена (401) и клиента в админку (403)', async () => {
    await api().get('/api/admin/orders').expect(401);
    await api().get('/api/admin/orders').set(auth('not-a-token')).expect(401);
    await api().get('/api/admin/orders').set(auth(clientToken)).expect(403);
    await api().get('/api/me/orders').expect(401);
  });

  it('админ входит и меняет этап заказа, клиент видит новый этап', async () => {
    const login = await api().post('/api/auth/login').send({ login: 'Администратор', password: process.env.ADMIN_PASSWORD }).expect(200);
    adminToken = login.body.accessToken;
    expect(login.body.user.role).toBe('ADMIN');

    await api().patch(`/api/admin/orders/${orderId}/status`).send({ status: 'FRAME' }).expect(401);
    const res = await api().patch(`/api/admin/orders/${orderId}/status`).set(auth(adminToken)).send({ status: 'FRAME' }).expect(200);
    expect(res.body.status).toBe('FRAME');

    const mine = await api().get(`/api/me/orders/${orderNumber}`).set(auth(clientToken)).expect(200);
    expect(mine.body.status).toBe('FRAME');
    expect(mine.body.history.map((entry: { status: string }) => entry.status)).toEqual(['NEW', 'FRAME']);

    // Назад нельзя, отменить самому после начала работы — тоже
    await api().patch(`/api/admin/orders/${orderId}/status`).set(auth(adminToken)).send({ status: 'NEW' }).expect(400);
    await api().post(`/api/me/orders/${orderNumber}/cancel`).set(auth(clientToken)).expect(409);
  });

  it('клиент оставляет один отзыв, рейтинг пересчитывается', async () => {
    const res = await api()
      .post(`/api/products/${sofa.id}/reviews`)
      .set(auth(clientToken))
      .send({ rating: 4, text: 'Хороший диван, доставили вовремя.' })
      .expect(201);
    expect(res.body.authorName).toBe('Зарина');
    await api().post(`/api/products/${sofa.id}/reviews`).set(auth(clientToken)).send({ rating: 5, text: 'Ещё один отзыв на тот же товар' }).expect(409);

    const reviews = await api().get(`/api/products/${sofa.id}/reviews`).expect(200);
    expect(reviews.body.reviewsCount).toBe(2);
    expect(reviews.body.ratingAvg).toBe(4.5);
  });

  it('добавляет товар в избранное и убирает его', async () => {
    await api().post(`/api/me/wishlist/${sofa.id}`).set(auth(clientToken)).expect(201);
    await api().post(`/api/me/wishlist/${sofa.id}`).set(auth(clientToken)).expect(201);
    const list = await api().get('/api/me/wishlist').set(auth(clientToken)).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].product.slug).toBe('divan-orom');

    await api().delete(`/api/me/wishlist/${sofa.id}`).set(auth(clientToken)).expect(200);
    const empty = await api().get('/api/me/wishlist').set(auth(clientToken)).expect(200);
    expect(empty.body).toHaveLength(0);
  });

  it('админ создаёт товар, меняет цену и удаляет его', async () => {
    const created = await api()
      .post('/api/admin/products')
      .set(auth(adminToken))
      .send({
        slug: 'divan-test',
        sku: 'LX-999',
        name: 'Диван трёхместный',
        categoryId: 1,
        basePrice: 8900,
        kind: 'FABRIC',
        room: 'LIVING',
        productionDays: 14,
        model3dKey: 'sofa',
        materials: [{ materialId: sofa.defaults.mainMaterialId, role: 'MAIN', isDefault: true }],
        sizes: [{ label: '210 см', widthCm: 210, heightCm: 85, depthCm: 95, isDefault: true }],
      })
      .expect(201);
    const id = created.body.id;
    expect(created.body.widthCm).toBe(210);

    const duplicate = { slug: 'divan-test', sku: 'LX-998', name: 'Копия', categoryId: 1, basePrice: 100, kind: 'FABRIC', room: 'LIVING', widthCm: 200, productionDays: 5, model3dKey: 'sofa' };
    await api().post('/api/admin/products').set(auth(adminToken)).send(duplicate).expect(409);

    const updated = await api().patch(`/api/admin/products/${id}`).set(auth(adminToken)).send({ basePrice: 7900, oldPrice: 8900 }).expect(200);
    expect(updated.body).toMatchObject({ basePrice: 7900, oldPrice: 8900 });
    await api().patch(`/api/admin/products/${id}`).set(auth(adminToken)).send({ oldPrice: 100 }).expect(400);

    const removed = await api().delete(`/api/admin/products/${id}`).set(auth(adminToken)).expect(200);
    expect(removed.body).toMatchObject({ deleted: true, hidden: false });
    await api().get(`/api/admin/products/${id}`).set(auth(adminToken)).expect(404);
  });

  it('товар из заказов не удаляется, а скрывается', async () => {
    const res = await api().delete(`/api/admin/products/${sofa.id}`).set(auth(adminToken)).expect(200);
    expect(res.body).toMatchObject({ deleted: false, hidden: true });
    await api().get('/api/products/divan-orom').expect(404);
    await api().patch(`/api/admin/products/${sofa.id}`).set(auth(adminToken)).send({ isActive: true }).expect(200);
  });

  it('не удаляет категорию с товарами и занятый slug', async () => {
    await api().delete('/api/admin/categories/1').set(auth(adminToken)).expect(409);
    await api().post('/api/admin/categories').set(auth(adminToken)).send({ slug: 'divany', name: 'Диваны 2' }).expect(409);
  });

  it('загружает фото, отдаёт его по ссылке и удаляет', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const uploaded = await api().post('/api/admin/uploads/image').set(auth(adminToken)).attach('file', png, 'dot.png').expect(201);
    expect(uploaded.body.url).toMatch(/^\/uploads\/images\/[a-f0-9]+\.png$/);
    await api().get(uploaded.body.url).expect(200);

    await api().post('/api/admin/uploads/image').set(auth(adminToken)).attach('file', Buffer.from('hello'), 'notes.txt').expect(400);
    await api().delete('/api/admin/uploads').query({ url: uploaded.body.url }).set(auth(adminToken)).expect(200);
    await api().delete('/api/admin/uploads').query({ url: uploaded.body.url }).set(auth(adminToken)).expect(404);
  });

  it('удаляет только отменённый заказ', async () => {
    await api().delete(`/api/admin/orders/${orderId}`).set(auth(adminToken)).expect(409);
    await api().patch(`/api/admin/orders/${orderId}/status`).set(auth(adminToken)).send({ status: 'CANCELLED' }).expect(200);
    await api().delete(`/api/admin/orders/${orderId}`).set(auth(adminToken)).expect(200);
  });

  it('показывает админу обзор, клиентов и настройки', async () => {
    const stats = await api().get('/api/admin/stats').set(auth(adminToken)).expect(200);
    expect(stats.body.revenueByMonth).toHaveLength(6);
    const clients = await api().get('/api/admin/clients').set(auth(adminToken)).expect(200);
    expect(clients.body.total).toBeGreaterThanOrEqual(2);

    await api().patch('/api/admin/settings').set(auth(adminToken)).send({ deliveryPrice: 200 }).expect(200);
    const settings = await api().get('/api/settings/public').expect(200);
    expect(settings.body.deliveryPrice).toBe(200);
  });

  it('меняет пароль: старый токен перестаёт действовать', async () => {
    const created = await api()
      .post('/api/auth/register')
      .send({ name: 'Тимур', email: 'timur@gmail.com', password: 'timur12345' })
      .expect(201);
    const oldToken = created.body.accessToken;

    await api().patch('/api/auth/password').send({ currentPassword: 'timur12345', newPassword: 'timur-new-1' }).expect(401);
    const wrong = await api().patch('/api/auth/password').set(auth(oldToken)).send({ currentPassword: 'nope', newPassword: 'timur-new-1' }).expect(400);
    expect(wrong.body.message).toBe('Текущий пароль введён неверно');

    // Смена пароля в ту же секунду, что и выдача токена, не отличается — ждём следующую секунду
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const changed = await api().patch('/api/auth/password').set(auth(oldToken)).send({ currentPassword: 'timur12345', newPassword: 'timur-new-1' }).expect(200);

    const old = await api().get('/api/auth/me').set(auth(oldToken)).expect(401);
    expect(old.body.message).toBe('Пароль был изменён — войдите заново');
    await api().get('/api/auth/me').set(auth(changed.body.accessToken)).expect(200);
    await api().post('/api/auth/login').send({ login: 'Тимур', password: 'timur12345' }).expect(401);
    await api().post('/api/auth/login').send({ login: 'timur@gmail.com', password: 'timur-new-1' }).expect(200);
  });

  it('восстанавливает забытый пароль по коду из письма', async () => {
    const send = jest.spyOn(app.get(MailService), 'send').mockResolvedValue();

    // Для незнакомого email ответ тот же, но письмо не отправляется
    const unknown = await api().post('/api/auth/forgot-password').send({ email: 'nobody@gmail.com' }).expect(200);
    expect(send).not.toHaveBeenCalled();

    const known = await api().post('/api/auth/forgot-password').send({ email: 'Timur@Gmail.com' }).expect(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('timur@gmail.com');
    const code = mail.text.match(/\b\d{6}\b/)![0];

    const wrongCode = code === '000000' ? '111111' : '000000';
    await api().post('/api/auth/reset-password').send({ email: 'timur@gmail.com', code: wrongCode, newPassword: 'timur-reset-1' }).expect(400);
    const reset = await api().post('/api/auth/reset-password').send({ email: 'timur@gmail.com', code, newPassword: 'timur-reset-1' }).expect(200);
    expect(reset.body.user.name).toBe('Тимур');

    // Код одноразовый
    await api().post('/api/auth/reset-password').send({ email: 'timur@gmail.com', code, newPassword: 'timur-reset-2' }).expect(400);
    await api().post('/api/auth/login').send({ login: 'Тимур', password: 'timur-reset-1' }).expect(200);
    send.mockRestore();
  });

  // Последним: после него лимит заказов с этого IP исчерпан на минуту
  it('не даёт оформить больше 5 заказов в минуту с одного IP', async () => {
    const item = { productId: sofa.id, mainMaterialId: sofa.defaults.mainMaterialId, quantity: 1 };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await api().post('/api/orders').send(orderBody([item]))).status);
    }
    expect(statuses).toContain(429);
  });
});
