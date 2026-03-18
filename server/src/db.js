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
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ model, operation, args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
  model: {
    $allModels: {
      async softDelete(id) {
        const model = this;
        return model.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});

module.exports = prisma;
