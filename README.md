# tarot_chat_be

Express 5 tabanlı API. Node 20.11+ ve npm ile çalışır. Saf JavaScript'tir
(`// @ts-check` + JSDoc); derleme adımı yoktur. Bağımsız bir projedir; sunucu
varsayılan olarak **3001** portunda çalışır.

## Kurulum

```bash
npm install
```

`.env` dosyası için `.env.example` dosyasına bakın (`PORT` varsayılanı 3001).

## Geliştirme

```bash
npm run dev
```

## Üretim

```bash
npm start
```

Üretimde ortam değişkenleri barındırma ortamı tarafından verilir; `start`
komutu `.env` dosyası aramaz.

## Test ve tip denetimi

```bash
npm test
npm run test:coverage
npm run typecheck
```

## Yapı

```
index.js            giriş noktası (i18n başlatır, dinlemeye başlar)
app.js              createApp(): Express uygulamasını kurar
features/<ad>/      her özellik kendi klasöründe (route + doğrulama + mantık)
lib/                paylaşılan istemciler (openai, supabase, i18n, port)
locales/            çeviri dosyaları (tr, en)
```

Bir özellik `features/<ad>/index.js` içindeki tek dosyayla başlar ve
`register(router)` fonksiyonunu dışa aktarır. Dosya büyüyüp zorlaşırsa
bölünür.

## `@` import takma adları

| Yazım            | Çözüldüğü yer            |
| ---------------- | ------------------------ |
| `@features/<ad>` | `features/<ad>/index.js` |
| `@lib/<ad>`      | `lib/<ad>.js`            |

Node `@` takma adlarını kendiliğinden tanımaz; küçük bir çözümleme kancası
(`alias-hooks.js`) bunu sağlar. Bu yüzden sunucu kodunu çalıştıran **her**
`node` komutu `--import ./register-aliases.js` ile başlamalıdır (`dev` ve
`start` betikleri bunu yapar). Bayrak unutulursa Node
`ERR_MODULE_NOT_FOUND` hatası verir. Barındırma ortamında bayrak yerine
`NODE_OPTIONS=--import=./register-aliases.js` kullanılabilir.

Takma adların tek kaynağı `aliases.js` dosyasıdır; `jsconfig.json` içindeki
`paths` alanı bununla birebir aynı olmalıdır (`aliases.test.js` bunu denetler).
Yeni takma ad eklerken `aliases.js` ve `jsconfig.json` birlikte güncellenir.
