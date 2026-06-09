import DOMPurify from 'dompurify';

function stripBackgroundStyles(html: string): string {
  if (typeof window === 'undefined') {
    return html.replace(/\sbackground(?:-color)?\s*:[^;"']*;?/gi, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    element.style.removeProperty('background');
    element.style.removeProperty('background-color');

    if (!element.getAttribute('style')?.trim()) {
      element.removeAttribute('style');
    }
  });

  template.content.querySelectorAll('[bgcolor]').forEach((element) => {
    element.removeAttribute('bgcolor');
  });

  return template.innerHTML;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#x60;');
}

function sanitizeHtmlWithoutDom(
  html: string,
  allowedTags: string[],
  allowedAttributes: string[]
): string {
  const allowedTagSet = new Set(allowedTags);
  const allowedAttributeSet = new Set(allowedAttributes);
  let sanitized = '';
  let lastIndex = 0;
  const tagPattern = /<\/?([a-z0-9]+)([^>]*)>/gi;
  const attributePattern = /([a-z0-9:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

  html.replace(tagPattern, (match, rawTagName, rawAttributes, offset) => {
    sanitized += escapeHtml(html.slice(lastIndex, offset));
    lastIndex = offset + match.length;

    const tagName = String(rawTagName).toLowerCase();
    if (!allowedTagSet.has(tagName)) {
      return '';
    }

    const isClosingTag = match.startsWith('</');
    if (isClosingTag) {
      sanitized += `</${tagName}>`;
      return '';
    }

    const attributes: string[] = [];
    String(rawAttributes || '').replace(
      attributePattern,
      (_attributeMatch, rawName, _rawValue, doubleQuotedValue, singleQuotedValue, unquotedValue) => {
        const attributeName = String(rawName).toLowerCase();
        if (!allowedAttributeSet.has(attributeName) || attributeName === 'style') {
          return '';
        }

        const attributeValue = String(
          doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? ''
        );
        attributes.push(`${attributeName}="${escapeAttribute(attributeValue)}"`);
        return '';
      }
    );

    sanitized += `<${tagName}${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''}>`;
    return '';
  });

  sanitized += escapeHtml(html.slice(lastIndex));
  return sanitized;
}

/**
 * Enhanced function to sanitize text and prevent XSS
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
export function sanitize(text: string | null | undefined): string {
  if (!text) return '';
  
  // For client-side, use DOMPurify with strict settings
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      FORBID_TAGS: ['script', 'img', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup', 'onkeypress']
    });
  }
  
  // For server-side, use comprehensive escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Sanitize HTML content that needs to preserve some formatting
 * @param text - The HTML text to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(text: string | null | undefined): string {
  if (!text) return '';

  const allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'b',
    'i',
    'span',
    'font',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'div',
  ];
  const allowedAttributes = ['style', 'class', 'data-list', 'color', 'face'];

  // For client-side, use DOMPurify with limited allowed tags
  if (typeof window !== 'undefined') {
    return stripBackgroundStyles(DOMPurify.sanitize(text, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      KEEP_CONTENT: true,
      FORBID_TAGS: ['script', 'img', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup', 'onkeypress']
    }));
  }
  
  return sanitizeHtmlWithoutDom(text, allowedTags, allowedAttributes);
}
