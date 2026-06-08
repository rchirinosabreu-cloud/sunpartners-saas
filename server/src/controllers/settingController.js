const prisma = require('../db');

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.globalSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
};

exports.getSettingByKey = async (req, res) => {
  const { key } = req.params;
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { key }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

exports.updateSetting = async (req, res) => {
  const { key, value } = req.body;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const setting = await prisma.globalSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};
