'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  HelpCircle,
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
  logo: string;
  usUrl: string;
  tips: string[];
}

const STORES: Store[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '/amazon.png',
    usUrl: 'https://www.amazon.com/?currency=USD&language=en_US',
    tips: [
      'Look for "Deliver to" at the top and select a US address',
      'Check that prices show in $ (USD)',
      'Find your product, then copy the URL from the address bar',
    ],
  },
  {
    id: 'walmart',
    name: 'Walmart',
    logo: '/walmart.png',
    usUrl: 'https://www.walmart.com/',
    tips: [
      'Walmart should automatically show US prices',
      'After finding your product, copy the full URL',
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: '/Apples.png',
    usUrl: 'https://www.apple.com/us/shop',
    tips: [
      'Make sure you see "United States" in the top bar',
      'Browse products, then copy the URL of the item you want',
    ],
  },
  {
    id: 'adidas',
    name: 'Adidas',
    logo: '/adidas.png',
    usUrl: 'https://www.adidas.com/us/',
    tips: [
      'Check the country selector shows "United States"',
      'Prices should be in USD ($)',
    ],
  },
  {
    id: 'ikea',
    name: 'IKEA',
    logo: '/Ikea.png',
    usUrl: 'https://www.ikea.com/us/en/',
    tips: [
      'Select "United States" if prompted',
      'Copy the product URL after finding your item',
    ],
  },
  {
    id: 'gucci',
    name: 'Gucci',
    logo: '/gucci.png',
    usUrl: 'https://www.gucci.com/us/en/',
    tips: [
      'Ensure "United States" is selected in the country menu',
      'Prices should display in USD',
    ],
  },
];

interface SmartStoreSelectorProps {
  onUrlSubmit: (url: string) => void;
}

