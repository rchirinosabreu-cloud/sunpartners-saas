const prisma = require('../db');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME, getSignedUrlHelper } = require('../utils/s3Client');
const { calculateLineTotal, calculateTotals } = require('../utils/quotationUtils');

const includeAll = {
  client: true,
  consultant: { select: { id: true, nombre: true, email: true } },
  items: { include: { inventory: { include: { compositions: { include: { warehouseItem: true } } } }, compositions: { include: { warehouseItem: true } } } },
  services: true,
  planning: true,
  logs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
};

exports.getAll = async (req, res) => {
  try {
    const { estado, archived } = req.query;
    const where = estado ? { estado } : {};

    // Default: only non-archived. If archived='true', only archived.
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        client: true,
        consultant: { select: { nombre: true } },
        items: { include: { inventory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.formalizeByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Debes cargar el archivo de la Orden de Compra.' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { secureHash: hash },
      include: { client: true }
    });

    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    // v34.1: Upload to Railway S3 Bucket (spacious-basketcase)
    const key = `purchase_orders/${Date.now()}_${file.originalname}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
      // ACL: 'public-read' - REMOVED for Signed URL Strategy (v38.0)
    }));

    const purchaseOrderUrl = `${(process.env.AWS_ENDPOINT_URL || 'https://t3.storageapi.dev').replace(/\/$/, '')}/${BUCKET_NAME}/${key}`;

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: 'ACCEPTED_PENDING_OC',
        purchaseOrderUrl,
        purchaseOrderKey: key,
        logs: {
          create: {
            message: 'El cliente aceptó la propuesta y cargó la Orden de Compra.'
          }
        }
      }
    });

    // Lógica de Notificación (Mock)
    console.log(`[EMAIL NOTIFICATION] ¡Evento Legalizado! El cliente ${quotation.client.razon_social} ha subido la Orden de Compra para la cotización #Q-${quotation.id.substring(0,6).toUpperCase()}`);

    res.json({
      message: 'Orden de Compra cargada con éxito. Su propuesta está siendo procesada.',
      status: 'ACCEPTED_PENDING_OC',
      purchaseOrderUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPurchaseOrderSignedUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });
    if (!quotation.purchaseOrderKey) return res.status(404).json({ error: 'Esta cotización no tiene una Orden de Compra cargada.' });

    const signedUrl = await getSignedUrlHelper(quotation.purchaseOrderKey);
    res.json({ url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: includeAll
    });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
        clientId,
        nombre_evento,
        tipo_evento,
        ubicacion,
        montaje_inicio,
        montaje_fin,
        evento_inicio,
        evento_fin,
        desmontaje_inicio,
        desmontaje_fin,
        pago_metodo,
        evento_servicio,
        evento_duracion,
        bitacora,
        items,
        services,
        consultantId,
        estado = 'BORRADOR'
    } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const isTaxExempt = client?.isTaxExempt || false;

    const { subtotal: vlrNeto, total: vlrTotal } = calculateTotals(items, services, isTaxExempt);

    // Handle Save to Catalog for dynamic compositions
    const processedItems = await Promise.all((items || []).map(async (item) => {
      let inventoryId = item.inventoryId || null;
      let compositions = item.compositions;

      if (item.saveToCatalog && item.customName) {
        // If it was already a catalog item, we create a NEW one (versioning by creation)
        // to avoid breaking historical quotations that used the previous version.
        const newItem = await prisma.inventory_Commercial.create({
          data: {
            nombre_comercial: item.customName,
            valor_alquiler: parseFloat(item.precio_pactado),
            isExternal: !!item.isExternal,
            vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
            compositions: {
              create: (item.compositions || []).map(c => ({
                warehouseItemId: c.warehouseItemId,
                quantity: parseInt(c.quantity)
              }))
            }
          }
        });
        inventoryId = newItem.id;
        compositions = null; // Links to the new catalog entry
      }

      return {
        inventoryId,
        customName: inventoryId ? null : (item.customName || null),
        cantidad: parseInt(item.cantidad),
        dias: parseInt(item.dias || 1),
        precio_pactado: parseFloat(item.precio_pactado),
        precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
        isExternal: !!item.isExternal,
        vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
        clase_asignada: item.clase_asignada || 'A',
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      };
    }));

    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        consultantId: consultantId || req.userId,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        montaje_inicio: new Date(montaje_inicio),
        montaje_fin: new Date(montaje_fin),
        evento_inicio: new Date(evento_inicio),
        evento_fin: new Date(evento_fin),
        desmontaje_inicio: new Date(desmontaje_inicio),
        desmontaje_fin: new Date(desmontaje_fin),
        pago_metodo,
        evento_servicio,
        evento_duracion,
        bitacora,
        estado,
        vlrNeto,
        vlrTotal,
        items: {
          create: processedItems
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            dias: parseInt(svc.dias || 1),
            precio_pactado: parseFloat(svc.precio_pactado),
            precio_dia_adicional: parseFloat(svc.precio_dia_adicional || 0)
          }))
        },
        logs: {
          create: {
            message: 'Cotización creada en el sistema',
            userId: req.userId
          }
        }
      },
      include: { items: true, services: true }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // Security check for CONSULTOR
    if (req.userRole === 'CONSULTOR') {
      const existing = await prisma.quotation.findUnique({ where: { id } });
      if (existing.consultantId !== req.userId) {
        return res.status(403).json({ error: 'Acceso Denegado. Los consultores solo pueden editar sus propias cotizaciones.' });
      }
    }

    const {
        clientId,
        nombre_evento,
        tipo_evento,
        ubicacion,
        montaje_inicio,
        montaje_fin,
        evento_inicio,
        evento_fin,
        desmontaje_inicio,
        desmontaje_fin,
        pago_metodo,
        evento_servicio,
        evento_duracion,
        bitacora,
        estado,
        items,
        services,
        consultantId
    } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    const isTaxExempt = client?.isTaxExempt || false;

    const { subtotal: vlrNeto, total: vlrTotal } = calculateTotals(items, services, isTaxExempt);

    // Handle Save to Catalog for dynamic compositions
    const processedItems = await Promise.all((items || []).map(async (item) => {
      let inventoryId = item.inventoryId || null;
      let compositions = item.compositions;

      if (item.saveToCatalog && item.customName) {
        const newItem = await prisma.inventory_Commercial.create({
          data: {
            nombre_comercial: item.customName,
            valor_alquiler: parseFloat(item.precio_pactado),
            isExternal: !!item.isExternal,
            vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
            compositions: {
              create: (item.compositions || []).map(c => ({
                warehouseItemId: c.warehouseItemId,
                quantity: parseInt(c.quantity)
              }))
            }
          }
        });
        inventoryId = newItem.id;
        compositions = null;
      }

      return {
        inventoryId,
        customName: inventoryId ? null : (item.customName || null),
        cantidad: parseInt(item.cantidad),
        dias: parseInt(item.dias || 1),
        precio_pactado: parseFloat(item.precio_pactado),
        precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
        isExternal: !!item.isExternal,
        vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
        clase_asignada: item.clase_asignada || 'A',
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      };
    }));

    // Delete existing items and services to replace them
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotationService.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        clientId,
        consultantId: consultantId || undefined,
        nombre_evento: nombre_evento || 'Evento sin nombre',
        tipo_evento: tipo_evento || 'Corporativo',
        ubicacion: ubicacion || 'Por definir',
        montaje_inicio: new Date(montaje_inicio),
        montaje_fin: new Date(montaje_fin),
        evento_inicio: new Date(evento_inicio),
        evento_fin: new Date(evento_fin),
        desmontaje_inicio: new Date(desmontaje_inicio),
        desmontaje_fin: new Date(desmontaje_fin),
        pago_metodo,
        evento_servicio,
        evento_duracion,
        bitacora,
        estado,
        vlrNeto,
        vlrTotal,
        items: {
          create: processedItems
        },
        services: {
          create: (services || []).map(svc => ({
            tipo: svc.tipo,
            descripcion: svc.descripcion,
            cantidad: parseInt(svc.cantidad || 1),
            dias: parseInt(svc.dias || 1),
            precio_pactado: parseFloat(svc.precio_pactado),
            precio_dia_adicional: parseFloat(svc.precio_dia_adicional || 0)
          }))
        },
        logs: {
          create: {
            message: 'Cotización actualizada y modificada en el sistema',
            userId: req.userId
          }
        }
      },
      include: { items: true, services: true }
    });

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateSecureLink = async (req, res) => {
  try {
    const { id } = req.params;

    // v32.0: Reuse hash if it exists to maintain same link for resending adjustments
    const current = await prisma.quotation.findUnique({ where: { id } });
    const secureHash = current.secureHash || crypto.randomBytes(32).toString('hex');

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        secureHash,
        estado: 'ENVIADA',
        logs: {
          create: {
            message: current.secureHash
              ? 'Ajustes reenviados al cliente. Estado restablecido a ENVIADA.'
              : 'Link seguro generado y cotización marcada como ENVIADA',
            userId: req.userId
          }
        }
      }
    });

    res.json({ hash: secureHash, url: `/q/${secureHash}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { secureHash: hash },
      include: includeAll
    });

    if (!quotation) return res.status(404).json({ error: 'Cotización no válida o expirada' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const quotation = await prisma.quotation.findUnique({ where: { secureHash: hash }, include: { items: true } });

    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    const conflict = await checkAvailability(quotation.id);
    if (conflict) {
      return res.status(400).json({
        error: 'Disponibilidad Limitada',
        details: 'Lo sentimos, algunos elementos de esta propuesta ya no cuentan con stock suficiente para las fechas seleccionadas. Por favor, solicite una revisión para ajustar el equipamiento.'
      });
    }

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: 'APROBADA',
        logs: {
          create: {
            message: 'Cotización APROBADA por el cliente vía portal público'
          }
        }
      }
    });

    res.json({ message: 'Cotización aprobada con éxito', status: 'APROBADA' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const { rejectionType, rejectionReason } = req.body;

    if (!rejectionType) return res.status(400).json({ error: 'El motivo de rechazo es obligatorio' });

    const quotation = await prisma.quotation.findUnique({ where: { secureHash: hash } });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: 'REVISION_SOLICITADA',
        rejectionType,
        rejectionReason,
        logs: {
          create: {
            message: `Cliente solicitó revisión. Motivo: ${rejectionType}. Detalle: ${rejectionReason || 'Ninguno'}`
          }
        }
      }
    });

    res.json({ message: 'Solicitud de revisión enviada', status: 'REVISION_SOLICITADA' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { estado, details } = req.body;
    const current = await prisma.quotation.findUnique({ where: { id: req.params.id } });

    if (estado === 'APROBADA' || estado === 'EJECUCION') {
      const conflict = await checkAvailability(req.params.id);
      if (conflict) {
        return res.status(400).json({
          error: 'Conflicto de disponibilidad',
          details: conflict
        });
      }
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        estado,
        logs: {
          create: {
            message: `Estado cambiado de ${current.estado} a ${estado}. ${details || ''}`,
            userId: req.userId
          }
        }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertPlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { cronograma, personal, transporte } = req.body;

    const planning = await prisma.planningStep.upsert({
      where: { quotationId: id },
      update: { cronograma, personal, transporte },
      create: { quotationId: id, cronograma, personal, transporte }
    });

    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function checkAvailability(quotationId) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: {
        include: {
          compositions: true,
          inventory: { include: { compositions: true } }
        }
      }
    }
  });

  const start = q.montaje_inicio;
  const end = q.desmontaje_fin;

  const overlaps = await prisma.quotation.findMany({
    where: {
      id: { not: quotationId },
      estado: { in: ['APROBADA', 'EJECUCION', 'CONFIRMED'] },
      archivedAt: null,
      OR: [
        { montaje_inicio: { lte: end }, desmontaje_fin: { gte: start } }
      ]
    },
    include: {
      items: {
        include: {
          compositions: true,
          inventory: { include: { compositions: true } }
        }
      }
    }
  });

  // Calculate committed stock by Warehouse Item (Universal key)
  const committed = {}; // warehouseItemId -> quantity
  overlaps.forEach(overlap => {
    overlap.items.forEach(item => {
      // 1. If it's a dynamic composition
      if (item.compositions && item.compositions.length > 0) {
        item.compositions.forEach(comp => {
          committed[comp.warehouseItemId] = (committed[comp.warehouseItemId] || 0) + (comp.quantity * item.cantidad);
        });
      }
      // 2. If it's a catalog item that is a composition
      else if (item.inventory?.compositions && item.inventory.compositions.length > 0) {
        item.inventory.compositions.forEach(comp => {
          committed[comp.warehouseItemId] = (committed[comp.warehouseItemId] || 0) + (comp.quantity * item.cantidad);
        });
      }
      // 3. If it's a simple catalog item (1-to-1)
      else if (item.inventory?.bodegaId) {
        committed[item.inventory.bodegaId] = (committed[item.inventory.bodegaId] || 0) + item.cantidad;
      }
    });
  });

  // Check availability for current quotation items
  for (const item of q.items) {
    if (item.isExternal || item.inventory?.isExternal) continue;

    const components = [];

    if (item.compositions && item.compositions.length > 0) {
      components.push(...item.compositions);
    } else if (item.inventory?.compositions && item.inventory.compositions.length > 0) {
      components.push(...item.inventory.compositions);
    } else if (item.inventory?.bodegaId) {
      components.push({ warehouseItemId: item.inventory.bodegaId, quantity: 1, name: item.inventory.nombre_comercial });
    }

    for (const comp of components) {
      const warehouseId = comp.warehouseItemId;
      const needed = comp.quantity * item.cantidad;
      const alreadyCommitted = committed[warehouseId] || 0;

      const warehouseItem = await prisma.inventory_Bodega.findUnique({ where: { id: warehouseId } });
      const totalStock = (warehouseItem.claseA || 0) + (warehouseItem.claseB || 0);

      if (alreadyCommitted + needed > totalStock) {
        return `Stock insuficiente para "${warehouseItem.nombre}". Disponible (A+B): ${totalStock}, Comprometido: ${alreadyCommitted}, Requerido para este set: ${needed}`;
      }
    }
  }

  return null;
}

exports.checkAvailabilityEndpoint = async (req, res) => {
    try {
        const conflict = await checkAvailability(req.params.id);
        res.json({ available: !conflict, conflict });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.archive = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    // Restriction: Only BORRADOR, ENVIADA, FINALIZADA, CANCELADA are allowed
    const allowedStatuses = ['BORRADOR', 'ENVIADA', 'FINALIZADA', 'CANCELADA'];
    if (!allowedStatuses.includes(quotation.estado)) {
      return res.status(400).json({
        error: `Restricción de Seguridad: No se pueden archivar cotizaciones en estado ${quotation.estado}. Solo se permiten estados de cierre o etapas iniciales.`
      });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        logs: {
          create: {
            message: 'Cotización ARCHIVADA. Se libera stock reservado.',
            userId: req.userId
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unarchive = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        archivedAt: null,
        logs: {
          create: {
            message: 'Cotización DESARCHIVADA. Vuelve a la línea de tiempo activa.',
            userId: req.userId
          }
        }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
