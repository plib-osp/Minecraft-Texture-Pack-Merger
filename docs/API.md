# API Reference

## Base URL

```
https://your-app.vercel.app/api
```

## Authentication

API key is sent via `Authorization: Bearer <key>` header. (Optional)

---

## Merge Operations

### Start Merge

Initiates a merge job and returns the job ID.

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
    "description": "Merged resource pack",
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

### Check Merge Status

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

### Download Merge Result

**GET** `/api/merge/:id/download`

Packs larger than 304 bytes are stored via **Vercel Blob**; smaller packs are returned directly in the response.

**Response:** `application/zip`

---

### Delete Merge Job

**DELETE** `/api/merge/:id`

**Response:**
```json
{ "success": true, "data": { "deleted": true } }
```

---

### Update Metadata

**PUT** `/api/merge/:id/metadata`

**Request Body:**
```json
{
  "description": "Updated description",
  "packFormat": 42
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "abc123", "updated": true, "metadata": { "description": "Updated description", "packFormat": 42 } }
}
```

---

### Submit Conflict Resolution

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

## Pack Management

### Load Pack (via URL)

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

### Load Pack (via File Upload)

**POST** `/api/packs`

Send a .zip file in the `pack` field using `multipart/form-data`.

---

## Plugin Management

### List Plugins

**GET** `/api/plugins`

### Register Plugin

**POST** `/api/plugins`

```json
{ "name": "meta-fixer", "version": "1.0.0", "description": "Metadata fixer plugin" }
```

---

## Error Codes

| HTTP | Code | Description |
|---|---|---|
| 400 | `NO_PACKS` | At least one pack is required |
| 400 | `INVALID_PACK` | Invalid pack format |
| 400 | `FETCH_FAILED` | Failed to fetch pack from URL |
| 400 | `INVALID_INPUT` | Invalid request format |
| 400 | `PLUGIN_EXISTS` | Plugin already registered |
| 404 | `NOT_FOUND` | Job or pack not found |
| 500 | `MERGE_FAILED` | Merge operation failed |
| 500 | `UPLOAD_FAILED` | Pack upload failed |

All error responses follow this format:
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human-readable error message" }
}
```
