# Flight booking site — v7

> **Запуск, API-ключі та розгортання — у [SETUP.md](SETUP.md).**
> Цей файл описує, як влаштований код.

Структура й механіка взяті з чинного туристичного сайту, але айдентика,
тексти, графіка й бренд у цій версії власні. Назва, домен, пошта, телефони й
соцмережі задаються в `.env` і підставляються в сторінки на рендері —
у розмітці брендових рядків більше немає.

37 сторінок, власний Node.js-бекенд, який обслуговує всі динамічні ендпоінти і
підключається до постачальника авіаквитків через єдиний інтерфейс: **Duffel**
(активний), **TripJack**, **Amadeus** або вбудований **mock**.

## Що всередині

```
server.js                 Express: статичні сторінки за slug + усі AJAX/POST-ендпоінти оригіналу
src/config.js             налаштування з .env
src/providers/duffel.js   Duffel (offer_requests + offers, підтвердження ціни) — АКТИВНИЙ
src/providers/amadeus.js  Amadeus Self-Service — портал закрито 17.07.2026, ключі недоступні
src/providers/tripjack.js TripJack B2B (air-search-all, review) — той, через який бронює live-сайт
src/providers/mock.js     детерміновані фейкові результати для роботи без ключів
src/providers/index.js    вибір провайдера (FLIGHT_PROVIDER) + опис уніфікованої моделі offer
src/offers.js             фільтри / сортування / статистика для сайдбару
src/render.js             HTML-фрагменти: картки рейсів, фільтри, сорт-бар, booking, thank-you
src/pricing.js            ЦІНОВА ПОЛІТИКА (комісія, націнка, купони) — місце для вашої бізнес-логіки
src/data.js               довідники аеропортів / авіакомпаній (автокомпліт)
src/templates.js          завантаження pages/*.html і підстановка {{PLACEHOLDER}}
pages/                    дзеркало всіх сторінок (+ 4 шаблони у pages/airline/)
public/                   дзеркало assets: css, js, зображення, прапорці, лого авіакомпаній
data/airports.json        4 030 аеропортів (OurAirports), data/airlines.json — 992 авіакомпанії
data/leads/, data/bookings/   заявки з форм і бронювання (JSON, створюються автоматично)
```

## Запуск

```bash
npm install
cp .env.example .env      # за потреби впишіть ключі
npm start                 # http://localhost:3000
```

Без ключів працює `FLIGHT_PROVIDER=mock`: пошук, фільтри, сортування, «Load More», сторінка
бронювання та підтвердження повністю робочі.

## Підключення справжнього API

Живий сайт побудований на CodeIgniter і має **два** модулі постачальників (це видно з його
стек-трейсу `RequestAmadeusParam.php` та зі скрипта booking-сторінки, який читає
`tripInfos[0].totalPriceList[0].fd.ADULT.fC.TF / 61.43` — формат відповіді TripJack).

### Duffel (підключено і перевірено на живому API)
1. Зареєструйтесь на duffel.com, увімкніть **Developer test mode**, далі
   назва організації → **Developers** → **Access tokens** → **New token** (scope Read write).
2. У `.env`: `FLIGHT_PROVIDER=duffel`, `DUFFEL_ACCESS_TOKEN=duffel_test_...`.
3. Пошук двокроковий: `POST /air/offer_requests?return_offers=false`, далі
   `GET /air/offers?offer_request_id=..&sort=total_amount&limit=N`. Це навмисно: inline-режим
   повертає всі пропозиції (2 пасажири LHR-JFK туди-назад = 1326 офферів, 18 МБ).
4. Пропозиції Duffel «протухають» приблизно за 30 хвилин, тому при відкритті сторінки
   бронювання ціна перезапитується через `GET /air/offers/{id}`.
5. Валюта: Duffel віддає ціни у **валюті рахунку вашої організації** (змінюється в їхньому
   дашборді), параметра валюти в запиті немає. Інтерфейс показує валюту оффера.

### Amadeus (наразі непридатний)
Self-Service портал Amadeus **закрито 17 липня 2026**, ключі деактивовано, реєстрацію припинено.
Адаптер `src/providers/amadeus.js` лишається в коді й протестований на синтетичних даних, але
отримати ключ самостійно більше неможливо. Лишився тільки Amadeus Enterprise/AQC через відділ
продажів, і він має інші ендпоінти, тож адаптер довелося б переписувати.

### TripJack
Партнерський B2B API (ключ видає TripJack після договору). `FLIGHT_PROVIDER=tripjack`,
`TRIPJACK_API_KEY=...`, `TRIPJACK_BASE_URL` (test: `https://apitest.tripjack.com`).
Ціни приходять в INR і діляться на `TRIPJACK_FX_DIVISOR` (як на оригіналі: 61.43 → CAD).
Адаптер написаний за публічною структурою API TripJack і **не перевірявся на живому ключі** —
звірте назви полів з документацією, яку отримаєте разом із ключем.

### Виписка квитків
Оригінал працює як call-centre lead flow: після «PROCEED TO PAY» заявка зберігається, а агент
телефонує клієнту. Так само робить ця копія (`data/bookings/*.json`). Автоматичну виписку
(Amadeus Flight Create Orders / TripJack `oms/v1/air/book`) підключайте у `confirmBooking()`
в `server.js`, коли буде тікетинговий контракт.

## Мапа ендпоінтів (той самий контракт, що й в оригінальному фронтенді)

| Оригінал | Тут | Що робить |
|---|---|---|
| `POST /airline/searchflight` | те саме | зберігає пошук у сесії, показує сторінку результатів |
| `GET /airline/flightResponse/:i` | те саме | HTML-фрагмент з 10 картками від зсуву `i` |
| `GET /airline/getFilter`, `/getsortdata` | те саме | сайдбар фільтрів, блок Earliest/Cheapest/Fastest |
| `POST /airline/get*Filter`, `/resultsortdata`, `/multiple_filter` | те саме | фільтри/сортування → фрагмент |
| `POST /flightname`, `/preferairline`, `GET /city` | те саме (+ під `/airline/`, `/tour/`) | автокомпліт аеропортів/авіакомпаній |
| `POST /airline/booking`, `/airline/returnbooking` | те саме | сторінка бронювання (one-way / round) |
| `POST /confirmbooking`, `/returnbookingthanks` | те саме | збереження заявки + сторінка подяки |
| `POST /sendmail`, `/quickcallrequest`, `/thankyouuser`, `/couponthanks`, `/applucoupon` | те саме | ліди → `data/leads/`, купони → `src/pricing.js` |

## Що змінено відносно оригіналу (свідомо)

- Вирізано Google Tag Manager власника (`GTM-K3N3DVF8`) і Cloudflare-обфускацію email.
- Font Awesome Kit (прив'язаний до домену власника) замінено на публічний FA 6 Free + shim для `fa-sharp`.
- Лого авіакомпаній: 143 дзеркальних + fallback на `pics.avs.io` для решти.
- Пошук зроблено за схемою POST→redirect→GET, щоб F5 не повторював форму.
- Прихована форма пасажирів (desktop/mobile) вимикається JS-ом, щоб не блокувати submit `required`-полями.

## Перед публікацією під своїм брендом

Тексти, зображення, назва, телефони та адреса в `pages/` належать Xtreme Fares Ltd. — замініть
їх на власні (`SITE_NAME`, `SITE_PHONE`, `SITE_EMAIL` у `.env` покривають лише бекенд).
Задайте власний `SESSION_SECRET`. Сесія зберігається в підписаній cookie (`src/session.js`),
тому окремий стор сесій не потрібен навіть на serverless.
