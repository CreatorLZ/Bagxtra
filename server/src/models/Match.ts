import mongoose, { Document, Schema } from 'mongoose';

export type MatchStatus =
  | 'pending'
  | 'claimed'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  matchScore: number;
  assignedItems: mongoose.Types.ObjectId[];
  status: MatchStatus;
  createdAt: Date;
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
    status: {
      type: String,
      enum: ['pending', 'claimed', 'approved', 'rejected', 'completed'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Match = mongoose.model<IMatch>('Match', matchSchema);
