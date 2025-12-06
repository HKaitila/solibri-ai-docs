// /api/zendesk-articles.js
export default async function handler(req, res) {
  const email = process.env.ZENDESK_EMAIL_TOKEN;
  const apiKey = process.env.ZENDESK_API_TOKEN;
  const auth = Buffer.from(`${email}/token:${apiKey}`).toString('base64');

  try {
    const response = await fetch(
      'https://solibri.zendesk.com/api/v2/help_center/en-us/articles.json',
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
