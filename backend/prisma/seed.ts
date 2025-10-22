import { AttributeDataType, PrismaClient, VariantSelectionType } from "../src/generated/prisma";

const prisma = new PrismaClient();

const ensureCategory = async (
  hotelId: string,
  data: { key: string; name: string; description?: string; unitOfMeasure?: string; parentId?: string | null },
) => {
  return prisma.category.upsert({
    where: {
      hotelId_key: {
        hotelId,
        key: data.key,
      },
    },
    create: {
      hotelId,
      key: data.key,
      name: data.name,
      description: data.description,
      unitOfMeasure: data.unitOfMeasure,
      parentId: data.parentId ?? null,
    },
    update: {
      name: data.name,
      description: data.description,
      unitOfMeasure: data.unitOfMeasure,
      parentId: data.parentId ?? null,
    },
  });
};

async function main() {
  const hotel = await prisma.hotel.upsert({
    where: { slug: "magna-riviera" },
    update: {},
    create: {
      name: "Magna Riviera",
      slug: "magna-riviera",
      description: "Hotel boutique con servicio de viandas premium",
      timeZone: "America/Argentina/Buenos_Aires",
      imgQr: "https://example.com/qr/magna-riviera.png",
      metadata: {
        contact: {
          email: "contacto@magna-riviera.com",
          phone: "+54 11 5555-1234",
        },
        location: {
          address: "Av. del Libertador 1234, Buenos Aires",
          latitude: -34.6037,
          longitude: -58.3816,
        },
      },
    },
  });

  const viandasCategory = await ensureCategory(hotel.id, {
    key: "viandas",
    name: "Viandas",
    description: "Viandas y bandejas listas para servir",
  });

  const pastasCategory = await ensureCategory(hotel.id, {
    key: "viandas-pastas",
    name: "Pastas",
    description: "Pastas caseras listas para calentar",
    parentId: viandasCategory.id,
  });

  const salsaAttribute = await prisma.categoryAttributeDefinition.upsert({
    where: {
      categoryId_key: {
        categoryId: pastasCategory.id,
        key: "salsa",
      },
    },
    update: {},
    create: {
      categoryId: pastasCategory.id,
      name: "Salsa",
      key: "salsa",
      type: AttributeDataType.TEXT,
      isRequired: true,
      options: {
        create: [
          { label: "Blanca", value: "blanca", sortOrder: 1 },
          { label: "Filetto", value: "filetto", sortOrder: 2 },
          { label: "4 Quesos", value: "4quesos", sortOrder: 3 },
        ],
      },
    },
  });

  const incluyeQuesoAttribute = await prisma.categoryAttributeDefinition.upsert({
    where: {
      categoryId_key: {
        categoryId: pastasCategory.id,
        key: "incluyeQueso",
      },
    },
    update: {},
    create: {
      categoryId: pastasCategory.id,
      name: "Incluye queso",
      key: "incluyeQueso",
      type: AttributeDataType.BOOLEAN,
      isRequired: false,
    },
  });

  const tamanoAttribute = await prisma.categoryAttributeDefinition.upsert({
    where: {
      categoryId_key: {
        categoryId: pastasCategory.id,
        key: "tamano",
      },
    },
    update: {},
    create: {
      categoryId: pastasCategory.id,
      name: "Tamaño",
      key: "tamano",
      type: AttributeDataType.TEXT,
      options: {
        create: [
          { label: "Chico", value: "chico", sortOrder: 1 },
          { label: "Mediano", value: "mediano", sortOrder: 2 },
          { label: "Grande", value: "grande", sortOrder: 3 },
        ],
      },
    },
  });

  const ravioles = await prisma.product.upsert({
    where: {
      hotelId_slug: {
        hotelId: hotel.id,
        slug: "ravioles-caseros",
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: "Ravioles caseros",
      slug: "ravioles-caseros",
      description: "Ravioles artesanales rellenos de ricota y espinaca",
      stock: 35,
      price: "4500.00",
      images: [
        "https://example.com/images/ravioles-1.jpg",
        "https://example.com/images/ravioles-2.jpg",
      ],
      categories: {
        create: [
          { category: { connect: { id: viandasCategory.id } } },
          { category: { connect: { id: pastasCategory.id } } },
        ],
      },
      variantGroups: {
        create: [
          {
            name: "Tipo de salsa",
            key: "salsa",
            selectionType: VariantSelectionType.SINGLE,
            isRequired: true,
            options: {
              create: [
                { name: "Salsa blanca", value: "blanca", priceDelta: "600.00", sortOrder: 1 },
                { name: "Salsa filetto", value: "filetto", priceDelta: "0.00", sortOrder: 2 },
                { name: "Salsa cuatro quesos", value: "4quesos", priceDelta: "800.00", sortOrder: 3 },
              ],
            },
          },
        ],
      },
      attributeValues: {
        create: [
          {
            attribute: { connect: { id: salsaAttribute.id } },
            value: "filetto",
          },
          {
            attribute: { connect: { id: incluyeQuesoAttribute.id } },
            value: true,
          },
          {
            attribute: { connect: { id: tamanoAttribute.id } },
            value: "mediano",
          },
        ],
      },
      customAttributes: {
        create: [
          {
            name: "Tiempo de recalentado",
            key: "tiempoRecalentado",
            type: AttributeDataType.NUMBER,
            value: 8,
            unitOfMeasure: "minutos",
          },
        ],
      },
    },
  });

  console.log(
    `Datos de ejemplo listos para el hotel "${hotel.name}". Categorías y producto Ravioles creados/actualizados.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
