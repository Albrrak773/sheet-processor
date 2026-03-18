import * as React from "react"
import type { GenderValue, UnmappedGender } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GenderMappingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unmappedGenders: Array<UnmappedGender>
  onConfirm: (mappings: Map<string, GenderValue>) => void
  isSubmitting: boolean
}

function GenderMappingModal({
  open,
  onOpenChange,
  unmappedGenders,
  onConfirm,
  isSubmitting,
}: GenderMappingModalProps) {
  const [mappings, setMappings] = React.useState<
    Map<string, GenderValue | null>
  >(new Map())

  React.useEffect(() => {
    if (open) {
      const initialMappings = new Map<string, GenderValue | null>()
      for (const gender of unmappedGenders) {
        initialMappings.set(gender.value, null)
      }
      setMappings(initialMappings)
    }
  }, [open, unmappedGenders])

  const handleMappingChange = (value: string, gender: GenderValue) => {
    setMappings((prev) => {
      const newMappings = new Map(prev)
      newMappings.set(value, gender)
      return newMappings
    })
  }

  const hasUnmapped = Array.from(mappings.values()).some((v) => v === null)

  const handleConfirm = () => {
    const confirmedMappings = new Map<string, GenderValue>()
    mappings.forEach((gender, value) => {
      if (gender) {
        confirmedMappings.set(value, gender)
      }
    })
    onConfirm(confirmedMappings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Map Gender Values</DialogTitle>
          <DialogDescription>
            Map unrecognized gender values to Male or Female
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          {unmappedGenders.map((gender) => (
            <div
              key={gender.value}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex flex-col">
                <span className="font-medium">{gender.value}</span>
                <span className="text-xs text-muted-foreground">
                  {gender.count} row{gender.count !== 1 ? "s" : ""}
                </span>
              </div>
              <Select
                value={mappings.get(gender.value) ?? ""}
                onValueChange={(v) =>
                  handleMappingChange(gender.value, v as GenderValue)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {hasUnmapped && (
          <p className="text-sm text-destructive">
            All values must be mapped before confirming.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={hasUnmapped || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { GenderMappingModal }
