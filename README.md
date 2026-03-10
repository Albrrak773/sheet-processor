# Sheet Processor

A FastAPI service to validate and process spreadsheet data from Google Sheets, uploaded files, or raw CSV/TSV input.

## Architecture

### File Structure

```
app/
├── __init__.py
├── main.py              # FastAPI app entry point,├── config.py            # Configuration (env vars)
├── types.py              # Type aliases and constants
├── py.typed              # Type checker marker
├── db/
│   ├── __init__.py
│   ├── database.py          # SQLAlchemy async engine, session management
│   └── schema.py             # SQLModel table definitions
├── models.py              # Pydantic request/response models
├── services/
│   ├── __init__.py
│   ├── data_extractor.py   # Extract data from sheets/files
│   └── header_validator.py  # Validate column headers
└── routers/
    ├── __init__.py
    ├── aliases.py          # Header/alias CRUD endpoints
    └── validation.py        # Sheet validation endpoint
```

### Key Components

#### Database (`app/db/`)
- **schema.py**: Defines SQL tables
  - `Header`: Canonical column names (name, email, university_id, gender, phone)
  - `HeaderAlias`: Maps alternative names to headers (e.g., "e-mail" → "email")
- **database.py**: SQLAlchemy async engine setup, Uses SQLModel with async MySQL support.

#### Models (`app/models.py`)
Pydantic models for API requests/responses:
- `ValidationRequest`: Input for validation
- `ValidationResponse`: Validation results
- `ColumnOptionalParams`: Which columns can be optional
- `InvalidRow`: Details about invalid data
- `SuggestedFix`: Suggested corrections

#### Services (`app/services/`)
**All functions are plain functions, not classes.**

- **data_extractor.py**: Extract spreadsheet data
  - `extract_from_google_sheet(url)`: Fetch from public Google Sheet
  - `extract_from_file(file)`: Parse uploaded CSV/XLSX/TSV
  - `extract_from_raw(data, format)`: Parse raw CSV/TSV string

- **header_validator.py**: Validate column headers
  - `validate_headers(rows, optional_params, session)`: Check required columns exist
  - Resolves aliases from database
  - Returns: (is_valid, missing_columns)

#### Routers (`app/routers/`)
- **validation.py**: `POST /validate` endpoint
  - Accept: Google Sheet URL, uploaded file, or raw CSV/TSV
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

1. **Input**: Google Sheet URL, uploaded file, or raw CSV/TSV
2. **Extraction**: `data_extractor.py` converts to list of row dicts
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
- `POST /validate` - Validate a sheet (multipart form)
- `POST /validate/json` - Validate a sheet (JSON body)

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
