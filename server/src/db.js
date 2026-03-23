const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prismaClient = new PrismaClient();

const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ model, operation, args, query }) {
        // findUnique only allows unique fields. We convert it to findFirst to allow filtering by deletedAt: null
        // We use the lowercase model name to access the prismaClient model property
        const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
        const result = await prismaClient[modelKey].findFirst({
          ...args,
          where: { ...args.where, deletedAt: null },
        });
        return result;
      },
      async count({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
  model: {
    $allModels: {
      async softDelete(id, justification) {
        const model = this;
        return model.update({
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
