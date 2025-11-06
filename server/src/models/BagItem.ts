import mongoose, { Document, Schema } from 'mongoose';

export interface IBagItem extends Document {
  _id: mongoose.Types.ObjectId;
  productName: string;
  productLink: string;
  price: number;
  currency: string;
  weightKg: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  quantity: number;
  isFragile: boolean;
  photos: string[];
  requiresSpecialDelivery: boolean;
  specialDeliveryCategory?: string;
}

const bagItemSchema = new Schema<IBagItem>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productLink: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0,
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 0,
      },
      width: {
        type: Number,
        required: true,
        min: 0,
      },
      height: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    isFragile: {
      type: Boolean,
      required: true,
    },
    photos: [
      {
        type: String,
        trim: true,
      },
    ],
    requiresSpecialDelivery: {
      type: Boolean,
      default: false,
    },
    specialDeliveryCategory: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const BagItem = mongoose.model<IBagItem>('BagItem', bagItemSchema);
