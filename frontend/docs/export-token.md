# Export Token

A token format for sharing validated data between applications.

## What It Is

An export token is a signed payload containing validated spreadsheet data. It allows a consuming application to verify the data originated from Sheet Processor and hasn't been tampered with.

## Token Format

The token is a Base64URL-encoded JSON string:

```
base64url(JSON.stringify({ payload, signature }))
```

## Token Structure

```typescript
interface ExportToken {
  payload: {
    data: Array<RowData>       // The validated rows
    metadata: {
      row_count: number         // Number of rows
      columns: string[]         // Column names (canonical)
      valid: boolean            // Whether validation passed
      validated_at: string      // ISO timestamp
      source: "sheet-processor" // Token origin
    }
  }
  signature: string             // "hmac-sha256:<hex>"
}

interface RowData {
  [column: string]: string | number | null
}
```

## Canonical Data

Data in the token is transformed to canonical form:

- **Headers**: Aliased to canonical names (e.g., `"Full Name"` → `"name"`)
- **Genders**: Aliased to canonical values (e.g., `"m"` → `"Male"`)
- **Unmapped columns**: Removed from output

## Verification

Both apps share a secret key (`VITE_SIGNING_SECRET`).

### Step 1: Decode Token

```javascript
function decodeToken(token) {
  // Convert Base64URL to Base64
  const base64 = token.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  
  // Decode Base64 to binary string
  const binary = atob(padded)
  
  // Convert binary string to UTF-8 (handles non-ASCII characters)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const json = new TextDecoder().decode(bytes)
  
  return JSON.parse(json)
}
```

### Step 2: Verify Signature

