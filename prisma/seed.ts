import { PrismaClient } from '.prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { hash } from 'bcryptjs';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@conalma.co' },
    update: {},
    create: {
      email: 'admin@conalma.co',
      name: 'Admin conAlma',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create services
  const serviceEmocional = await prisma.service.upsert({
    where: { id: 'svc-emocional' },
    update: {},
    create: {
      id: 'svc-emocional',
      name: 'Acompañamiento emocional',
      description:
        'Sesiones individuales para explorar tus emociones y fortalecer tu bienestar emocional.',
      durationMin: 60,
      price: 80000,
      sortOrder: 1,
    },
  });

  const servicePosparto = await prisma.service.upsert({
    where: { id: 'svc-posparto' },
    update: {},
    create: {
      id: 'svc-posparto',
      name: 'Acompañamiento maternidad posparto',
      description:
        'Espacio seguro para madres que atraviesan la etapa posparto con apoyo profesional.',
      durationMin: 60,
      price: 90000,
      sortOrder: 2,
    },
  });
  console.log('✅ Services created:', serviceEmocional.name, '|', servicePosparto.name);

  // Create professionals
  const proAlejandra = await prisma.professional.upsert({
    where: { email: 'alejandra@conalma.co' },
    update: {},
    create: {
      name: 'Alejandra Moreno',
      email: 'alejandra@conalma.co',
      specialty: 'Psicóloga Clínica',
      description:
        'Especialista en terapia cognitivo-conductual con enfoque humanista. Más de 8 años de experiencia acompañando personas en procesos de ansiedad, depresión y duelo.',
      traits: ['Cálida', 'Profunda', 'Reflexiva', 'Sensible'],
    },
  });

  const proCarolina = await prisma.professional.upsert({
    where: { email: 'carolina@conalma.co' },
    update: {},
    create: {
      name: 'Carolina Jiménez',
      email: 'carolina@conalma.co',
      specialty: 'Psicóloga Perinatal',
      description:
        'Especialista en salud mental materna y acompañamiento posparto. Te ayudo a transitar la maternidad con herramientas prácticas y un espacio libre de juicio.',
      traits: ['Cercana', 'Práctica', 'Compasiva', 'Concreta'],
    },
  });
  console.log('✅ Professionals created:', proAlejandra.name, '|', proCarolina.name);

  // Associate professionals with services
  await prisma.professionalService.createMany({
    data: [
      { professionalId: proAlejandra.id, serviceId: serviceEmocional.id },
      { professionalId: proAlejandra.id, serviceId: servicePosparto.id },
      { professionalId: proCarolina.id, serviceId: servicePosparto.id },
      { professionalId: proCarolina.id, serviceId: serviceEmocional.id },
    ],
    skipDuplicates: true,
  });

  // Create tariffs
  await prisma.professionalTariff.createMany({
    data: [
      { professionalId: proAlejandra.id, serviceId: serviceEmocional.id, price: 80000, commission: 40 },
      { professionalId: proAlejandra.id, serviceId: servicePosparto.id, price: 90000, commission: 40 },
      { professionalId: proCarolina.id, serviceId: serviceEmocional.id, price: 80000, commission: 40 },
      { professionalId: proCarolina.id, serviceId: servicePosparto.id, price: 90000, commission: 40 },
    ],
    skipDuplicates: true,
  });

  // Create availability (weekly schedule)
  await prisma.availability.createMany({
    data: [
      // Alejandra: Lunes, Miércoles, Viernes
      { professionalId: proAlejandra.id, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      { professionalId: proAlejandra.id, dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
      { professionalId: proAlejandra.id, dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
      { professionalId: proAlejandra.id, dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
      // Carolina: Martes, Jueves
      { professionalId: proCarolina.id, dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
      { professionalId: proCarolina.id, dayOfWeek: 4, startTime: '10:00', endTime: '14:00' },
      { professionalId: proCarolina.id, dayOfWeek: 4, startTime: '15:00', endTime: '18:00' },
    ],
    skipDuplicates: true,
  });

  // Create site content
  await prisma.siteContent.createMany({
    data: [
      {
        section: 'hero',
        title: 'Tu bienestar emocional merece un espacio seguro',
        subtitle: 'En conAlma te acompañamos con empatía y profesionalismo en tu proceso de crecimiento personal. Porque cuidar tu salud mental es un acto de valentía.',
        ctaText: 'Quiero agendar mi cita',
        sortOrder: 1,
      },
      {
        section: 'about',
        title: '¿Qué es conAlma?',
        body: 'Somos un espacio de acompañamiento emocional online creado para personas que buscan un refugio seguro donde explorar sus emociones y encontrar herramientas para su bienestar. Creemos que pedir ayuda es un acto de valentía.',
        sortOrder: 2,
      },
      {
        section: 'services',
        title: 'Nuestros servicios',
        subtitle: 'Elige el tipo de acompañamiento que mejor se adapte a lo que necesitas en este momento.',
        sortOrder: 3,
      },
      {
        section: 'cta',
        title: '¿Listo para dar el primer paso?',
        subtitle: 'No tienes que enfrentar esto solo. Estamos aquí para acompañarte con respeto, empatía y profesionalismo.',
        ctaText: 'Agendar mi primera cita',
        sortOrder: 4,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Site content, availability, and tariffs created');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
