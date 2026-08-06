const prisma = require('../db');
const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME, getSignedUrlHelper } = require('../utils/s3Client');
const { calculateLineTotal, calculateTotals, isSubmittedCollection } = require('../utils/quotationUtils');

const includeAll = {
  client: { include: { contacts: true } },
  clientContact: true,
  consultant: { select: { id: true, nombre: true, email: true, fotoPerfilUrl: true } },
  items: { include: { inventory: { include: { compositions: { include: { warehouseItem: true, componentCatalogItem: true } } } }, compositions: { include: { warehouseItem: true, componentCatalogItem: true } } } },
  services: true,
  planning: true,
  logs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
};

exports.getAll = async (req, res) => {
  try {
    const { estado, archived } = req.query;
    const where = {};

    // v60.8: Flexible retrieval for Admins and Ownership filter for Consultants
    if (req.userRole === 'CONSULTOR') {
        where.consultantId = req.userId;
    }

    if (estado) {
        where.estado = estado;
    }

    // Default: only non-archived. If archived='true', only archived.
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        client: { include: { contacts: true } },
        clientContact: true,
        consultant: { select: { id: true, nombre: true, fotoPerfilUrl: true } },
        items: { include: { inventory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const quotationsWithUrls = await Promise.all(quotations.map(async (q) => {
      if (q.consultant?.fotoPerfilUrl) {
        q.consultant.fotoPerfilUrl = await getSignedUrlHelper(q.consultant.fotoPerfilUrl);
      }
      return q;
    }));

    res.json(quotationsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.formalizeByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const { sendByEmail } = req.body;
    const file = req.file;

    if (!file && sendByEmail !== 'true') {
      return res.status(400).json({ error: 'Debes cargar el archivo o seleccionar envío por correo.' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { secureHash: hash },
      include: { client: true }
    });

    if (!quotation) return res.status(404).json({ error: 'Cotización no encontrada' });

    let purchaseOrderUrl = null;
    let purchaseOrderKey = null;
    let newStatus = 'ACCEPTED_PENDING_OC';
    let logMessage = 'El cliente confirmó la propuesta. Quedó pendiente el envío de la OC por correo.';

    if (file) {
      // v34.1: Upload to Railway S3 Bucket (spacious-basketcase)
      const key = `purchase_orders/${Date.now()}_${file.originalname}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      purchaseOrderKey = key;
      purchaseOrderUrl = `${(process.env.AWS_ENDPOINT_URL || 'https://t3.storageapi.dev').replace(/\/$/, '')}/${BUCKET_NAME}/${key}`;
      newStatus = 'APROBADA';
      logMessage = 'El cliente aceptó la propuesta y cargó la Orden de Compra. Estado confirmado como APROBADA.';
    }

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        estado: newStatus,
        purchaseOrderUrl,
        purchaseOrderKey,
        logs: {
          create: {
            message: logMessage
          }
        }
      }
    });

    // Lógica de Notificación (Mock)
    console.log(`[EMAIL NOTIFICATION] ¡Actualización de Propuesta! El cliente ${quotation.client.razon_social} ha ${file ? 'subido la OC' : 'confirmado envío por correo'} para la cotización #Q-${quotation.id.substring(0,6).toUpperCase()}. Nuevo estado: ${newStatus}`);

    res.json({
      message: file
        ? 'Orden de Compra cargada con éxito. Su propuesta ha sido aprobada.'
        : 'Propuesta confirmada. Quedamos a la espera de tu documento por correo.',
      status: newStatus,
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

    if (quotation.consultant?.fotoPerfilUrl) {
      quotation.consultant.fotoPerfilUrl = await getSignedUrlHelper(quotation.consultant.fotoPerfilUrl);
    }

    // v60.9.1: Auto-detection of legacy corruption
    const materialsCount = Array.isArray(quotation.planning?.materiales) ? quotation.planning.materiales.length : 0;
    const isLegacyCorrupted = ['APROBADA', 'ENVIADA', 'EJECUCION', 'CONFIRMED'].includes(quotation.estado) &&
                              quotation.items.length === 0 &&
                              materialsCount > 0;

    res.json({ ...quotation, isLegacyCorrupted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
        clientId,
        clientContactId,
        contactName,
        contactEmail,
        contactPhone,
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
      let isComposition = !!item.isComposition;

      if (item.saveToCatalog && (item.customName || item.inventory?.nombre_comercial)) {
        // v49.5: Fix loss of "Combo DNA" when saving back to catalog
        // If compositions is empty but it's a catalog item, we should try to reuse the source recipe
        let recipeToSave = item.compositions || [];
        if (recipeToSave.length === 0 && item.inventoryId) {
           const source = await prisma.inventory_Commercial.findUnique({
              where: { id: item.inventoryId },
              include: { compositions: true }
           });
           recipeToSave = source?.compositions || [];
        }

        // If it was already a catalog item, we create a NEW one (versioning by creation)
        // to avoid breaking historical quotations that used the previous version.
        const newItem = await prisma.inventory_Commercial.create({
          data: {
            nombre_comercial: item.customName || item.inventory?.nombre_comercial,
            valor_alquiler: parseFloat(item.precio_pactado),
            isExternal: !!item.isExternal,
            isComposition: true,
            vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
            vendorName: item.vendorName || null,
            compositions: {
              create: recipeToSave.map(c => ({
                warehouseItemId: c.warehouseItemId || null,
                componentCatalogItemId: c.componentCatalogItemId || null,
                quantity: parseInt(c.quantity)
              }))
            }
          }
        });
        inventoryId = newItem.id;
        compositions = null; // Links to the new catalog entry
        isComposition = true;
      }

      return {
        inventoryId,
        customName: inventoryId ? null : (item.customName || null),
        description: item.description || null,
        cantidad: parseInt(item.cantidad),
        dias: parseInt(item.dias || 1),
        precio_pactado: parseFloat(item.precio_pactado),
        precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
        isExternal: !!item.isExternal,
        isComposition,
        vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
        vendorName: item.vendorName || null,
        clase_asignada: item.clase_asignada || 'A',
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId || null,
            componentCatalogItemId: c.componentCatalogItemId || null,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      };
    }));

    const quotation = await (async function createWithRetry(retries = 3) {
      try {
        return await prisma.$transaction(async (tx) => {
          const lastQuotation = await tx.quotation.findFirst({
            where: { NOT: { consecutivo: null } },
            orderBy: { consecutivo: 'desc' },
            select: { consecutivo: true }
          });

          const nextConsecutivo = lastQuotation?.consecutivo ? lastQuotation.consecutivo + 1 : 2341;

          return await tx.quotation.create({
            data: {
              clientId,
              clientContactId,
              contactName,
              contactEmail,
              contactPhone,
              consultantId: consultantId || req.userId,
              consecutivo: nextConsecutivo,
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
        });
      } catch (error) {
        // P2002 is Prisma's Unique Constraint violation
        if (error.code === 'P2002' && retries > 0) {
          return createWithRetry(retries - 1);
        }
        throw error;
      }
    })();

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
        clientId,
        clientContactId,
        contactName,
        contactEmail,
        contactPhone,
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
      let isComposition = !!item.isComposition;

      if (item.saveToCatalog && (item.customName || item.inventory?.nombre_comercial)) {
        // v49.5: Fix loss of "Combo DNA" when saving back to catalog
        let recipeToSave = item.compositions || [];
        if (recipeToSave.length === 0 && item.inventoryId) {
           const source = await prisma.inventory_Commercial.findUnique({
              where: { id: item.inventoryId },
              include: { compositions: true }
           });
           recipeToSave = source?.compositions || [];
        }

        const newItem = await prisma.inventory_Commercial.create({
          data: {
            nombre_comercial: item.customName || item.inventory?.nombre_comercial,
            valor_alquiler: parseFloat(item.precio_pactado),
            isExternal: !!item.isExternal,
            isComposition: true,
            vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
            vendorName: item.vendorName || null,
            compositions: {
              create: recipeToSave.map(c => ({
                warehouseItemId: c.warehouseItemId || null,
                componentCatalogItemId: c.componentCatalogItemId || null,
                quantity: parseInt(c.quantity)
              }))
            }
          }
        });
        inventoryId = newItem.id;
        compositions = null;
        isComposition = true;
      }

      return {
        inventoryId,
        customName: inventoryId ? null : (item.customName || null),
        description: item.description || null,
        cantidad: parseInt(item.cantidad),
        dias: parseInt(item.dias || 1),
        precio_pactado: parseFloat(item.precio_pactado),
        precio_dia_adicional: parseFloat(item.precio_dia_adicional || 0),
        isExternal: !!item.isExternal,
        isComposition,
        vendorCost: item.vendorCost !== undefined ? parseFloat(item.vendorCost) : null,
        vendorName: item.vendorName || null,
        clase_asignada: item.clase_asignada || 'A',
        compositions: compositions ? {
          create: compositions.map(c => ({
            warehouseItemId: c.warehouseItemId || null,
            componentCatalogItemId: c.componentCatalogItemId || null,
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      };
    }));

    // v60.9: Secured update via Transaction to prevent accidental data loss
    const quotation = await prisma.$transaction(async (tx) => {
        // 0. Payload Validation - Defensive approach to avoid emptyings
        if (items !== undefined && !Array.isArray(items)) {
           throw new Error("El campo 'items' debe ser un arreglo válido.");
        }
        if (services !== undefined && !Array.isArray(services)) {
           throw new Error("El campo 'services' debe ser un arreglo válido.");
        }

        // 1. Selective cleanup
        if (isSubmittedCollection(items)) {
          await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        }
        if (isSubmittedCollection(services)) {
          await tx.quotationService.deleteMany({ where: { quotationId: id } });
        }

        // 2. Data Sanitization (convert '' to null for FKs)
        const updateData = {
            clientId,
            clientContactId: (clientContactId === '' || clientContactId === undefined) ? null : clientContactId,
            contactName,
            contactEmail,
            contactPhone,
            consultantId: consultantId || undefined,
            nombre_evento: nombre_evento || undefined,
            tipo_evento: tipo_evento || undefined,
            ubicacion: ubicacion || undefined,
            montaje_inicio: montaje_inicio ? new Date(montaje_inicio) : undefined,
            montaje_fin: montaje_fin ? new Date(montaje_fin) : undefined,
            evento_inicio: evento_inicio ? new Date(evento_inicio) : undefined,
            evento_fin: evento_fin ? new Date(evento_fin) : undefined,
            desmontaje_inicio: desmontaje_inicio ? new Date(desmontaje_inicio) : undefined,
            desmontaje_fin: desmontaje_fin ? new Date(desmontaje_fin) : undefined,
            pago_metodo,
            evento_servicio,
            evento_duracion,
            bitacora,
            estado,
            vlrNeto: (isSubmittedCollection(items) || isSubmittedCollection(services)) ? vlrNeto : undefined,
            vlrTotal: (isSubmittedCollection(items) || isSubmittedCollection(services)) ? vlrTotal : undefined
        };

        if (items && items.length > 0) {
          updateData.items = { create: processedItems };
        }

        if (services && services.length > 0) {
          updateData.services = {
            create: services.map(svc => ({
              tipo: svc.tipo,
              descripcion: svc.descripcion,
              cantidad: parseInt(svc.cantidad || 1),
              dias: parseInt(svc.dias || 1),
              precio_pactado: parseFloat(svc.precio_pactado),
              precio_dia_adicional: parseFloat(svc.precio_dia_adicional || 0)
            }))
          };
        }

        // 3. Final atomic update
        const updatedQuotation = await tx.quotation.update({
          where: { id },
          data: {
            ...updateData,
            logs: {
              create: {
                message: 'Cotización actualizada y modificada en el sistema',
                userId: req.userId
              }
            }
          },
          include: { items: true, services: true }
        });

        // 4. v69.0: Automatic re-evaluation of alerts if the quotation is already APROBADA
        if (estado === 'APROBADA' || updatedQuotation.estado === 'APROBADA') {
            await tx.inventoryAlert.deleteMany({ where: { quotationId: id } });
            const newConflicts = await checkAvailability(id);
            if (newConflicts) {
                await tx.inventoryAlert.createMany({
                    data: newConflicts.map(c => ({
                        quotationId: id,
                        inventoryItemId: c.inventoryItemId,
                        productName: c.productName,
                        needed: c.needed,
                        available: c.available,
                        deficit: c.deficit,
                        motivo: c.motivo,
                        startDate: updatedQuotation.montaje_inicio,
                        endDate: updatedQuotation.desmontaje_fin
                    }))
                });
            }
        }

        return updatedQuotation;
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

    // v60.9.1: Auto-detection of legacy corruption
    const materialsCount = Array.isArray(quotation.planning?.materiales) ? quotation.planning.materiales.length : 0;
    const isLegacyCorrupted = ['APROBADA', 'ENVIADA', 'EJECUCION'].includes(quotation.estado) &&
                              quotation.items.length === 0 &&
                              materialsCount > 0;

    res.json({ ...quotation, isLegacyCorrupted });
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
    const { estado, details, force } = req.body;
    const { id } = req.params;

    const current = await prisma.quotation.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Cotización no encontrada' });

    const isBecomingActive = estado === 'APROBADA' || estado === 'EJECUCION';
    let conflicts = null;

    if (isBecomingActive) {
      conflicts = await checkAvailability(id);
      if (!force && conflicts) {
        return res.status(400).json({
          error: 'Conflicto de disponibilidad',
          conflicts
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // v69.0: Strict Alert Lifecycle Management
      // 1. Always clear previous alerts for this quotation to ensure idempotency
      await tx.inventoryAlert.deleteMany({ where: { quotationId: id } });

      // 2. Update status
      const q = await tx.quotation.update({
        where: { id },
        data: {
          estado,
          logs: {
            create: {
              message: `Estado cambiado de ${current.estado} a ${estado}. ${details || (force ? '(Aprobación con sobreventa)' : '')}`,
              userId: req.userId
            }
          }
        }
      });

      // 3. If transitioning to non-approved/active, alerts stay deleted.
      // If forced approval with conflicts, persist new alerts.
      if (force && conflicts && (estado === 'APROBADA' || estado === 'EJECUCION')) {
        await tx.inventoryAlert.createMany({
          data: conflicts.map(c => ({
            quotationId: id,
            inventoryItemId: c.inventoryItemId,
            productName: c.productName,
            needed: c.needed,
            available: c.available,
            deficit: c.deficit,
            motivo: c.motivo,
            startDate: q.montaje_inicio,
            endDate: q.desmontaje_fin
          }))
        });
      }

      return q;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertPlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { cronograma, personal, viaticos, transporte, materiales, presupuesto, observaciones, footer } = req.body;

    const planning = await prisma.planningStep.upsert({
      where: { quotationId: id },
      update: { cronograma, personal, viaticos, transporte, materiales, presupuesto, observaciones, footer },
      create: { quotationId: id, cronograma, personal, viaticos, transporte, materiales, presupuesto, observaciones, footer }
    });

    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function resolveWarehouseRequirements(items) {
  const requirements = {};

  async function resolve(entity, multiplier, visited) {
    // entity can be a QuotationItem, a Composition, or an Inventory_Commercial

    // 1. Check if it's a direct warehouse link
    if (entity.warehouseItemId) {
      const qty = (entity.quantity || 1) * multiplier;
      requirements[entity.warehouseItemId] = (requirements[entity.warehouseItemId] || 0) + qty;
      return;
    }

    // 2. Check for local compositions (One-shot or overridden)
    // IMPORTANT: If it's a QuotationItem and has compositions, we use those INSTEAD of the catalog recipe.
    if (entity.compositions && entity.compositions.length > 0) {
      for (const comp of entity.compositions) {
        await resolve(comp, (entity.cantidad || entity.quantity || 1) * multiplier, visited);
      }
      return; // Stop here if we used local overrides
    }

    // 3. Check if it points to a catalog item (either via inventoryId or componentCatalogItemId)
    const catalogId = entity.inventoryId || entity.componentCatalogItemId;
    if (catalogId) {
      if (visited.has(catalogId)) return; // Prevent infinite loops
      visited.add(catalogId);

      const catalogItem = await prisma.inventory_Commercial.findUnique({
        where: { id: catalogId },
        include: { compositions: true }
      });

      if (catalogItem && !catalogItem.isExternal) {
        if (catalogItem.compositions && catalogItem.compositions.length > 0) {
          for (const comp of catalogItem.compositions) {
            await resolve(comp, (entity.cantidad || entity.quantity || 1) * multiplier, visited);
          }
        } else if (catalogItem.bodegaId) {
          const qty = (entity.cantidad || entity.quantity || 1) * multiplier;
          requirements[catalogItem.bodegaId] = (requirements[catalogItem.bodegaId] || 0) + qty;
        }
      }
      visited.delete(catalogId);
      return;
    }
  }

  for (const item of items) {
    if (item.isExternal) continue;
    await resolve(item, 1, new Set());
  }

  return requirements;
}

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

  // Calculate committed stock by Warehouse Item
  const committed = {};
  for (const overlap of overlaps) {
    const reqs = await resolveWarehouseRequirements(overlap.items);
    for (const [id, qty] of Object.entries(reqs)) {
      committed[id] = (committed[id] || 0) + qty;
    }
  }

  // Check requirements for current quotation
  const needed = await resolveWarehouseRequirements(q.items);
  const conflicts = [];

  for (const [warehouseId, neededQty] of Object.entries(needed)) {
    const warehouseItem = await prisma.inventory_Bodega.findUnique({ where: { id: warehouseId } });
    const totalStock = (warehouseItem.claseA || 0) + (warehouseItem.claseB || 0);
    const alreadyCommitted = committed[warehouseId] || 0;

    if (alreadyCommitted + neededQty > totalStock) {
      // v69.0: Differentiate between Physical Stock Deficit and Overlap Conflict
      const motivo = neededQty > totalStock
        ? "Déficit físico en bodega"
        : "Conflicto por cruce de fechas";

      conflicts.push({
        inventoryItemId: warehouseId,
        productName: warehouseItem.nombre,
        available: totalStock - alreadyCommitted,
        needed: neededQty,
        deficit: (alreadyCommitted + neededQty) - totalStock,
        motivo
      });
    }
  }

  return conflicts.length > 0 ? conflicts : null;
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

    // Restriction: Only BORRADOR, ENVIADA, APROBADA, CANCELADA are allowed
    const allowedStatuses = ['BORRADOR', 'ENVIADA', 'APROBADA', 'CANCELADA'];
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

exports.healFromLogistics = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { planning: true }
    });

    if (!quotation || !quotation.planning?.materiales) {
      return res.status(404).json({ error: 'No se encontraron datos logísticos para reconstruir.' });
    }

    const materiales = quotation.planning.materiales;

    await prisma.$transaction(async (tx) => {
      // 1. Clear any existing items (defensive)
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });

      // 2. Map logistics materials back to commercial items
      const newItems = [];
      for (const mat of materiales) {
        // Find catalog item by name or id if available
        const catalogItem = await tx.inventory_Commercial.findFirst({
           where: {
             OR: [
               { id: mat.originalQuotationItemId || undefined },
               { nombre_comercial: { equals: mat.nombre, mode: 'insensitive' } }
             ]
           }
        });

        newItems.push({
          quotationId: id,
          inventoryId: catalogItem?.id || null,
          customName: catalogItem ? null : mat.nombre,
          cantidad: parseInt(mat.cantidad) || 1,
          dias: 1, // Default fallback
          precio_pactado: catalogItem?.valor_alquiler || 0,
          precio_dia_adicional: (catalogItem?.valor_alquiler || 0) * 0.5,
          isExternal: !!mat.isExternal,
          isComposition: catalogItem?.isComposition || false,
          vendorCost: mat.costo ? parseFloat(mat.costo) : null,
          vendorName: mat.proveedor || null
        });
      }

      await tx.quotationItem.createMany({ data: newItems });

      // 3. Recalculate totals
      const itemsForCalc = await tx.quotationItem.findMany({ where: { quotationId: id } });
      const client = await tx.client.findUnique({ where: { id: quotation.clientId } });
      const { subtotal, total } = calculateTotals(itemsForCalc, [], client?.isTaxExempt);

      await tx.quotation.update({
        where: { id },
        data: {
          vlrNeto: subtotal,
          vlrTotal: total,
          logs: {
            create: {
              message: 'RECONSTRUCCIÓN AUTOMÁTICA: Ítems comerciales recuperados desde la Mesa de Trabajo Logística.',
              userId: req.userId
            }
          }
        }
      });
    });

    res.json({ message: 'Cotización reconstruida con éxito.' });
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
