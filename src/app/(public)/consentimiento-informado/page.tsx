import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consentimiento Informado',
};

export default function ConsentimientoInformadoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-grape">
        Consentimiento Informado para Servicios de Acompañamiento Emocional
      </h1>

      <div className="prose prose-sm max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-grape [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-grape [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
        <p className="text-sm text-muted-foreground">
          Última actualización: Agosto de 2026
        </p>

        <h2>1. Naturaleza del servicio</h2>
        <p>
          <strong>conAlma</strong> ofrece servicios de <strong>acompañamiento emocional online</strong> a
          través de videollamadas. Este servicio es brindado por profesionales en psicología
          debidamente titulados y habilitados para el ejercicio profesional en Colombia.
        </p>
        <p>
          <strong>Importante:</strong> El acompañamiento emocional online NO constituye:
        </p>
        <ul>
          <li>Atención de urgencias o emergencias psicológicas o psiquiátricas.</li>
          <li>Tratamiento médico, farmacológico o psiquiátrico.</li>
          <li>Un reemplazo de la atención presencial especializada cuando esta sea necesaria.</li>
          <li>Psicoterapia en sentido estricto cuando la situación clínica requiera intervención presencial.</li>
        </ul>
        <p>
          Si usted se encuentra en una situación de crisis o riesgo vital, por favor comuníquese
          inmediatamente con la línea de emergencias 123 o la línea de atención en crisis 106.
        </p>

        <h2>2. Alcance del acompañamiento</h2>
        <p>El servicio de acompañamiento emocional incluye:</p>
        <ul>
          <li>Escucha activa y empática en un espacio seguro y confidencial.</li>
          <li>Orientación emocional para el manejo de situaciones cotidianas.</li>
          <li>Herramientas y estrategias de bienestar emocional.</li>
          <li>Seguimiento del proceso a través de notas de progreso.</li>
          <li>Derivación a servicios especializados cuando el profesional lo considere necesario.</li>
        </ul>

        <h2>3. Confidencialidad</h2>
        <p>
          Toda la información compartida durante las sesiones es estrictamente confidencial,
          conforme a la Ley 1090 de 2006 (Código Deontológico y Bioético del Psicólogo en Colombia)
          y la Ley 1581 de 2012 (Protección de Datos Personales).
        </p>
        <p>
          <strong>Excepciones a la confidencialidad:</strong> El profesional podrá romper la
          confidencialidad únicamente cuando:
        </p>
        <ul>
          <li>Exista riesgo inminente para la vida del consultante o de terceros.</li>
          <li>Se detecte abuso o maltrato hacia menores de edad.</li>
          <li>Exista una orden judicial que lo requiera.</li>
          <li>Sea necesario para proteger la salud pública, conforme a la ley.</li>
        </ul>

        <h2>4. Modalidad del servicio</h2>
        <p>Las sesiones se realizan de forma virtual a través de videollamada (Google Meet). Para una experiencia óptima, se recomienda:</p>
        <ul>
          <li>Contar con una conexión a internet estable.</li>
          <li>Estar en un espacio privado y tranquilo.</li>
          <li>Utilizar auriculares para mayor privacidad.</li>
          <li>Tener cámara encendida durante la sesión (recomendado, no obligatorio).</li>
        </ul>

        <h2>5. Duración y frecuencia</h2>
        <p>
          Las sesiones tienen una duración de 60 minutos. La frecuencia será acordada entre
          el consultante y el profesional según las necesidades identificadas. Tanto el
          consultante como el profesional pueden proponer la finalización del proceso cuando
          lo consideren pertinente.
        </p>

        <h2>6. Política de cancelación y reprogramación</h2>
        <ul>
          <li><strong>Cancelación con más de 8 horas de anticipación:</strong> Reembolso completo o reprogramación sin costo.</li>
          <li><strong>Cancelación con menos de 8 horas:</strong> No se realiza reembolso. La sesión se considera utilizada.</li>
          <li><strong>Inasistencia sin aviso:</strong> La sesión se considera utilizada y no se reprograma.</li>
          <li><strong>Reprogramación:</strong> Puede solicitar reprogramación con al menos 8 horas de anticipación, sujeta a disponibilidad del profesional.</li>
        </ul>

        <h2>7. Pagos</h2>
        <p>
          Los pagos se realizan de forma anticipada a través de los medios habilitados en la
          plataforma (pago en línea vía Wompi o transferencia bancaria). El precio del servicio
          se informa antes de la confirmación del agendamiento.
        </p>

        <h2>8. Tratamiento de datos personales</h2>
        <p>
          Al aceptar este consentimiento, usted autoriza a conAlma para recolectar, almacenar
          y tratar sus datos personales (incluidos datos sensibles de salud) conforme a nuestra{' '}
          <a href="/politica-datos" className="text-grape underline font-medium">
            Política de Tratamiento de Datos Personales
          </a>
          . Esta autorización puede ser revocada en cualquier momento.
        </p>

        <h2>9. Limitaciones y derivación</h2>
        <p>
          Si durante el proceso de acompañamiento el profesional identifica que el consultante
          requiere atención especializada (psiquiátrica, neurológica, o presencial), se realizará
          la derivación correspondiente, informando al consultante las razones y alternativas
          disponibles.
        </p>

        <h2>10. Comunicaciones</h2>
        <p>
          Al usar la plataforma, usted acepta recibir comunicaciones transaccionales necesarias
          para la prestación del servicio: confirmaciones de cita, recordatorios, cambios de
          horario y notificaciones de pago. Estas comunicaciones se envían por correo electrónico.
        </p>

        <h2>11. Aceptación</h2>
        <p>
          Al marcar la casilla de consentimiento informado durante el proceso de agendamiento,
          usted declara que:
        </p>
        <ol>
          <li>Ha leído y comprendido este documento en su totalidad.</li>
          <li>Entiende la naturaleza y alcance del servicio de acompañamiento emocional online.</li>
          <li>Acepta las condiciones aquí establecidas de forma libre y voluntaria.</li>
          <li>Autoriza el tratamiento de sus datos personales conforme a la política de privacidad.</li>
          <li>Conoce sus derechos como titular de datos y cómo ejercerlos.</li>
        </ol>

        <div className="mt-8 rounded-lg bg-plum/10 p-4">
          <p className="text-sm text-grape">
            <strong>¿Tienes preguntas?</strong> Escríbenos a{' '}
            <a href="mailto:contacto@conalma.care" className="underline">contacto@conalma.care</a>
          </p>
        </div>
      </div>
    </div>
  );
}
