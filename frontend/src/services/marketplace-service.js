import { peticion } from './api-service.js';

export function getListings() {
  return peticion('/marketplace');
}

export function getAllListings() {
  return peticion('/marketplace/todos');
}

export function createListing(datos) {
  return peticion('/marketplace', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function estimateListing(datos) {
  return peticion('/marketplace/estimate', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function updateListing(id, datos) {
  return peticion(`/marketplace/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

export function deleteListing(id) {
  return peticion(`/marketplace/${id}`, {
    method: 'DELETE',
  });
}

export default {
  getListings,
  getAllListings,
  createListing,
  updateListing,
  estimateListing,
  deleteListing,
};
