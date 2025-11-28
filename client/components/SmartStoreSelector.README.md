# SmartStoreSelector Component

## Overview

The `SmartStoreSelector` component provides an intelligent, guided shopping experience that helps users select stores and paste product URLs with automatic validation and geo-redirect correction.

## Features

- **Store Selection Grid**: Visual grid of supported stores with selection feedback
- **Contextual Instructions**: Store-specific shopping tips and guidance
- **URL Auto-Correction**: Automatically converts international URLs to US versions
- **Real-time Validation**: Instant feedback on URL validity
- **Analytics Tracking**: Comprehensive event tracking for optimization
- **Responsive Design**: Mobile-first design with adaptive layouts

## Usage

```tsx
import { SmartStoreSelector } from '@/components/SmartStoreSelector';

function MyComponent() {
  const handleUrlSubmit = (url: string) => {
    // Handle the validated/corrected URL
    console.log('Valid URL submitted:', url);
  };

  return <SmartStoreSelector onUrlSubmit={handleUrlSubmit} />;
}
```

## Props

| Prop          | Type                    | Required | Description                                  |
| ------------- | ----------------------- | -------- | -------------------------------------------- |
| `onUrlSubmit` | `(url: string) => void` | Yes      | Callback fired when a valid URL is submitted |

## Supported Stores

Currently supports 6 major stores with US-specific URLs and instructions:

- **Amazon**: `amazon.com/?currency=USD&language=en_US`
- **Walmart**: `walmart.com/`
- **Apple**: `apple.com/us/shop`
- **Adidas**: `adidas.com/us/`
- **IKEA**: `ikea.com/us/en/`
- **Gucci**: `gucci.com/us/en/`

## URL Validation Logic

### International URL Detection

The component uses regex patterns to detect international store URLs:

```typescript
const internationalPatterns = [
  {
    pattern:
      /amazon\.(co\.uk|de|fr|it|es|ca|com\.mx|co\.jp|in|com\.br|com\.au|ae|sg|sa|com\.tr|nl|se|pl|eg|com\.ng)/,
    name: 'Amazon',
  },
  { pattern: /walmart\.(ca|com\.mx)/, name: 'Walmart' },
  { pattern: /adidas\.(?!com$)[a-z.]+/, name: 'Adidas' },
  { pattern: /apple\.[a-z]{2,}(?!\.com\/us)/, name: 'Apple' },
  { pattern: /ikea\.[a-z]{2,}(?!\.com\/us)/, name: 'IKEA' },
  { pattern: /gucci\.[a-z]{2,}(?!\.com\/us)/, name: 'Gucci' },
];
```

### Auto-Correction Examples

| Input URL                | Corrected URL             | Action          |
| ------------------------ | ------------------------- | --------------- |
| `amazon.co.uk/dp/B123`   | `amazon.com/dp/B123`      | ASIN preserved  |
| `walmart.ca/product/456` | `walmart.com/product/456` | Path preserved  |
| `adidas.de/shoes`        | `adidas.com/us/shoes`     | Converted to US |
| `apple.co.uk/macbook`    | `apple.com/us/macbook`    | Converted to US |

## Analytics Events

The component tracks the following events (logged to console for now):

```typescript
// Store selection
console.log('analytics:store_selected', {
  storeId: 'amazon',
  storeName: 'Amazon',
});

// URL auto-correction
console.log('analytics:url_auto_corrected', {
  originalDomain: 'amazon.co.uk',
  convertedDomain: 'amazon.com',
  storeName: 'Amazon',
});

// Successful validation
console.log('analytics:url_validated', {
  domain: 'amazon.com',
  isValid: true,
  wasCorrected: false,
});

// Validation failure
console.log('analytics:url_validation_failed', {
  url: 'invalid-url',
  reason: 'invalid_url_format',
});
```

## Adding New Stores

To add a new store:

1. **Add store data** to the `STORES` array:

```typescript
{
  id: 'newstore',
  name: 'New Store',
  logo: '/newstore.png',
  usUrl: 'https://www.newstore.com/us/',
  tips: [
    'Instruction 1',
    'Instruction 2',
    'Instruction 3'
  ]
}
```

2. **Add URL pattern** to `internationalPatterns`:

```typescript
{
  pattern: /newstore\.[a-z]{2,}(?!\.com\/us)/,
  name: 'New Store',
  convert: (u: string) => u.replace(/newstore\.[a-z.]+/, 'newstore.com/us')
}
```

3. **Update tests** in `SmartStoreSelector.test.tsx`

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- **Colors**: Blue theme (`blue-50`, `blue-500`, `blue-600`, etc.)
- **Layout**: Responsive grid (`grid-cols-2 md:grid-cols-3`)
- **Animations**: Smooth transitions and slide-in effects
- **Icons**: Lucide React icons

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG compliant color ratios

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Clipboard API**: Fallback for older browsers

## Performance

- **Bundle Size**: ~5KB gzipped
- **Runtime**: Client-side only, no server requests
- **Memory**: Minimal state management
- **Re-renders**: Optimized with proper React patterns

## Troubleshooting

### Common Issues

**URLs not auto-correcting:**

- Check regex patterns match the domain structure
- Verify negative lookaheads exclude US URLs correctly

**Store logos not loading:**

- Ensure logo files exist in `/public/` directory
- Check file paths and extensions

**Analytics not tracking:**

- Check browser console for `analytics:` prefixed logs
- Verify event structure matches expected format

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'SmartStoreSelector'`

## Future Enhancements

- **Video Tutorials**: Store-specific shopping videos
- **Recently Used**: Show last 3 selected stores
- **Advanced Parsing**: Extract product details from URLs
- **Multi-language**: Localized instructions
- **A/B Testing**: Different instruction variants

## Testing

Run tests with:

```bash
npm test SmartStoreSelector.test.tsx
```

Test coverage includes:

- URL conversion accuracy
- International domain detection
- Edge cases and error handling
- Component rendering and interactions

## Maintenance

**Monthly Tasks:**

- Test store URLs still work
- Check for new international domains
- Update regex patterns as needed
- Review analytics data for optimization

**Quarterly Tasks:**

- Add new popular stores
- Update store-specific instructions
- Performance optimization
- Accessibility audits
