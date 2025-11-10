'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  Search,
  Car,
  Baby,
  Shirt,
  HeartPulse,
  Gamepad2,
  Home,
  Package,
  Plus,
  Minus,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

// --- Mock Data (from previous step, still needed) ---
const categories = [
  {
    name: 'Automotive & Travel Gear',
    desc: 'No heavy or large vehicle parts',
    icon: <Car className='h-5 w-5' />,
  },
  {
    name: 'Baby & Kids Essentials',
    desc: 'No large strollers or car seats',
    icon: <Baby className='h-5 w-5' />,
  },
  {
    name: 'Beauty & Personal Care',
    desc: 'No liquids above 100ml',
    icon: <Package className='h-5 w-5' />,
  },
  {
    name: 'Clothing & Accessories',
    desc: 'No replica items',
    icon: <Shirt className='h-5 w-5' />,
  },
  {
    name: 'Fitness & Outdoors',
    desc: 'No heavy dumbbells, bicycles, or tents',
    icon: <HeartPulse className='h-5 w-5' />,
  },
  {
    name: 'Gaming & Entertainment',
    desc: 'No arcade-sized gear or units',
    icon: <Gamepad2 className='h-5 w-5' />,
  },
  {
    name: 'Health & Wellness',
    desc: 'No liquids above 100ml',
    icon: <HeartPulse className='h-5 w-5' />,
  },
  {
    name: 'Home & Lifestyle',
    desc: 'No large appliances or furniture',
    icon: <Home className='h-5 w-5' />,
  },
];
const stores = [
  { name: 'Amazon', logo: '/amazon.png' },
  { name: 'Walmart', logo: '/walmart.png' },
  { name: 'Adidas', logo: '/adidas.png' },
  { name: 'Apples', logo: '/Apple.png' },
  { name: 'Ikea', logo: '/Ikea.png' },
  { name: 'Gucci', logo: '/gucci.png' },
  // ... other stores
];

