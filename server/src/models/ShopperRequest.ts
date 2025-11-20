import mongoose, { Document, Schema, Types } from 'mongoose';
import { IBagItem } from './BagItem';

export const SHOPPER_REQUEST_STATUSES = [
  'draft',
  'open',
  'matched',
  'on_hold',
  'purchase_pending',
  'purchased',
  'in_transit',
  'delivered',
  'completed',
  'disputed',
  'cancelled',
] as const;

export type ShopperRequestStatus = (typeof SHOPPER_REQUEST_STATUSES)[number];

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface IPriceSummary {
  totalItemCost: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
}

export interface IShopperRequest extends Document {
  _id: mongoose.Types.ObjectId;
  shopperId: mongoose.Types.ObjectId;
  bagItems: (Types.ObjectId | IBagItem)[];
  fromCountry: string;          // NEW: Where shopper wants to buy from
  toCountry: string;            // RENAMED: destinationCountry → toCountry
  status: ShopperRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  priceSummary: IPriceSummary;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  transactionId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundTimestamp?: Date;
  cancellationReason?: string;
  // New fields for enhanced matching
  cooldownEndsAt?: Date;
  purchaseDeadline?: Date;
  cooldownProcessed: boolean;
  // Delivery date range preferences
  deliveryStartDate?: Date;
  deliveryEndDate?: Date;
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
    fromCountry: {
      type: String,
      required: true,
      trim: true,
    },
    toCountry: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: SHOPPER_REQUEST_STATUSES,
      default: 'draft',
      required: true,
    },
    priceSummary: {
      type: priceSummarySchema,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    refundId: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundTimestamp: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cooldownEndsAt: {
      type: Date,
    },
    purchaseDeadline: {
      type: Date,
    },
    cooldownProcessed: {
      type: Boolean,
      default: false,
      required: true,
    },
    deliveryStartDate: {
      type: Date,
    },
    deliveryEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
shopperRequestSchema.index({ fromCountry: 1, toCountry: 1 });
shopperRequestSchema.index({ toCountry: 1 });
shopperRequestSchema.index({ status: 1 });

export const ShopperRequest = mongoose.model<IShopperRequest>(
  'ShopperRequest',
  shopperRequestSchema
);
