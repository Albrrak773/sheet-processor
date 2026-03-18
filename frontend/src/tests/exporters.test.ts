import { describe, expect, it } from "vitest"
import type { RowData } from "@/lib/types"
import { rowsToCsv, rowsToTsv } from "@/lib/exporters"

describe("rowsToTsv", () => {
  it("returns empty string for empty array", () => {
    expect(rowsToTsv([])).toBe("")
  })

  it("handles simple data", () => {
    const rows: Array<RowData> = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]
    const result = rowsToTsv(rows)
    expect(result).toBe("name\tage\nAlice\t30\nBob\t25")
  })

  it("escapes tabs in cell values", () => {
    const rows: Array<RowData> = [{ name: "Ali\tce", age: "30" }]
    const result = rowsToTsv(rows)
    expect(result).toBe('name\tage\n"Ali\tce"\t30')
  })

  it("escapes newlines in cell values", () => {
    const rows: Array<RowData> = [{ name: "Ali\nce", age: "30" }]
    const result = rowsToTsv(rows)
    expect(result).toBe('name\tage\n"Ali\nce"\t30')
  })

  it("escapes carriage returns in cell values", () => {
    const rows: Array<RowData> = [{ name: "Ali\rce", age: "30" }]
    const result = rowsToTsv(rows)
    expect(result).toBe('name\tage\n"Ali\rce"\t30')
  })

  it("escapes quotes in cell values by doubling them", () => {
    const rows: Array<RowData> = [{ name: 'Ali"ce', age: "30" }]
    const result = rowsToTsv(rows)
    expect(result).toBe('name\tage\n"Ali""ce"\t30')
  })

  it("handles multi-line cell values (the reported bug)", () => {
    const rows: Array<RowData> = [
      {
        name: "Test User",
        comment: "Line 1\nLine 2\nLine 3",
      },
    ]
    const result = rowsToTsv(rows)
    expect(result).toBe('name\tcomment\nTest User\t"Line 1\nLine 2\nLine 3"')
  })

  it("handles Arabic text", () => {
    const rows: Array<RowData> = [
      { name: "عبدالرحمن", email: "test@example.com" },
    ]
    const result = rowsToTsv(rows)
    expect(result).toBe("name\temail\nعبدالرحمن\ttest@example.com")
  })

  it("collects headers from all rows, not just the first", () => {
    const rows: Array<RowData> = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25", city: "NYC" },
      { name: "Charlie", city: "LA" },
    ]
    const result = rowsToTsv(rows)
    const lines = result.split("\n")
    expect(lines[0]).toBe("name\tage\tcity")
    expect(lines[1]).toBe("Alice\t30\t")
    expect(lines[2]).toBe("Bob\t25\tNYC")
    expect(lines[3]).toBe("Charlie\t\tLA")
  })

  it("excludes underscore-prefixed columns", () => {
    const rows: Array<RowData> = [{ name: "Alice", _rowNum: 1, age: "30" }]
    const result = rowsToTsv(rows)
    expect(result).toBe("name\tage\nAlice\t30")
  })

  it("handles empty values", () => {
    const rows: Array<RowData> = [{ name: "", age: "" }]
    const result = rowsToTsv(rows)
    expect(result).toBe("name\tage\n\t")
  })

  it("handles null and undefined values", () => {
    const rows: Array<RowData> = [{ name: null, age: undefined }]
    const result = rowsToTsv(rows)
    expect(result).toBe("name\tage\n\t")
  })

  it("handles complex multi-line comment with emojis (real bug case)", () => {
    const rows: Array<RowData> = [
      {
        name: "شوق فهد الطاسان",
        comment:
          "شغلل جبار والله \nالله يعطيكم العافيه التقديم ممتاز وتعاون البنات ممتاز شكرراً لكم 🩷🩷🩷🩷",
      },
    ]
    const result = rowsToTsv(rows)
    expect(result).toContain("شوق فهد الطاسان")
    expect(result).toMatch(/^name\tcomment\n/)
    expect(result).toContain('"شغلل جبار والله ')
    expect(result).toContain("🩷🩷🩷🩷")
  })
})

describe("rowsToCsv", () => {
  it("returns empty string for empty array", () => {
    expect(rowsToCsv([])).toBe("")
  })

  it("handles simple data", () => {
    const rows: Array<RowData> = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]
    const result = rowsToCsv(rows)
    expect(result).toBe("name,age\nAlice,30\nBob,25")
  })

  it("escapes commas in cell values", () => {
    const rows: Array<RowData> = [{ name: "Ali,ce", age: "30" }]
    const result = rowsToCsv(rows)
    expect(result).toBe('name,age\n"Ali,ce",30')
  })

  it("escapes quotes in cell values by doubling them", () => {
    const rows: Array<RowData> = [{ name: 'Ali"ce', age: "30" }]
    const result = rowsToCsv(rows)
    expect(result).toBe('name,age\n"Ali""ce",30')
  })

  it("escapes newlines in cell values", () => {
    const rows: Array<RowData> = [{ name: "Ali\nce", age: "30" }]
    const result = rowsToCsv(rows)
    expect(result).toBe('name,age\n"Ali\nce",30')
  })

  it("collects headers from all rows", () => {
    const rows: Array<RowData> = [
      { name: "Alice", age: "30" },
      { name: "Bob", city: "NYC" },
    ]
    const result = rowsToCsv(rows)
    const lines = result.split("\n")
    expect(lines[0]).toBe("name,age,city")
    expect(lines[1]).toBe("Alice,30,")
    expect(lines[2]).toBe("Bob,,NYC")
  })

  it("excludes underscore-prefixed columns", () => {
    const rows: Array<RowData> = [{ name: "Alice", _rowNum: 1, age: "30" }]
    const result = rowsToCsv(rows)
    expect(result).toBe("name,age\nAlice,30")
  })
})
