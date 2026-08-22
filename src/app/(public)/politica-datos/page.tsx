import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Tratamiento de Datos Personales',
};

export default function PoliticaDatosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-grape">
        Política de Tratamiento de Datos Personales
      </h1>

      <div className="prose prose-sm max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-grape [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-grape [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
        <p className="text-sm text-muted-foreground">
          Última actualización: Agosto de 2026
        </p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>conAlma</strong> (en adelante &quot;el Responsable&quot;), identificado con NIT [por definir],
          con domicilio en la ciudad de Bucaramanga, Colombia, es responsable del tratamiento
          de los datos personales recolectados a través de la plataforma conalma.care.
        </p>

        <h2>2. Marco legal</h2>
        <p>
          Esta política se rige por la Ley 1581 de 2012 (Ley de Protección de Datos Personales),
          el Decreto 1377 de 2013 y demás normas concordantes vigentes en la República de Colombia.
        </p>

        <h2>3. Datos que recolectamos</h2>
        <p>Recolectamos los siguientes datos personales con su autorización:</p>
        <ul>
          <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, fecha de nacimiento, país de residencia.</li>
          <li><strong>Datos de salud (sensibles):</strong> motivo de consulta, sentimientos recientes, riesgo de autolesión, tratamientos actuales, diagnósticos previos. Estos datos se recolectan exclusivamente para prestar el servicio de acompañamiento emocional.</li>
          <li><strong>Datos de contacto de emergencia:</strong> nombre, relación, teléfono y país del contacto de emergencia.</li>
          <li><strong>Datos de navegación:</strong> información técnica de su dispositivo y navegador para mejorar la experiencia de uso.</li>
        </ul>

        <h2>4. Finalidades del tratamiento</h2>
        <p>Sus datos personales serán utilizados para:</p>
        <ol>
          <li>Prestar el servicio de acompañamiento emocional online contratado.</li>
          <li>Gestionar el agendamiento, confirmación y recordatorio de sesiones.</li>
          <li>Procesar pagos y generar comprobantes.</li>
          <li>Enviar comunicaciones transaccionales (confirmaciones, recordatorios, cambios de horario).</li>
          <li>Garantizar la seguridad del paciente mediante el contacto de emergencia cuando sea estrictamente necesario.</li>
          <li>Cumplir con obligaciones legales y regulatorias.</li>
        </ol>

        <h2>5. Datos sensibles</h2>
        <p>
          Los datos relacionados con su estado emocional y de salud son considerados datos sensibles
          conforme al artículo 5 de la Ley 1581 de 2012. Su tratamiento requiere autorización
          explícita del titular. Usted no está obligado a proporcionar estos datos, pero son
          necesarios para que el profesional pueda brindar un acompañamiento adecuado.
        </p>

        <h2>6. Derechos del titular</h2>
        <p>Como titular de los datos, usted tiene derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado respecto del uso que se ha dado a sus datos.</li>
          <li>Revocar la autorización y/o solicitar la supresión de los datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.</li>
          <li>Acceder de forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
        </ul>

        <h2>7. Procedimiento para ejercer sus derechos</h2>
        <p>
          Para ejercer cualquiera de los derechos mencionados, puede enviar una solicitud al
          correo electrónico <a href="mailto:contacto@conalma.care" className="text-grape underline">contacto@conalma.care</a> indicando:
        </p>
        <ul>
          <li>Nombre completo y documento de identidad.</li>
          <li>Descripción precisa de la solicitud.</li>
          <li>Dirección de correo electrónico para respuesta.</li>
        </ul>
        <p>
          El plazo máximo de respuesta será de quince (15) días hábiles contados a partir de la
          fecha de recibo de la solicitud, conforme al artículo 15 de la Ley 1581 de 2012.
        </p>

        <h2>8. Seguridad de la información</h2>
        <p>
          Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos
          personales contra acceso no autorizado, pérdida, alteración o destrucción. Esto incluye
          encriptación de datos en tránsito y en reposo, acceso restringido por roles, y
          almacenamiento en servidores con certificaciones de seguridad.
        </p>

        <h2>9. Transferencia y transmisión de datos</h2>
        <p>
          Sus datos personales no serán vendidos, compartidos ni transferidos a terceros,
          excepto cuando sea necesario para la prestación del servicio (procesadores de pago,
          servicios de correo electrónico transaccional) o cuando exista una obligación legal.
          En todos los casos, los terceros están obligados contractualmente a mantener la
          confidencialidad.
        </p>

        <h2>10. Vigencia</h2>
        <p>
          Los datos personales serán conservados durante el tiempo necesario para cumplir con las
          finalidades descritas y las obligaciones legales aplicables. Una vez cumplida la
          finalidad, los datos serán eliminados de forma segura.
        </p>

        <h2>11. Modificaciones</h2>
        <p>
          Esta política puede ser actualizada en cualquier momento. Las modificaciones serán
          comunicadas a través de la plataforma. El uso continuado del servicio después de la
          publicación de cambios constituye aceptación de los mismos.
        </p>
      </div>
    </div>
  );
}
