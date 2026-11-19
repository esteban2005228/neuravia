import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BirthYearField() {
  const year = new Date().getFullYear();
  return (
    <div className="space-y-2">
      <Label htmlFor="birthYear">Año de nacimiento</Label>
      <Input
        id="birthYear"
        name="birthYear"
        type="number"
        inputMode="numeric"
        min={year - 45}
        max={year - 18}
        placeholder={String(year - 30)}
        required
      />
      <p className="text-xs text-muted-foreground">De 18 a 45 años.</p>
    </div>
  );
}
