import mongoose, { Document, Schema } from 'mongoose';

export enum MatchStatus {
  Pending = 'pending',
  Claimed = 'claimed',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
}

export interface IMatch extends Document {
  requestId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  matchScore: number;
  assignedItems: mongoose.Types.ObjectId[];
  status: MatchStatus;
  deliveryPin?: string;
  deliveryPinExpiresAt?: Date;
  deliveryPinGeneratedAt?: Date;
  pinVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopperRequest',
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    travelerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    assignedItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BagItem',
      },
    ],
    deliveryPin: {
      type: String,
    },
    deliveryPinExpiresAt: {
      type: Date,
    },
    deliveryPinGeneratedAt: {
      type: Date,
    },
    pinVerifiedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(MatchStatus),
      default: MatchStatus.Pending,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Match = mongoose.model<IMatch>('Match', matchSchema);
