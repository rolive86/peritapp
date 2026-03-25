// api/ml.js — Proxy para MercadoLibre Argentina
// La API pública de ML no requiere auth, pero el llamado debe ir desde el servidor (CORS)



module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 6 } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta parámetro q' });

  try {
    // Obtener cotización del dólar para conversión
    let dolarBlue = 1298;
    try {
      const dolarRes = await fetch('https://dolarapi.com/v1/dolares/blue', { timeout: 3000 });
      const dolarData = await dolarRes.json();
      if (dolarData.venta) dolarBlue = dolarData.venta;
    } catch { /* usar fallback */ }

    // Buscar en ML Argentina — MLA = Argentina
    // Filtro condition=new para evitar usados
    const mlUrl = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=${limit}&condition=new`;

    const mlRes = await fetch(mlUrl, {
      headers: {
        'User-Agent': 'PeritApp/1.0 (peritaje de siniestros)',
        'Accept': 'application/json'
      },
      timeout: 8000
    });

    if (!mlRes.ok) {
      throw new Error(`MercadoLibre respondió ${mlRes.status}`);
    }

    const mlData = await mlRes.json();

    const items = (mlData.results || []).map(item => ({
      id: item.id,
      titulo: item.title,
      precio: Math.round(item.price),
      precio_usd: Math.round(item.price / dolarBlue),
      moneda: item.currency_id,
      envio_gratis: item.shipping?.free_shipping || false,
      condicion: item.condition,
      vendedor: item.seller?.nickname || 'Vendedor',
      thumbnail: (item.thumbnail || '').replace('http://', 'https://'),
      link: item.permalink,
      ubicacion: item.seller_address?.city?.name || item.seller_address?.state?.name || '',
      ventas: item.sold_quantity || 0,
    }));

    return res.status(200).json({
      items,
      total: mlData.paging?.total || 0,
      query: q,
      dolar_blue: dolarBlue,
    });

  } catch (err) {
    console.error('[ML] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
