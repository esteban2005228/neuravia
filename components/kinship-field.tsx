import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { KINSHIP_LABEL } from "@/lib/labels";

export function KinshipField({ label = "Parentesco" }: { label?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="kinship">{label}</Label>
      <Select id="kinship" name="kinship" required defaultValue="">
        <option value="" disabled>
          Elige una opción
        </option>
        {Object.entries(KINSHIP_LABEL).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </Select>
    </div>
  );
}
