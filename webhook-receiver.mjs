#!/usr/bin/env node

/**
 * Webhook Receiver - Recebe agendamentos do site profissional (psicologo.manus.space)
 * e os sincroniza com clinica-psico via tRPC API
 * 
 * Uso: node webhook-receiver.mjs
 * Porta padrão: 3001
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = process.env.WEBHOOK_PORT || 3001;
const TRPC_BASE_URL = process.env.TRPC_BASE_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || '';

/**
 * Faz uma chamada HTTP POST para o endpoint tRPC
 */
async function callTRPC(procedure, data) {
  const url = new URL(`/api/trpc/${procedure}`, TRPC_BASE_URL);
  
  // tRPC espera o formato: { input: {...} }
  const payload = {
    input: {
      ...data,
      token: API_TOKEN,
    },
  };

  const payloadStr = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr),
      },
    };

    // Usar https ou http baseado na URL
    const httpModule = url.protocol === 'https:' ? https : http;

    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, body: result });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

/**
 * Servidor HTTP que recebe webhooks
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      console.log(`[${new Date().toISOString()}] Webhook recebido:`, data);

      // Chamar tRPC para criar agendamento direto
      const result = await callTRPC('webhooks.createDirectBooking', {
        customer_id: data.customer_id || data.email,
        customer_name: data.customer_name || data.name,
        customer_email: data.customer_email || data.email,
        customer_phone: data.customer_phone || data.phone,
        appointment_date: data.appointment_date || data.date,
        appointment_time: data.appointment_time || data.time,
        service_type: data.service_type || data.consultationType || 'consultation',
        notes: data.notes || data.observations,
        session_type: data.session_type || data.modality || 'presencial',
      });

      console.log(`[${new Date().toISOString()}] Resposta tRPC:`, result);

      if (result.status === 200 || (result.body && result.body.result && result.body.result.data && result.body.result.data.success)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Agendamento sincronizado' }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.body.error || 'Erro ao sincronizar' }));
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Webhook Receiver rodando em http://localhost:${PORT}`);
  console.log(`📡 Encaminhando para: ${TRPC_BASE_URL}`);
  console.log(`🔑 Token API: ${API_TOKEN ? '✓ Configurado' : '✗ Não configurado'}`);
  console.log(`\nEndpoint: POST http://localhost:${PORT}/`);
  console.log(`\nExemplo de payload:`);
  console.log(JSON.stringify({
    customer_id: 'email@exemplo.com',
    customer_name: 'João Silva',
    customer_email: 'email@exemplo.com',
    customer_phone: '11999999999',
    appointment_date: '2026-05-10',
    appointment_time: '14:00',
    service_type: 'Avaliação Neuropsicológica',
    session_type: 'presencial',
    notes: 'Observações do cliente',
  }, null, 2));
});

process.on('SIGINT', () => {
  console.log('\n✅ Servidor encerrado');
  process.exit(0);
});
