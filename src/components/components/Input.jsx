import { AlertCircle, IndianRupee, Percent } from "lucide-react"
import { Input } from "@components/components/ui/input"
import { Label } from "@components/components/ui/label"
import { useState } from "react"

const CurrencyInput = ({ displayLabel = true, label = "Amount", value, setValue }) => (
  <div className="w-full max-w-sm space-y-2">
    {displayLabel && <Label htmlFor="currency-input">{label}</Label>}
    <div className="relative">
      <IndianRupee className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        className="bg-background pl-9"
        min="0"
        placeholder="0.00"
        step="0.01"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  </div>
)

export const PercentInput = ({ displayLabel = true, label = "Percent", value, setValue }) => {
  const [error, setError] = useState(false)

  return (<div className="w-full max-w-sm space-y-2">
    {displayLabel && <Label>{label}</Label>}
    <div>
      <div className="relative">
        <Percent className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="bg-background pl-9"
          min="0"
          max="100"
          placeholder="0.00"
          step="0.01"
          type="number"
          value={value}
          onChange={(e) => {
            console.log(e.target.value);
            if (e.target.value < 0 || e.target.value > 100)
              return setError(true);
            setError(false)
            setValue(e.target.value);
          }}
        />
      </div>
      <div className="flex items-center gap-2 text-destructive text-sm pt-3">
        {error && (
          <>
            <AlertCircle className="h-4 w-4" />
          </>
        )}
      </div>
    </div>
  </div>)
}

export const NumberInput = ({ displayLabel = true, label = "Number", value, setValue }) => {

  return (
    <div className="w-full max-w-sm space-y-2">
      {displayLabel && <Label>{label}</Label>}
      <div className="relative">
        <Input
          className="bg-background pl-9"
          placeholder="1000"
          step="1"
          type="number"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
      </div>
    </div>
  )
}

export default CurrencyInput
