const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const prisma = prismaClient.$extends({
  query: {
    inventory_Bodega: {
      async update({ args, query }) {
        const result = await query(args);
        // Sync Bodega -> Commercial (Name, Quantities, Status, and DeletedAt)
        await prismaClient.inventory_Commercial.update({
          where: { bodegaId: result.id },
          data: {
            nombre_comercial: result.nombre,
            claseA: result.claseA,
            claseB: result.claseB,
            claseC: result.claseC,
            estado: result.estado,
            deletedAt: result.deletedAt
          }
        }).catch(() => {}); // Ignore if commercial doesn't exist yet
        return result;
      },
      async create({ args, query }) {
        const result = await query(args);
        // Automatically create Commercial counterpart
        await prismaClient.inventory_Commercial.create({
          data: {
            nombre_comercial: result.nombre,
            claseA: result.claseA,
            claseB: result.claseB,
            claseC: result.claseC,
            estado: result.estado,
            bodegaId: result.id
          }
        });
        return result;
      }
    },
    inventory_Commercial: {
      async update({ args, query }) {
        const result = await query(args);
        // Sync Commercial -> Bodega (Quantities, Status, and DeletedAt)
        await prismaClient.inventory_Bodega.update({
          where: { id: result.bodegaId },
          data: {
            claseA: result.claseA,
            claseB: result.claseB,
            claseC: result.claseC,
            estado: result.estado,
            deletedAt: result.deletedAt
          }
        }).catch(() => {});
        return result;
      }
    },
    $allModels: {
      async findMany({ model, operation, args, query }) {
        const modelsWithSoftDelete = ['User', 'Client', 'Inventory_Bodega', 'Inventory_Commercial', 'Quotation', 'QuotationItem', 'QuotationService'];
        if (!modelsWithSoftDelete.includes(model)) return query(args);

        if (!args) args = {};
        if (!args.where) args.where = {};
        args.where.deletedAt = null;
        return query(args);
      },
      async findFirst({ model, operation, args, query }) {
        const modelsWithSoftDelete = ['User', 'Client', 'Inventory_Bodega', 'Inventory_Commercial', 'Quotation', 'QuotationItem', 'QuotationService'];
        if (!modelsWithSoftDelete.includes(model)) return query(args);

        if (!args) args = {};
        if (!args.where) args.where = {};
        args.where.deletedAt = null;
        return query(args);
      },
      async count({ model, operation, args, query }) {
        const modelsWithSoftDelete = ['User', 'Client', 'Inventory_Bodega', 'Inventory_Commercial', 'Quotation', 'QuotationItem', 'QuotationService'];
        if (!modelsWithSoftDelete.includes(model)) return query(args);

        if (!args) args = {};
        if (!args.where) args.where = {};
        args.where.deletedAt = null;
        return query(args);
      },
    },
  },
  model: {
    $allModels: {
      async softDelete(id, justification) {
        // Just call update, the query extensions will handle the sync
        return this.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedJustification: justification || 'No se proporcionó justificación'
          },
        });
      },
    },
  },
});

module.exports = prisma;
