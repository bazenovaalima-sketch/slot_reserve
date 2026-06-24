# Aigerim's Beauty Salon — онлайн-запись

- 🔗 **Живой прототип:** https://slot-jet.vercel.app — `/aigerim` (клиент) · `/admin` (студия)

<p>
  <img src="docs/screens/00-landing.png" width="200">
  <img src="docs/screens/05-deposit.png" width="200">
  <img src="docs/screens/06-success.png" width="200">
</p>

## Что внутри

Острый wedge: **ссылка-запись + единый календарь без накладок**. Клиент записывается сам, видит только реально свободное время, система физически не даёт двойную бронь, мастер видит свой день.

| | |
|---|---|
| Флоу клиента | услуга → мастер → дата/время → контакты → подтверждение |
| Кабинет студии | день по мастерам, отмена / неявка / выполнено |
| Защита | анти-накладка в транзакции, расчёт доступности на сервере |

## Стек

Next.js 16 (App Router, Server Actions) · React 19 · Prisma 7 · Postgres (Neon) · Tailwind v4.

## Локальный запуск

```bash
cd slot
npm install
# в .env положить DATABASE_URL (Postgres / Neon)
npm run db:push      # схема в БД
npm run db:seed      # демо-данные: студия Айгерим, 3 мастера, услуги
npm run dev          # http://localhost:3000
```

Маршруты: `/` — лендинг, `/aigerim` — запись (глазами клиента), `/admin` — кабинет студии.
