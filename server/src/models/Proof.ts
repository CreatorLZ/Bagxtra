import mongoose, { Document, Schema } from 'mongoose';

export type ProofPurpose = 'receipt' | 'qa-photo';

export interface IProof extends Document {
  _id: mongoose.Types.ObjectId;
  uploaderId: mongoose.Types.ObjectId;
  uploadedAt: Date;
  url: string;
  purpose: ProofPurpose;
  fileType: string;
  size: number;
}

const proofSchema = new Schema<IProof>(
  {
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['receipt', 'qa-photo'],
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: false, // We use uploadedAt instead of createdAt
  }
);

export const Proof = mongoose.model<IProof>('Proof', proofSchema);
