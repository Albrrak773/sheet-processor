import { Textarea } from "@/components/ui/textarea"

interface RawDataInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function RawDataInput({ value, onChange, disabled }: RawDataInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder={
          "Paste CSV or TSV data here...\n\nname,email,university_id\nJohn Doe,john@example.com,123456789"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={10}
        className="font-mono text-sm"
      />
      {value.trim().length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.trim().split("\n").length} lines detected
        </p>
      )}
    </div>
  )
}

export { RawDataInput }
