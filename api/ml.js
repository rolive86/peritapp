module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 6 } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta parametro q' });

  try {
    const token = "APP_USR-4981921933814308-032616-1482df7f6b845334671997ba0b43e0a9-172235955";
    
    const mlUrl = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=${limit}&condition=new`;
    
    const mlRes = await fetch(mlUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const mlText = await mlRes.text();
    
    if (!mlRes.ok) {
      return res.status(500).json({ 
        error: `ML respondio ${mlRes.status}`, 
        body: mlText.substring(0, 500),
        url: mlUrl
      });
    }

    const mlData = JSON.parse(mlText);
    const items = (mlData.results || []).map(item => ({
      id: item.id,
      titulo: item.title,
      precio: Math.round(item.price),
      precio_usd: Math.round(item.price / 1298),
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
      dolar_blue: 1298,
    });

  } catch (err) {
    return res.status(500).json({ 
      error: err.message,
      stack: err.stack?.substring(0, 300)
    });
  }
};
