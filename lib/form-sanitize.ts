import { sanitize, sanitizeHtml } from './sanitize';

/**
 * Sanitize form data before sending to API
 * @param formData - Form data object
 * @returns Sanitized form data
 */
export function sanitizeFormData(formData: any): any {
  if (!formData) return formData;

  const sanitized = { ...formData };

  // Sanitize text fields
  if (sanitized.title) sanitized.title = sanitize(sanitized.title);
  if (sanitized.model) sanitized.model = sanitize(sanitized.model);
  if (sanitized.sku) sanitized.sku = sanitize(sanitized.sku);
  if (sanitized.manufacturer) sanitized.manufacturer = sanitize(sanitized.manufacturer);
  if (sanitized.colors) sanitized.colors = sanitize(sanitized.colors);
  if (sanitized.sizes) sanitized.sizes = sanitize(sanitized.sizes);
  if (sanitized.description) sanitized.description = sanitizeHtml(sanitized.description);
  if (sanitized.slug) sanitized.slug = sanitize(sanitized.slug);
  if (sanitized.name) sanitized.name = sanitize(sanitized.name);
  if (sanitized.lastname) sanitized.lastname = sanitize(sanitized.lastname);
  if (sanitized.email) sanitized.email = sanitize(sanitized.email);

  return sanitized;
}
