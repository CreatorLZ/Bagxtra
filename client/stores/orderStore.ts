import { create } from 'zustand';
import { z } from 'zod';

//  Validation schemas
const productDetailsSchema = z.object({
  category: z.string().min(1, 'Product category is required'),
  url: z
    .string()
    .min(1, 'Product URL is required')
    .url('Please enter a valid URL'),
  name: z.string().min(1, 'Product name is required'),
  colour: z.string().optional(),
  weight: z
    .string()
    .min(1, 'Weight is required')
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0.1 && num <= 50;
    }, 'Weight must be between 0.1 and 50 kg'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Price must be a positive number'),
  currency: z.string().min(1, 'Currency is required'),
  fragile: z.boolean(),
  additionalInfo: z.string().min(1, 'Additional information is required'),
  photos: z.array(z.string().url()).max(3).optional(),
});

const deliveryDetailsSchema = z.object({
  pickup: z.boolean(),
  buyingFrom: z.string().min(1, 'Buying location is required'),
  deliveringTo: z.string().min(1, 'Delivery location is required'),
  deliveryStartDate: z.string().optional(),
  deliveryEndDate: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      val => !val || /^[\+]?[0-9\s\-\(\)]{7,15}$/.test(val),
      'Invalid phone number format'
    ),
  phoneCountry: z.string().optional(),
  carryOn: z.boolean(),
  storePickup: z.boolean(),
});

const orderFormSchema = z.object({
  productDetails: productDetailsSchema,
  deliveryDetails: deliveryDetailsSchema,
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(3, 'Maximum 3 items allowed per order'),
});

// Types
export type ProductDetails = z.infer<typeof productDetailsSchema>;
export type DeliveryDetails = z.infer<typeof deliveryDetailsSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderStore {
  // Form data
  formData: OrderFormData;
  errors: Partial<Record<keyof OrderFormData, string>>;

  // Actions
  updateProductDetails: (data: Partial<ProductDetails>) => void;
  updateDeliveryDetails: (data: Partial<DeliveryDetails>) => void;
  setQuantity: (quantity: number) => void;
  validateForm: () => boolean;
  validateSingleField: (fieldPath: string, value: any) => string | null;
  resetForm: () => void;

  // API placeholders
  submitOrder: (action: 'find_traveler' | 'post_proposal') => Promise<void>;
  isSubmitting: boolean;
}

// Initial state
const initialFormData: OrderFormData = {
  productDetails: {
    category: '',
    url: '',
    name: '',
    colour: '',
    weight: '',
    price: '',
    currency: 'USD',
    fragile: false,
    additionalInfo: '',
    photos: [],
  },
  deliveryDetails: {
    pickup: false,
    buyingFrom: '',
    deliveringTo: '',
    deliveryStartDate: '',
    deliveryEndDate: '',
    phone: '',
    phoneCountry: 'NG',
    carryOn: true,
    storePickup: true,
  },
  quantity: 1,
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  formData: initialFormData,
  errors: {},
  isSubmitting: false,

  updateProductDetails: data =>
    set(state => ({
      formData: {
        ...state.formData,
        productDetails: { ...state.formData.productDetails, ...data },
      },
    })),

  updateDeliveryDetails: data =>
    set(state => ({
      formData: {
        ...state.formData,
        deliveryDetails: { ...state.formData.deliveryDetails, ...data },
      },
    })),

  setQuantity: quantity =>
    set(state => ({
      formData: { ...state.formData, quantity },
    })),

  validateForm: () => {
    const result = orderFormSchema.safeParse(get().formData);
    if (!result.success) {
      const errors: Partial<Record<keyof OrderFormData, string>> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.') as keyof OrderFormData;
        errors[path] = issue.message;
      });
      set({ errors });
      return false;
    }
    set({ errors: {} });
    return true;
  },

  validateSingleField: (fieldPath: string, value: any): string | null => {
    const [section, field] = fieldPath.split('.');
    let schema: z.ZodTypeAny;

    if (section === 'productDetails') {
      schema = productDetailsSchema.shape[field as keyof ProductDetails];
    } else if (section === 'deliveryDetails') {
      schema = deliveryDetailsSchema.shape[field as keyof DeliveryDetails];
    } else if (fieldPath === 'quantity') {
      schema = orderFormSchema.shape.quantity;
    } else {
      return null;
    }

    const result = schema.safeParse(value);
    return result.success
      ? null
      : result.error.issues[0]?.message || 'Invalid value';
  },

  resetForm: () => set({ formData: initialFormData, errors: {} }),

  submitOrder: async action => {
    const { formData, validateForm } = get();

    if (!validateForm()) {
      throw new Error('Form validation failed');
    }

    set({ isSubmitting: true });

    try {
      // TODO: Replace with actual API call
      console.log('Submitting order:', { ...formData, action });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // On success, form will be reset by the component
    } catch (error) {
      console.error('Order submission failed:', error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
