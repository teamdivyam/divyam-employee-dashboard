/* eslint-disable react/prop-types */
import { Label } from "@components/components/ui/label";
import FieldError from "./FieldError";

export default function CompactField({ label, required, error, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-medium">
        {label}{required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

