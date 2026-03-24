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
    $allModels: {
      async findMany({ model, operation, args, query }) {
        if (!args) args = {};
        if (!args.where) args.where = {};
        args.where.deletedAt = null;
        return query(args);
      },
      async findFirst({ model, operation, args, query }) {
        if (!args) args = {};
        if (!args.where) args.where = {};
        args.where.deletedAt = null;
        return query(args);
      },
      async findUnique({ model, operation, args, query }) {
        if (!args) args = {};
        const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
        const result = await prismaClient[modelKey].findFirst({
          ...args,
          where: { ...args.where, deletedAt: null },
        });
        return result;
      },
      async count({ model, operation, args, query }) {
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
