import mongoose, { Document, Schema } from 'mongoose';

export type TripStatus = 'open' | 'closed' | 'completed';

export interface ITrip extends Document {
  _id: mongoose.Types.ObjectId;
  travelerId: mongoose.Types.ObjectId;
  fromCountry: string;
  toCountry: string;
  departureDate: Date;
  departureTime: string;
  arrivalDate: Date;
  arrivalTime: string;
  availableCarryOnKg: number;
  availableCheckedKg: number;
  ticketPhoto?: string;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
  canCarryFragile: boolean;
  canHandleSpecialDelivery: boolean;
}
export type TripUpdateData = Partial<
  Omit<ITrip, '_id' | 'travelerId' | 'createdAt' | 'updatedAt'>
>;

const tripSchema = new Schema<ITrip>(
  {
    travelerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    departureDate: {
      type: Date,
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    arrivalDate: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    availableCarryOnKg: {
      type: Number,
      required: true,
      min: 0,
    },
    availableCheckedKg: {
      type: Number,
      required: true,
      min: 0,
    },
    ticketPhoto: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'completed'],
      default: 'open',
      required: true,
    },
    canCarryFragile: {
      type: Boolean,
      required: true,
    },
    canHandleSpecialDelivery: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.pre('validate', function (next) {
  if (this.arrivalDate <= this.departureDate) {
    return next(new Error('Arrival date must be after departure date'));
  }
  next();
});

// Indexes for performance
tripSchema.index({ toCountry: 1 });
tripSchema.index({ departureDate: 1 });

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
