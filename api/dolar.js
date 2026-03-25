// api/dolar.js — Proxy para dolarapi.com
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const [blueRes, oficialRes] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares/blue', { timeout: 4000 }),
      fetch('https://dolarapi.com/v1/dolares/oficial', { timeout: 4000 }),
    ]);

    const [blue, oficial] = await Promise.all([blueRes.json(), oficialRes.json()]);

    return res.status(200).json({
      blue: blue.venta,
      blue_compra: blue.compra,
      oficial: oficial.venta,
      oficial_compra: oficial.compra,
      fecha: blue.fechaActualizacion,
    });
  } catch (err) {
    // Fallback con valores de referencia
    return res.status(200).json({ blue: 1298, oficial: 1247, fallback: true });
  }
};
