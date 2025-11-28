import { describe, it, expect } from '@jest/globals';

// Mock URL validation logic from SmartStoreSelector
const validateAndConvertUrl = (url: string) => {
  if (!url || url.length < 10) {
    return { status: 'idle', suggestion: '', convertedUrl: url };
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');

    // Check for international domains and convert
    const internationalPatterns = [
      {
        pattern:
          /amazon\.(co\.uk|de|fr|it|es|ca|com\.mx|co\.jp|in|com\.br|com\.au|ae|sg|sa|com\.tr|nl|se|pl|eg|com\.ng)/,
        name: 'Amazon',
        convert: (u: string) => {
          const asin = u.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)?.[1];
          if (asin) {
            return `https://www.amazon.com/dp/${asin}`;
          }
          return u.replace(/amazon\.[a-z.]+/, 'amazon.com');
        },
      },
      {
        pattern: /walmart\.(ca|com\.mx)/,
        name: 'Walmart',
        convert: (u: string) => u.replace(/walmart\.[a-z.]+/, 'walmart.com'),
      },
      {
        pattern: /adidas\.(?!com$)[a-z.]+/,
        name: 'Adidas',
        convert: (u: string) => u.replace(/adidas\.[a-z.]+/, 'adidas.com/us'),
      },
      {
        pattern: /apple\.[a-z]{2,}(?!\.com\/us)/,
        name: 'Apple',
        convert: (u: string) => u.replace(/apple\.[a-z.]+/, 'apple.com/us'),
      },
      {
        pattern: /ikea\.[a-z]{2,}(?!\.com\/us)/,
        name: 'IKEA',
        convert: (u: string) => u.replace(/ikea\.[a-z.]+/, 'ikea.com/us/en'),
      },
      {
        pattern: /gucci\.[a-z]{2,}(?!\.com\/us)/,
        name: 'Gucci',
        convert: (u: string) => u.replace(/gucci\.[a-z.]+/, 'gucci.com/us/en'),
      },
    ];

    for (const { pattern, name, convert } of internationalPatterns) {
      if (pattern.test(domain)) {
        const convertedUrl = convert(url);
        return {
          status: 'converted',
          suggestion: `This looks like a ${name} link from outside the US. We've converted it to the US version for accurate pricing.`,
          convertedUrl,
          originalDomain: domain,
          storeName: name,
        };
      }
    }

    // URL looks good for US shopping
    return {
      status: 'valid',
      suggestion: '',
      convertedUrl: url,
      domain,
    };
  } catch {
    return {
      status: 'invalid',
      suggestion: 'Please enter a valid product URL',
      convertedUrl: url,
    };
  }
};

describe('SmartStoreSelector URL Validation', () => {
  describe('Amazon URL conversion', () => {
    it('should convert UK Amazon URL with ASIN', () => {
      const result = validateAndConvertUrl(
        'https://www.amazon.co.uk/dp/B08N5WRWNW'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
      expect(result.storeName).toBe('Amazon');
    });

    it('should convert German Amazon URL', () => {
      const result = validateAndConvertUrl('https://www.amazon.de/product/123');
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.amazon.com/product/123');
      expect(result.storeName).toBe('Amazon');
    });

    it('should leave US Amazon URL unchanged', () => {
      const result = validateAndConvertUrl(
        'https://www.amazon.com/dp/B08N5WRWNW'
      );
      expect(result.status).toBe('valid');
      expect(result.convertedUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
    });
  });

  describe('Walmart URL conversion', () => {
    it('should convert Canadian Walmart URL', () => {
      const result = validateAndConvertUrl(
        'https://www.walmart.ca/product/123'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.walmart.com/product/123');
      expect(result.storeName).toBe('Walmart');
    });

    it('should leave US Walmart URL unchanged', () => {
      const result = validateAndConvertUrl(
        'https://www.walmart.com/product/123'
      );
      expect(result.status).toBe('valid');
      expect(result.convertedUrl).toBe('https://www.walmart.com/product/123');
    });
  });

  describe('Adidas URL conversion', () => {
    it('should convert German Adidas URL', () => {
      const result = validateAndConvertUrl('https://www.adidas.de/product/123');
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.adidas.com/us/product/123');
      expect(result.storeName).toBe('Adidas');
    });

    it('should leave US Adidas URL unchanged', () => {
      const result = validateAndConvertUrl(
        'https://www.adidas.com/us/product/123'
      );
      expect(result.status).toBe('valid');
      expect(result.convertedUrl).toBe('https://www.adidas.com/us/product/123');
    });
  });

  describe('Apple URL conversion', () => {
    it('should convert UK Apple URL', () => {
      const result = validateAndConvertUrl(
        'https://www.apple.co.uk/shop/product'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.apple.com/us/shop/product');
      expect(result.storeName).toBe('Apple');
    });
  });

  describe('IKEA URL conversion', () => {
    it('should convert German IKEA URL', () => {
      const result = validateAndConvertUrl('https://www.ikea.de/product/123');
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe(
        'https://www.ikea.com/us/en/product/123'
      );
      expect(result.storeName).toBe('IKEA');
    });
  });

  describe('Gucci URL conversion', () => {
    it('should convert UK Gucci URL', () => {
      const result = validateAndConvertUrl(
        'https://www.gucci.co.uk/product/123'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe(
        'https://www.gucci.com/us/en/product/123'
      );
      expect(result.storeName).toBe('Gucci');
    });
  });

  describe('Invalid URLs', () => {
    it('should reject invalid URL format', () => {
      const result = validateAndConvertUrl('not-a-url');
      expect(result.status).toBe('idle'); // Short/invalid URLs return idle
    });

    it('should handle empty URLs', () => {
      const result = validateAndConvertUrl('');
      expect(result.status).toBe('idle');
    });

    it('should handle short URLs', () => {
      const result = validateAndConvertUrl('http://x');
      expect(result.status).toBe('idle');
    });
  });

  describe('Edge cases', () => {
    it('should handle URLs with www prefix', () => {
      const result = validateAndConvertUrl(
        'https://www.amazon.co.uk/dp/B08N5WRWNW'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
    });

    it('should handle URLs without www prefix', () => {
      const result = validateAndConvertUrl(
        'https://amazon.co.uk/dp/B08N5WRWNW'
      );
      expect(result.status).toBe('converted');
      expect(result.convertedUrl).toBe('https://www.amazon.com/dp/B08N5WRWNW');
    });
  });
});
