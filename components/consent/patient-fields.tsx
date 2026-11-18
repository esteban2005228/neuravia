import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PatientFields() {
  const year = new Date().getFullYear();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="space-y-2">
        <Label htmlFor="educationYears">Años de estudio</Label>
        <Input id="educationYears" name="educationYears" type="number" inputMode="numeric" min={0} max={30} required />
        <p className="text-xs text-muted-foreground">Ej.: secundaria terminada = 9, licenciatura = 16.</p>
      </div>
    </div>
  );
}