```javascript
async function verifySignature(token, secret) {
  const decoded = decodeToken(token)
  
  // Extract signature
  if (!decoded.signature.startsWith('hmac-sha256:')) {
    return { valid: false, error: 'Invalid signature format' }
  }
  const signatureHash = decoded.signature.replace('hmac-sha256:', '')
  
  // Recompute signature
  const canonicalPayload = canonicalize(decoded.payload)
  const expectedSignature = await hmacSha256(secret, canonicalPayload)
  
  if (signatureHash !== expectedSignature) {
    return { valid: false, error: 'Signature verification failed' }
  }
  
  return { valid: true, payload: decoded.payload }
}

function canonicalize(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

async function hmacSha256(secret, data) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### Step 3: Use Data

```javascript
const result = await verifySignature(token, sharedSecret)
if (result.valid) {
  console.log('Row count:', result.payload.metadata.row_count)
  console.log('Columns:', result.payload.metadata.columns)
  console.log('Data:', result.payload.data)
}
```

## Example Token

**Encoded Token:**
```
eyJwYXlsb2FkIjp7ImRhdGEiOlt7Im5hbWUiOiLZhNmF2Ykg2YXYrdmF2K8g2K3ZhdivINin2YTYtNin2YrYuSIsInVuaXZlcnNpdHkgaWQiOjQyMjIwNTc1NiwicGhvbmUgbnVtYmVyIjo1NjkwMTk1NTUsImVtYWlsIjoiTGFtYXNoYXllYTBAZ21haWwuY29tIiwiZ2VuZGVyIjoiRmVtYWxlIn0seyJuYW1lIjoi2KrZhNmJINi12KfZhNitINiz2YTZitmF2KfZhiDYp9mE2YHZiNiy2KfZhiIsInVuaXZlcnNpdHkgaWQiOjQ1MTIwMzUxMywicGhvbmUgbnVtYmVyIjo1NTkwOTg3OTcsImVtYWlsIjoidG9vbGEuc2FsZWhAZ21haWwuY29tIiwiZ2VuZGVyIjoiRmVtYWxlIn0seyJuYW1lIjoi2KjYp9ix2YLYqSDZhdit2YXYryDYp9mE2KzYp9ix2KfZhNmE2YciLCJ1bml2ZXJzaXR5IGlkIjo0MzEyMDE3ODksInBob25lIG51bWJlciI6NTYyOTg4MDk4LCJlbWFpbCI6IkJhcmlxYTAwQGdtYWlsLmNvbSIsImdlbmRlciI6IkZlbWFsZSJ9LHsibmFtZSI6Itis2YjYsdmKINi12KfZhNitINin2YTZgdi22YQiLCJ1bml2ZXJzaXR5IGlkIjo0NTEyMDM0NjQsInBob25lIG51bWJlciI6NTYxNjg3NzM1LCJlbWFpbCI6Ikpvb3J5NDQ2MUBnbWFpbC5jb20iLCJnZW5kZXIiOiJGZW1hbGUifSx7Im5hbWUiOiLYp9mF2YQg2LPYudmI2K8g2KfZhNi52YbYstmKICIsInVuaXZlcnNpdHkgaWQiOjQ0MTAwMzU2MiwicGhvbmUgbnVtYmVyIjo1Mzk1MzYyMzUsImVtYWlsIjoiYWFtbGxsbGxsbDk5OEBnbWFpbC5jb20iLCJnZW5kZXIiOiJGZW1hbGUifSx7Im5hbWUiOiLZhdmG2YrYsdmHINin2KjYsdin2YfZitmFINin2YTYqNmE2YrZh9mKIiwidW5pdmVyc2l0eSBpZCI6NDQzMjEzMDY1LCJwaG9uZSBudW1iZXIiOjUwMDU1MjYxNywiZW1haWwiOiJtbm9hYnJhOTk5QGdtYWlsLmNvbSIsImdlbmRlciI6IkZlbWFsZSJ9LHsibmFtZSI6ItmB2KfZhCDYudio2K_Yp9mE2YTZhyDYrdmF2K8g2KfZhNiz2YPYp9mD2LEiLCJ1bml2ZXJzaXR5IGlkIjo0NTEyMDM1MTUsInBob25lIG51bWJlciI6NTU3OTYzMDUwLCJlbWFpbCI6IkZhYWFsMTQyNkBnbWFpbC5jb20iLCJnZW5kZXIiOiJNYWxlIn1dLCJtZXRhZGF0YSI6eyJyb3dfY291bnQiOjcsImNvbHVtbnMiOlsibmFtZSIsInVuaXZlcnNpdHkgaWQiLCJwaG9uZSBudW1iZXIiLCJlbWFpbCIsImdlbmRlciJdLCJ2YWxpZCI6dHJ1ZSwidmFsaWRhdGVkX2F0IjoiMjAyNi0wMy0yMlQxODozNjo1Ny4xMTBaIiwic291cmNlIjoic2hlZXQtcHJvY2Vzc29yIn19LCJzaWduYXR1cmUiOiJobWFjLXNoYTI1NjpiNWNiNTBlNzlkZDYxMWM4YTMyM2IwOTRhY2E1ZGVmYjNjMGRjYTM1ZjA5OTZkZjI5MzU5YjIyODc2YzkyZDA4In0
```

**Decoded Structure:**

```json
{
  "payload": {
    "data": [
      {"name": "لمى محمد حمد الشايع", "university id": 422205756, "phone number": 569019555, "email": "Lamashayea0@gmail.com", "gender": "Female"},
      {"name": "تلى صالح سليمان الفوزان", "university id": 451203513, "phone number": 559098797, "email": "toola.saleh@gmail.com", "gender": "Female"},
      {"name": "بارقة محمد الجارالله", "university id": 431201789, "phone number": 562988098, "email": "Bariqa00@gmail.com", "gender": "Female"},
      {"name": "جوري صالح الفضل", "university id": 451203464, "phone number": 561687735, "email": "Joory4461@gmail.com", "gender": "Female"},
      {"name": "امل سعود العنزي", "university id": 441003562, "phone number": 539536235, "email": "aammllllll998@gmail.com", "gender": "Female"},
      {"name": "منيره ابراهيم البليهي", "university id": 443213065, "phone number": 500552617, "email": "mnoabra999@gmail.com", "gender": "Female"},
      {"name": "فال عبدالله حمد السكاكر", "university id": 451203515, "phone number": 557963050, "email": "Faaal1426@gmail.com", "gender": "Male"}
    ],
    "metadata": {
      "row_count": 7,
      "columns": ["name", "university id", "phone number", "email", "gender"],
      "valid": true,
      "validated_at": "2026-03-22T18:36:57.110Z",
      "source": "sheet-processor"
    }
  },
  "signature": "hmac-sha256:b5cb50e79dd611c8a323b094aca5defb3c0dca35f0996df293599b22876c92d08"
}
```

**Verification Result:**

| Field | Value |
|-------|-------|
| Signature Valid | ✅ |
| Source | sheet-processor |
| Status | Validated |
| Row Count | 7 |
| Validated At | 2026-03-22T18:36:57.110Z |
| Columns | name, university id, phone number, email, gender |

**Data Sample (first row):**

| name | university id | phone number | email | gender |
|------|--------------|--------------|-------|--------|
| لمى محمد حمد الشايع | 422205756 | 569019555 | Lamashayea0@gmail.com | Female |

> **Note**: Arabic names and other non-ASCII characters are properly supported via UTF-8 encoding.

---

## Notes

- Tokens are not encrypted - only signed
- Data can be read without verification, but verification proves authenticity
- Both apps must use the same secret key
- Canonicalization ensures consistent signature verification
- **UTF-8**: Both encoding and decoding must use proper UTF-8 handling (not raw `btoa`/`atob`)
  - Encoding: `TextEncoder` → bytes → binary string → Base64
  - Decoding: Base64 → binary string → bytes → `TextDecoder`

## UTF-8 Safe Encoding (Reference)

When creating tokens, use this approach to handle non-ASCII characters:

```javascript
function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str)
  const binaryString = Array.from(bytes, b => String.fromCodePoint(b)).join('')
  return btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}