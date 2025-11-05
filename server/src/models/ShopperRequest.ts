import mongoose, { Document, Schema } from 'mongoose';
import { IBagItem } from './BagItem';

export type ShopperRequestStatus =
  | 'draft'
  | 'open'
  | 'matched'
  | 'pending_purchase'
  | 'purchased'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface IPriceSummary {
  totalItemCost: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
}

export interface IShopperRequest extends Document {
  _id: mongoose.Types.ObjectId;
  shopperId: mongoose.Types.ObjectId;
  bagItems: IBagItem[];
  destinationCountry: string;
  status: ShopperRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  priceSummary: IPriceSummary;
  paymentStatus: string;
  trackingNumber?: string;
}

const priceSummarySchema = new Schema<IPriceSummary>(
  {
    totalItemCost: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceFee: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shopperRequestSchema = new Schema<IShopperRequest>(
  {
    shopperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bagItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BagItem',
      },
    ],
    destinationCountry: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'open',
        'matched',
        'pending_purchase',
        'purchased',
        'in_transit',
        'delivered',
        'completed',
        'disputed',
        'cancelled',
      ],
      default: 'draft',
      required: true,
    },
    priceSummary: {
      type: priceSummarySchema,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
shopperRequestSchema.index({ destinationCountry: 1 });
shopperRequestSchema.index({ status: 1 });

export const ShopperRequest = mongoose.model<IShopperRequest>(
  'ShopperRequest',
  shopperRequestSchema
);
