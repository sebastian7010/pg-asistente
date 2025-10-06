// server.js
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_WHATSAPP_FROM;
const ADMIN = process.env.ADMIN_WHATSAPP;

function includesAny(text, keywords) {
  const t = (text || '').toLowerCase();
  return keywords.some(k => t.includes(k));
}

app.post('/whatsapp/webhook', async (req, res) => {
  const twiml = new MessagingResponse();
  const incoming = (req.body.Body || '').trim();
  const from = req.body.From;

  const askPago  = includesAny(incoming, ['pago','pse','nequi','davivienda','consignar','transferencia','método de pago','metodo de pago','formas de pago']);
  const askEnvio = includesAny(incoming, ['tiempo','tarda','cuando llega','cuándo llega','llegar','entrega','envío','envio']);
  const closeSale= includesAny(incoming, ['confirmo compra','cerrar venta','ya pagué','ya page','ya hice el pago','finalizar compra','comprar ya','listo, compro']);

  if (askPago) {
    twiml.message('¡Claro! Puedes pagar por *Nequi*, *PSE* y *Davivienda*. ¿Cuál método te sirve? Puedo enviarte los datos por aquí.');
  } else if (askEnvio) {
    twiml.message('Entregamos en *menos de 10 horas* según tu ubicación en Antioquia. Dime tu *barrio/municipio* y te confirmo la hora estimada.');
  } else if (closeSale) {
    try {
      await client.messages.create({ from: FROM, to: ADMIN, body: `✅ Venta confirmada por ${from}. Revisa el chat y despacha el pedido.` });
    } catch (e) { console.error('Error avisando al admin:', e.message); }
    twiml.message('¡Gracias! ������ Hemos registrado tu compra. Te enviaremos la confirmación y la hora estimada de entrega enseguida.');
  } else {
    twiml.message('¡Hola! Soy el asistente de *Perrote y Gatote*. Puedo ayudarte con *métodos de pago* (Nequi/PSE/Davivienda) y *tiempos de entrega* (<10 h en Antioquia). ¿Quieres saber *cómo pagar* o *cuándo llega*?');
  }

  res.type('text/xml').send(twiml.toString());
});

app.listen(process.env.PORT || 3008, () => {
  console.log(`PG Asistente WhatsApp escuchando en puerto ${process.env.PORT || 3008}`);
});