export function SmartStoreSelector({ onUrlSubmit }: SmartStoreSelectorProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState<'idle' | 'valid' | 'invalid'>(
    'idle'
  );
  const [suggestion, setSuggestion] = useState('');

  const handleStoreClick = (store: Store) => {
    setSelectedStore(store);
    setShowInstructions(true);
    // Analytics: Track store selection
    console.log('analytics:store_selected', {
      storeId: store.id,
      storeName: store.name,
    });
    // Open store in new tab
    window.open(store.usUrl, '_blank');
  };

  const validateAndConvertUrl = (url: string) => {
    if (!url || url.length < 10) {
      setUrlStatus('idle');
      setSuggestion('');
      return;
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
          convert: (u: string) =>
            u.replace(/gucci\.[a-z.]+/, 'gucci.com/us/en'),
        },
      ];

      for (const { pattern, name, convert } of internationalPatterns) {
        if (pattern.test(domain)) {
          const convertedUrl = convert(url);
          setSuggestion(
            `This looks like a ${name} link from outside the US. We've converted it to the US version for accurate pricing.`
          );
          setProductUrl(convertedUrl);
          setUrlStatus('valid');
          // Analytics: Track URL auto-correction
          console.log('analytics:url_auto_corrected', {
            originalDomain: domain,
            convertedDomain: new URL(convertedUrl).hostname.replace('www.', ''),
            storeName: name,
          });
          setTimeout(() => onUrlSubmit(convertedUrl), 500);
          return;
        }
      }

      // URL looks good for US shopping
      setUrlStatus('valid');
      setSuggestion('');
      // Analytics: Track successful URL validation
      console.log('analytics:url_validated', {
        domain: domain,
        isValid: true,
        wasCorrected: false,
      });
      onUrlSubmit(url);
    } catch {
      setUrlStatus('invalid');
      setSuggestion('Please enter a valid product URL');
      // Analytics: Track invalid URL
      console.log('analytics:url_validation_failed', {
        url: url,
        reason: 'invalid_url_format',
      });
    }
  };

  const handleUrlChange = (url: string) => {
    setProductUrl(url);
    validateAndConvertUrl(url);
  };

  const copyToClipboard = async () => {
    if (selectedStore) {
      try {
        await navigator.clipboard.writeText(selectedStore.usUrl);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedStore.usUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className='space-y-6'>
      {/* Step 1: Store Selection */}
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
          <span className='flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-900 text-sm font-bold'>
            1
          </span>
          Choose a Store
        </h3>

        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {STORES.map(store => (
            <button
              key={store.id}
              onClick={() => handleStoreClick(store)}
              className={`
                relative flex flex-col items-center gap-3 p-4 border-2 rounded-xl hover:cursor-pointer
                transition-all hover:shadow-md hover:scale-105
                ${
                  selectedStore?.id === store.id
                    ? 'border-purple-800 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-800'
                }
              `}
            >
              <img
                src={store.logo}
                alt={store.name}
                className='h-10 object-contain'
              />
              <span className='text-sm font-medium'>{store.name}</span>
              {selectedStore?.id === store.id && (
                <CheckCircle className='absolute top-2 right-2 w-5 h-5 text-purple-900' />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Instructions (appears after store selection) */}
      {showInstructions && selectedStore && (
        <div className='bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-800 rounded-xl p-5 animate-in slide-in-from-top duration-300'>
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0'>
              <div className='flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-900 text-sm font-bold'>
                2
              </div>
            </div>
            <div className='flex-1'>
              <h4 className='font-semibold text-purple-900 mb-2 flex items-center gap-2'>
                Shopping on {selectedStore.name}
                <ExternalLink className='w-4 h-4' />
              </h4>

              <ul className='space-y-2 mb-4'>
                {selectedStore.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className='text-sm text-purple-800 flex items-start gap-2'
                  >
                    <span className='text-purple-800 font-bold'>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <div className=' items-center gap-2 p-3 bg-white/60 rounded-lg border border-purple-200 hidden'>
                <code className='text-xs text-purple-900 flex-1 truncate'>
                  {selectedStore.usUrl}
                </code>
                <button
                  onClick={copyToClipboard}
                  className='p-1.5 hover:bg-blue-100 rounded transition-colors'
                  title='Copy URL'
                >
                  <Copy className='w-4 h-4 text-purple-800' />
                </button>
                <button
                  onClick={() => window.open(selectedStore.usUrl, '_blank')}
                  className='p-1.5 hover:bg-blue-100 rounded transition-colors'
                  title='Open store'
                >
                  <ExternalLink className='w-4 h-4 text-purple-800' />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: URL Input */}
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
          <span className='flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-sm font-bold'>
            3
          </span>
          Paste Product URL
        </h3>

        <div className='relative'>
          <input
            type='url'
            value={productUrl}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder='https://www.amazon.com/product/...'
            className={`
              w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm
              focus:outline-none focus:ring-1 focus:ring-purple-800/20
              transition-all
              ${urlStatus === 'valid' ? 'border-green-400 bg-green-50' : ''}
              ${urlStatus === 'invalid' ? 'border-red-400 bg-red-50' : ''}
              ${urlStatus === 'idle' ? 'border-gray-300' : ''}
            `}
          />
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            {urlStatus === 'valid' && (
              <CheckCircle className='w-5 h-5 text-green-500' />
            )}
            {urlStatus === 'invalid' && (
              <AlertCircle className='w-5 h-5 text-red-500' />
            )}
          </div>
        </div>

        {/* Validation feedback */}
        {suggestion && (
          <div
            className={`
            mt-2 p-3 rounded-lg text-sm flex items-start gap-2
            ${
              urlStatus === 'valid'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : ''
            }
            ${
              urlStatus === 'invalid'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : ''
            }
          `}
          >
            <AlertCircle className='w-4 h-4 flex-shrink-0 mt-0.5' />
            <p>{suggestion}</p>
          </div>
        )}
      </div>

      {/* Help section */}
      <details className='group'>
        <summary className='flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900'>
          <HelpCircle className='w-4 h-4' />
          <span>Having trouble? Click for help</span>
        </summary>
        <div className='mt-3 p-4 bg-gray-50 rounded-lg text-sm space-y-2 text-gray-700'>
          <p>
            <strong>Getting redirected to your country's site?</strong>
          </p>
          <ul className='list-disc list-inside space-y-1 ml-2'>
            <li>Try opening the link in an incognito/private window</li>
            <li>Look for a country/region selector (usually in the footer)</li>
            <li>Clear your browser cookies for that site</li>
            <li>
              Use the site's manual country selector to choose "United States"
            </li>
          </ul>
          <p className='mt-3'>
            <strong>Still seeing wrong prices?</strong>
          </p>
          <p>
            Make sure you see "USD" or "$" before the price. If you see other
            currencies, the site hasn't switched to the US version yet.
          </p>
        </div>
      </details>
    </div>
  );
}
