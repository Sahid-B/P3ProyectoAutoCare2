const request = require('supertest');
const app = require('../app');

describe('API Endpoints - AutoCare Backend', () => {
  it('GET /api/health debe responder con el estado del servicio', async () => {
    const respuesta = await request(app).get('/api/health');
    expect([200, 503]).toContain(respuesta.statusCode);
    expect(respuesta.body.project).toBe('AutoCare');
    expect(respuesta.body.api).toBe('online');
  });

  it('GET / debe responder con informacion del proyecto', async () => {
    const respuesta = await request(app).get('/');
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.project).toBe('AutoCare');
  });

  it('GET /api/vehicles sin token debe rechazar con 401', async () => {
    const respuesta = await request(app).get('/api/vehicles');
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  it('GET /api/maintenances sin token debe rechazar con 401', async () => {
    const respuesta = await request(app).get('/api/maintenances');
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });
});
