"use client";

import { useActionState } from "react";

import { updateAccount } from "@/app/actions/account";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STUDY_AREA_LABEL } from "@/lib/labels";
import type { StudyArea } from "@/lib/supabase/database.types";

export function AccountForm({
  displayName,
  studyArea,
  isProfessional,
}: {
  displayName: string;
  studyArea: StudyArea | null;
  isProfessional: boolean;
}) {
  const [state, action] = useActionState(updateAccount, undefined);
  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Nombre</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} maxLength={80} required />
      </div>
      {isProfessional && (
        <div className="space-y-2">
          <Label htmlFor="studyArea">Área de estudio</Label>
          <Select id="studyArea" name="studyArea" defaultValue={studyArea ?? ""}>
            <option value="">Sin especificar</option>
            {Object.entries(STUDY_AREA_LABEL).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </div>
      )}
      <FormMessage state={state} />
      <SubmitButton variant="secondary">Guardar cambios</SubmitButton>
    </form>
  );
}
