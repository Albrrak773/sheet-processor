# Sheet Processor

A FastAPI service to validate and process spreadsheet data from Google Sheets, file URLs, or raw CSV/TSV input.

## Architecture

### File Structure

```
app/
├── __init__.py
├── main.py              # FastAPI app entry point
├── config.py            # Configuration (env vars)
├── canonical.py         # Canonical header/alias management with resolver helpers
├── models.py            # Type aliases, constants, and Pydantic models
├── py.typed              # Type checker marker
├── db/
│   ├── __init__.py
│   ├── database.py          # SQLAlchemy async engine, session management
│   └── schema.py             # SQLModel table definitions
├── services/
│   ├── __init__.py
│   ├── data_extractor.py   # Extract data from sheets/files
│   ├── header_validator.py  # Validate column headers
│   └── row_validator.py     # Validate row data (empty columns, uni id format)
└── routers/
    ├── __init__.py
    ├── aliases.py          # Header/alias CRUD endpoints
    └── validation.py        # Sheet validation endpoint
```

### Key Components

#### Canonical (`app/canonical.py`)
Centralized management of canonical column names and aliases.
- Caches headers, aliases, and optional status for fast lookups
- `resolve_column_key(row, canonical_col)`: Returns the actual key in a row for a canonical name
- `get_row_value(row, canonical_col)`: Returns the value for a canonical column from a row
- `refresh_cache(session)`: Reloads cache from database

#### Database (`app/db/`)
- **schema.py**: Defines SQL tables
  - `Header`: Canonical column names (name, email, university_id, gender, phone)
  - `HeaderAlias`: Maps alternative names to headers (e.g., "e-mail" → "email")
- **database.py**: SQLAlchemy async engine setup, Uses SQLModel with async MySQL support.

#### Models (`app/models.py`)
Type aliases, constants, and Pydantic models:
- `RowData`, `ColumnName`: Type aliases for row data
- `DEFAULT_ALIASES`: Default alias mappings for seeding
- `ValidationResponse`: Validation results
- `InvalidRow`: Details about invalid data
- `SuggestedFix`: Suggested corrections

#### Services (`app/services/`)
**All functions are plain functions, not classes.**

- **data_extractor.py**: Extract spreadsheet data
  - `extract_from_google_sheet(url)`: Fetch from public Google Sheet (async)
  - `extract_from_file_url(url)`: Fetch and parse CSV/XLSX/TSV from URL (async)
  - `extract_from_raw(data)`: Parse raw CSV/TSV string (auto-detects format)

- **header_validator.py**: Validate column headers
  - `validate_headers(rows, ignore_headers)`: Check required columns exist
  - Resolves aliases from cache
  - Returns: (is_valid, missing_columns)

- **row_validator.py**: Validate row data
  - `validate_all_rows(rows)`: Check all rows for empty columns and format errors
  - Validates university id is 9 digits
  - Returns: (invalid_rows, details)

#### Routers (`app/routers/`)
- **validation.py**: `POST /validate` endpoint
  - Query params: `data_source` (URL or "raw"), `ignore_header` (repeatable)
  - Body: Plain text CSV/TSV when data_source="raw"
  - Returns: validation results

- **aliases.py**: Header and alias management
  - `GET /aliases/headers`: List all headers
  - `POST /aliases/headers`: Create new header
  - `DELETE /aliases/headers/{id}`: Delete header
  - `GET /aliases`: List all aliases
  - `POST /aliases`: Create new alias
  - `DELETE /aliases/{id}`: Delete alias
  - `POST /aliases/seed`: Populate default aliases

### Data Flow

1. **Input**: `data_source` query param (Google Sheet URL, file URL, or "raw")
2. **Extraction**: `data_extractor.py` fetches and converts to list of row dicts
3. **Validation**: `header_validator.py` checks columns against required set
4. **Response**: Returns validation results with missing columns

### Database Schema

See `app/db/schema.sql` for the full schema.

```sql
CREATE TABLE headers (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE header_aliases (
    id INT PRIMARY KEY,
    header_id INT DEFAULT NULL,
    alias_name VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (header_id) REFERENCES headers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

## Running

```bash
# Start MySQL container
docker-compose up -d

# Run the server
./run.py
# or
uv run python run.py
```

## API Endpoints

### Validation
- `POST /validate?data_source=<url_or_raw>` - Validate a sheet
  - Query params:
    - `data_source` (required): Google Sheet URL, file URL (.csv/.xlsx/.xls/.tsv), or "raw"
    - `ignore_header` (optional, repeatable): Headers to consider optional
  - Body: Plain text CSV/TSV data when `data_source=raw`

### Aliases
- `GET /aliases/headers` - List all headers
- `POST /aliases/headers` - Create a header
- `DELETE /aliases/headers/{id}` - Delete a header
- `GET /aliases` - List all aliases
- `POST /aliases` - Create an alias
- `DELETE /aliases/{id}` - Delete an alias
- `POST /aliases/seed` - Seed default aliases

## Development

- Type checking: `uv run basedpyright app/`
- Linting: `uv run ruff check app/`
- Run server: `uv run python run.py`
