# API Referansı

## Base URL

```
https://your-app.vercel.app/api
```

## Authentication

API anahtarı `Authorization: Bearer <key>` header'ı ile gönderilir. (Opsiyonel)

---

## Merge İşlemleri

### Merge Başlat

Merge işlemini başlatır ve job ID döndürür.

**POST** `/api/merge`

**Request Body:**
```json
{
  "packs": [
    { "type": "url", "url": "https://example.com/faithful.zip" },
    { "type": "url", "url": "https://example.com/optifine.zip" }
  ],
  "priority": ["faithful", "optifine"],
  "autoResolve": true,
  "output": {
    "name": "merged-pack",
    "description": "Birleştirilmiş resource pack",
    "packFormat": 42
  },
  "plugins": [
    { "name": "meta-fixer", "enabled": true }
  ]
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "status": "processing",
    "progress": { "current": 0, "total": 150, "phase": "reading" },
    "downloadUrl": "/api/merge/abc123/download"
  }
}
```

---

### Merge Durumu Sorgula

**GET** `/api/merge/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "status": "completed",
    "progress": { "current": 150, "total": 150, "phase": "done" },
    "conflicts": [
      { "filePath": "assets/minecraft/textures/block/stone.png", "sources": [] }
    ],
    "downloadUrl": "/api/merge/abc123/download"
  }
}
```

---

### Merge Sonucunu İndir

**GET** `/api/merge/:id/download`

304 byte'dan büyük pack'ler için **Vercel Blob** storage kullanılır, küçük pack'ler direkt response olarak döner.

**Response:** `application/zip`

---

### Merge Job Sil

**DELETE** `/api/merge/:id`

**Response:**
```json
{ "success": true, "data": { "deleted": true } }
```

---

### Metadata Güncelle

**PUT** `/api/merge/:id/metadata`

**Request Body:**
```json
{
  "description": "Yeni açıklama",
  "packFormat": 42
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "abc123", "updated": true, "metadata": { "description": "Yeni açıklama", "packFormat": 42 } }
}
```

---

### Conflict Çözümü Gönder

**POST** `/api/merge/:id/resolve`

**Request Body:**
```json
{
  "resolutions": {
    "assets/minecraft/textures/block/stone.png": "pack_id_1",
    "assets/minecraft/textures/block/dirt.png": "pack_id_2"
  }
}
```

**Response:**
```json
{ "success": true, "data": { "id": "abc123", "resolved": true, "resolutionCount": 2 } }
```

---

## Pack Yönetimi

### Pack Yükle (URL ile)

**POST** `/api/packs`

**Request Body:**
```json
{ "url": "https://example.com/pack.zip" }
```

**Response (201):**
```json
{
  "success": true,
  "data": { "id": "pack_123", "name": "pack", "fileCount": 150, "source": "https://example.com/pack.zip" }
}
```

### Pack Yükle (File Upload ile)

**POST** `/api/packs`

`multipart/form-data` ile `pack` alanında .zip dosyası gönderilir.

---

## Plugin Yönetimi

### Plugin'leri Listele

**GET** `/api/plugins`

### Plugin Ekle

**POST** `/api/plugins`

```json
{ "name": "meta-fixer", "version": "1.0.0", "description": "Metadata düzeltme plugin'i" }
```

---

## Hata Kodları

| HTTP | Code | Açıklama |
|---|---|---|
| 400 | `NO_PACKS` | En az bir pack gönderilmeli |
| 400 | `INVALID_PACK` | Geçersiz pack formatı |
| 400 | `FETCH_FAILED` | URL'den pack çekilemedi |
| 400 | `INVALID_INPUT` | Geçersiz istek formatı |
| 400 | `PLUGIN_EXISTS` | Plugin zaten kayıtlı |
| 404 | `NOT_FOUND` | Job veya pack bulunamadı |
| 500 | `MERGE_FAILED` | Merge işlemi başarısız |
| 500 | `UPLOAD_FAILED` | Pack yükleme başarısız |

Tüm hata yanıtları:
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "İnsan tarafından okunabilir hata mesajı" }
}
```
