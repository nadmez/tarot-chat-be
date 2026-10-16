# Sunucu Geliştirme Yapılacaklar

> Not: Sunucu `features/` yapısına taşındı. Aşağıdaki eski dosya yolları
> (`repositories/`, `services/`, `utils/`, `*.ts`) artık şu karşılıklara
> sahiptir: `features/chat/history.js`, `features/chat/index.js`,
> `lib/supabase.js`, `lib/i18n.js`.

## İ18n (Uluslararasılaştırma) Desteği

- [x] i18n desteği ekle
- [x] En az iki dil için dil tanım dosyaları ekle (Türkçe ve İngilizce)
- [x] Varsayılan dili Türkçe olarak belirle
- [x] Server klasörü altındaki dosyaları tara ve bulduğun metinleri dil tanım dosyalarına ekle
- [x] Kod içinde dil anahtarlarını kullan
- [x] i18n kütüphanesini, dili gelen requestin içinden cookie ve veya headerlar yardımıyla anlayıp otomatik değiştireceği şekilde ayarla

## Supabase Veri Saklama Katmanı

- [x] Supabase kullanarak veri saklama katmanı ekle
   - [x] package.json'a @supabase/supabase-js paketini ekle
   - [x] .env.example dosyasına SUPABASE_URL ve SUPABASE_KEY değişkenlerini ekle
   - [x] Supabase client'ı initialize eden utils/supabase.ts dosyası oluştur
   - [x] conversations tablosunun şemasını Supabase'de oluştur (id, conversation_id, last_response_id, created_at, updated_at)
   - [x] messages tablosunun şemasını Supabase'de oluştur (id, conversation_id, user_prompt, ai_response, created_at)
   - [ ] repositories/conversations.ts dosyasını Supabase entegrasyonu ile güncelleştir
   - [ ] repositories/messages.ts dosyası oluştur (mesaj geçmişini saklama için)
   - [ ] types/database.ts dosyası oluştur (Supabase table type tanımları için)
   - [ ] services/chatService.ts'yi güncelleştir (mesaj geçmişini Supabase'e kaydetmek için)
   - [ ] Sohbet geçmişini getiren yeni endpoint ekle (/api/conversations/:conversationId/messages)
   - [ ] Error handling ve validation kurallarını dil dosyalarına ekle

## JSON Web Token (JWT) Otantikasyonu

- [ ] JWT kullanarak otantikasyon yapılması
   - [ ] package.json'a jsonwebtoken paketini ekle
   - [ ] .env.example dosyasına JWT_SECRET değişkenini ekle
   - [ ] utils/jwt.ts dosyası oluştur (token oluşturma ve doğrulama fonksiyonları için)
   - [ ] Kullanıcı login endpoint'i ekle (/api/auth/login)
   - [ ] Token refresh endpoint'i ekle (/api/auth/refresh)
   - [ ] JWT middleware oluştur ve korunan route'lara ekle
   - [ ] Token payload'ına user id ve rol bilgisini ekle
   - [ ] Token expiration süresi belirle (access token: 15 dakika, refresh token: 7 gün)
   - [ ] Dil dosyalarına JWT ile ilgili hata mesajlarını ekle

## Model Geliştirmeleri

- [ ] `services/chatService.ts` dosyasında kullanılan `gpt-4o-mini` modelini daha gelişmiş bir OpenAI modeline (örneğin `gpt-4o`) yükselt.

## Veri Yönetimi

- [ ] Tüm tarot kartı tanımlarının (isim, düz/ters anlamları, görsel referansları vb.) merkezi bir `.json` dosyası altında toplanması
