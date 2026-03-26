let mlToken = null;
let mlTokenExpiry = 0;

async function getMLToken() {
  if (mlToken && Date.now() < mlTokenExpiry) return mlToken;
  const r = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${process.env.ML_APP_ID}&client_secret=${process.env.ML_SECRET}`
  });
  const data = await r.json();
  mlToken = data.access_token;
  mlTokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return mlToken;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 6 } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta parametro q' });

  try {
    let dolarBlue = 1298;
    try {
      const dolarRes = await fetch('https://dolarapi.com/v1/dolares/blue');
      const dolarData = await dolarRes.json();
      if (dolarData.venta) dolarBlue = dolarData.venta;
    } catch {}

    const token = "APP_USR-4981921933814308-032616-1482df7f6b845334671997ba0b43e0a9-172235955";
    const mlUrl = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=${limit}&condition=new`;
    const mlRes = await fetch(mlUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!mlRes.ok) throw new Error(`MercadoLibre respondio ${mlRes.status}`);

    const mlData = await mlRes.json();
    const items = (mlData.results || []).map(item => ({
      id: item.id,
      titulo: item.title,
      precio: Math.round(item.price),
      precio_usd: Math.round(item.price / dolarBlue),
      envio_gratis: item.shipping?.free_shipping || false,
      vendedor: item.seller?.nickname || '',
      thumbnail: (item.thumbnail || '').replace('http://', 'https://'),
      link: item.permalink,
      ubicacion: item.seller_address?.city?.name || item.seller_address?.state?.name || '',
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
