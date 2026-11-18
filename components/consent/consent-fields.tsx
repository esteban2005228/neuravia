import Link from "next/link";

import { CheckboxField } from "@/components/ui/checkbox-field";

/** Two separate, unchecked boxes: service (required) and research (optional). */
export function ConsentFields({ thirdPerson = false }: { thirdPerson?: boolean }) {
  return (
    <div className="space-y-3">
      <CheckboxField id="serviceConsent" name="serviceConsent" required>
        {thirdPerson ? "Yo, el paciente, leí el " : "Leí el "}
        <Link href="/privacidad" target="_blank" className="font-semibold text-primary underline">
          aviso de privacidad
        </Link>{" "}
        y doy mi consentimiento expreso para que Neuravia trate mis datos de salud (respuestas y resultados de las pruebas)
        con el fin de aplicar las pruebas y mostrar los resultados. <strong>Obligatorio.</strong>
      </CheckboxField>
      <CheckboxField id="researchConsent" name="researchConsent">
        Acepto que mis resultados, sin mi nombre, se usen para investigación y para mejorar Neuravia.{" "}
        <span className="text-muted-foreground">Opcional, puedo retirarlo cuando quiera.</span>
      </CheckboxField>
    </div>
  );
}