// --- Helper Components ---
function FormField({
  id,
  label,
  children,
  className = '',
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid w-full items-center gap-1.5 ${className}`}>
      <Label htmlFor={id} className='text-sm font-medium text-gray-700'>
        {label}
      </Label>
      {children}
    </div>
  );
}

// --- Main Modal Component ---
interface PlaceOrderModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PlaceOrderModal({
  isOpen,
  onOpenChange,
}: PlaceOrderModalProps) {
  const [view, setView] = useState<'details' | 'stores'>('details');
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  // Render the "Product Details" form
  const renderDetailsView = () => (
    <>
      <DialogHeader className='sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='p-1 rounded-full hover:bg-gray-100'
              onClick={() => onOpenChange(false)}
            >
              <ChevronLeft className='h-6 w-6' />
            </button>
            <DialogTitle className='text-lg font-semibold text-gray-900'>
              Product Details
            </DialogTitle>
          </div>
          <span className='text-sm font-medium text-gray-500'>Step 1/3</span>
        </div>
      </DialogHeader>

      {/* Scrollable Form Content */}
      <div className='flex-1 overflow-y-auto p-6 space-y-5 rounded-b-xl'>
        {/* Product Category Select */}
        <FormField id='category' label='Enter Product Category'>
          <Select>
            <SelectTrigger className='w-full h-11'>
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent>
         
              {categories.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>
                  <div className='flex items-center gap-3 py-2'>
                    <div className='text-gray-500'>{cat.icon}</div>
                    <div>
                      <p className='font-medium text-gray-800'>{cat.name}</p>
                      <p className='text-xs text-gray-500'>{cat.desc}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* Product URL */}
        <FormField id='url' label='Enter Product URL'>
          <div className='relative'>
            <Input
              id='url'
              placeholder='www.amazon.com'
              className='h-11 pr-24'
            />
            <button
              type='button'
              onClick={() => setView('stores')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-purple-700 hover:text-purple-800'
            >
              Browse Stores
            </button>
          </div>
        </FormField>

        {/* Product Name */}
        <FormField id='name' label='Enter Product Name'>
          <Input
            id='name'
            placeholder='Derma-cos skin-solve'
            className='h-11'
          />
        </FormField>

        {/* Product Colour */}
        <FormField id='colour' label='Enter Product Colour'>
          <Input id='colour' placeholder='Teal Green' className='h-11' />
        </FormField>

        {/* Product Weight */}
        <FormField id='weight' label='Enter Product Weight'>
          <Input
            id='weight'
            placeholder='e.g., 2kg or 0.5lbs'
            className='h-11'
          />
        </FormField>

        {/* Product Price */}
        <FormField id='price' label='Enter Product Price'>
          <div className='flex gap-2'>
            <Input id='price' placeholder='$250' className='h-11' />
            <Select defaultValue='USD'>
              <SelectTrigger className='w-[100px] h-11'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='USD'>USD</SelectItem>
                <SelectItem value='EUR'>EUR</SelectItem>
                <SelectItem value='GBP'>GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormField>

        {/* Product Photos */}
        <FormField
          id='photos'
          label='Add Product Photos (Max. size of 3mb each)'
        >
          <div className='grid grid-cols-3 gap-3'>
            {[1, 2, 3].map(i => (
              <button
                key={i}
                type='button'
                className='aspect-square w-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400'
              >
                <Plus className='h-8 w-8' />
              </button>
            ))}
          </div>
        </FormField>

        {/* Add Quantity */}
        <FormField id='quantity' label='Add Quantity'>
          <div className='flex items-center justify-center gap-4 w-full h-11'>
            <button
              type='button'
              onClick={() => handleQuantityChange(-1)}
              className='w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50'
            >
              <Minus className='h-5 w-5' />
            </button>
            <span className='text-lg font-semibold w-12 text-center'>
              {quantity}
            </span>
            <button
              type='button'
              onClick={() => handleQuantityChange(1)}
              className='w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50'
            >
              <Plus className='h-5 w-5' />
            </button>
          </div>
        </FormField>

        {/* Fragile Item */}
        <div className='flex items-center justify-between'>
          <Label
            htmlFor='fragile'
            className='text-sm font-medium text-gray-700'
          >
            Is this a very fragile item?
          </Label>
          <Switch id='fragile' />
        </div>

        {/* Additional Information */}
        <FormField
          id='additional-info'
          label='Additional Information (Highly needed)'
        >
          <Textarea
            id='additional-info'
            placeholder='Explain in details all you want the product to look like'
            rows={4}
          />
        </FormField>

        {/* Buttons at the bottom of the form */}
        <div className='pt-6 mt-4 border-t gap-3 flex flex-col sm:flex-row sm:justify-between rounded-b-xl'>
          <Button variant='outline' className='w-full sm:w-auto'>
            Add another item
          </Button>
          <Button className='w-full sm:w-auto bg-purple-900 hover:bg-purple-800'>
            Enter Delivery Details
          </Button>
        </div>
      </div>
    </>
  );

  //  "Browse Stores"
  const renderStoresView = () => (
    <>
      <DialogHeader className='sticky top-0 bg-white z-10 p-6 pb-4 border-b rounded-t-xl'>
        <div className='flex items-center'>
          <button
            type='button'
            onClick={() => setView('details')}
            className='p-1 rounded-full hover:bg-gray-100 mr-2'
          >
            <ChevronLeft className='h-6 w-6' />
          </button>
          <DialogTitle className='text-lg font-semibold text-gray-900'>
            What store will this product be from?
          </DialogTitle>
        </div>
      </DialogHeader>

      <div className='flex-1 overflow-y-auto p-6 space-y-4 rounded-xl'>
        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
          <Input placeholder='Search for stores' className='h-11 pl-10' />
        </div>

        {/* Store List */}
        <div className='space-y-2'>
          {stores.map(store => (
            <button
              key={store.name}
              className='flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100'
            >
              <div className='flex items-center gap-3'>
                <div className='w-32 h-10 rounded-none flex items-center justify-center overflow-hidden'>
                  <Image
                    src={store.logo}
                    alt={store.name}
                    width={60}
                    height={40}
                  />
                  {/* <span className="text-xs">{store.name} Logo</span> */}
                </div>
                {/* <span className="font-medium">{store.name}</span> */}
              </div>
              <ExternalLink className='h-5 w-5 text-purple-900 ' />
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh] h-full font-space-grotesk rounded-xl'>
        {/* Conditionally render the view */}
        {view === 'details' ? renderDetailsView() : renderStoresView()}
      </DialogContent>
    </Dialog>
  );
}
