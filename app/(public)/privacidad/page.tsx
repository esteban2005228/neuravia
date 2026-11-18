import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { NOTICE_VERSION, PRIVACY_CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = { title: "Aviso de privacidad" };

// TEMPLATE: must be reviewed by a lawyer before production (LFPDPPP, Mexico).
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Logo className="mb-6 w-40" />
      <Card>
        <CardContent className="space-y-5 pt-6 leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold">
          <h1 className="text-2xl font-semibold">Aviso de privacidad integral</h1>
          <p className="text-sm text-muted-foreground">Versión {NOTICE_VERSION}. Plantilla pendiente de revisión legal.</p>

          <h2>Responsable</h2>
          <p>
            Neuravia es responsable del tratamiento de tus datos personales. Contacto:{" "}
            <a className="underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>

          <h2>Datos que tratamos</h2>
          <ul className="list-disc pl-6">
            <li>Identificación y contacto: nombre y correo electrónico.</li>
            <li>Año de nacimiento y años de escolaridad, para interpretar los resultados.</li>
            <li>
              <strong>Datos personales sensibles</strong>: tus respuestas, tiempos de reacción y resultados en las pruebas de
              atención y memoria.
            </li>
          </ul>

          <h2>Finalidades</h2>
          <p>
            <strong>Necesaria:</strong> aplicar las pruebas, calcular y mostrarte tus resultados, y compartirlos con el
            profesional o acompañante que tú vincules.
          </p>
          <p>
            <strong>Opcional:</strong> usar tus resultados sin tu nombre para investigación y para mejorar las normas de
            interpretación. Puedes negarte o retirar este consentimiento en cualquier momento desde Mi cuenta, sin que afecte
            el servicio.
          </p>

          <h2>Consentimiento expreso</h2>
          <p>
            Por tratarse de datos sensibles, te pedimos tu consentimiento expreso y por escrito (casilla que tú marcas) antes de
            cualquier prueba. Si un familiar te registra sin correo, eres tú quien lee y acepta este aviso en su dispositivo.
          </p>

          <h2>Con quién se comparten</h2>
          <p>
            Solo con las personas que tú vinculas con un código, y con nuestros proveedores de infraestructura (Supabase para
            la base de datos y Netlify para el sitio), que alojan los datos en servidores en Estados Unidos. Esta transferencia
            es necesaria para prestar el servicio. No vendemos tus datos.
          </p>

          <h2>Derechos ARCO y revocación</h2>
          <p>
            Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso, y revocar tu consentimiento. Desde{" "}
            <Link className="underline" href="/cuenta">
              Mi cuenta
            </Link>{" "}
            puedes ver y retirar consentimientos, quitar vínculos y borrar tu cuenta con todos tus resultados. Para cualquier
            otra solicitud escribe a {PRIVACY_CONTACT_EMAIL}; respondemos en un máximo de 20 días hábiles.
          </p>

          <h2>Seguridad</h2>
          <p>
            Cada registro está protegido por reglas de acceso en la base de datos: solo tú y las personas que vinculas pueden
            ver tus resultados. Las comunicaciones viajan cifradas.
          </p>

          <h2>Cambios a este aviso</h2>
          <p>Si este aviso cambia, te lo mostraremos y te pediremos de nuevo tu consentimiento.</p>
        </CardContent>
      </Card>
    </main>
  );
}
