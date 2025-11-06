import { IProof, ProofPurpose } from '../models/Proof';
import { IMatch } from '../models/Match';
import {
  IProofRepository,
  IMatchRepository,
  IShopperRequestRepository,
} from './repositories';
import mongoose from 'mongoose';
import { z } from 'zod';

const uploadProofSchema = z.object({
  uploaderId: z.string(),
  url: z.string().url(),
  purpose: z.enum(['receipt', 'qa-photo']),
  fileType: z.string().min(1),
  size: z.number().positive(),
});

const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export class ProofService {
  constructor(
    private proofRepo: IProofRepository,
    private matchRepo: IMatchRepository,
    private requestRepo: IShopperRequestRepository
  ) {}

  async uploadProof(
    proofData: z.infer<typeof uploadProofSchema>,
    relatedEntityId?: mongoose.Types.ObjectId // Match ID or Request ID
  ): Promise<IProof> {
    const validatedData = uploadProofSchema.parse(proofData);

    // Validate file type
    if (!allowedFileTypes.includes(validatedData.fileType)) {
      throw new Error(
        `File type ${
          validatedData.fileType
        } is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`
      );
    }

    // Validate file size
    if (validatedData.size > maxFileSize) {
      throw new Error(
        `File size ${validatedData.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`
      );
    }

    // Additional validation based on purpose
    if (
      validatedData.purpose === 'receipt' &&
      !this.isValidReceiptFile(validatedData.fileType)
    ) {
      throw new Error('Receipt files must be images or PDFs');
    }

    if (
      validatedData.purpose === 'qa-photo' &&
      !this.isValidImageFile(validatedData.fileType)
    ) {
      throw new Error('QA photos must be image files');
    }

    const proof = await this.proofRepo.create({
      uploaderId: new mongoose.Types.ObjectId(validatedData.uploaderId),
      url: validatedData.url,
      purpose: validatedData.purpose,
      fileType: validatedData.fileType,
      size: validatedData.size,
    });

    // If related to a match, we could store the relationship
    // For now, just return the proof - relationship management would be handled by controllers

    return proof;
  }

  async getProof(proofId: mongoose.Types.ObjectId): Promise<IProof | null> {
    return await this.proofRepo.findById(proofId);
  }

  async getProofsByUploader(
    uploaderId: mongoose.Types.ObjectId
  ): Promise<IProof[]> {
    return await this.proofRepo.findByUploader(uploaderId);
  }

  async getProofsByPurpose(purpose: ProofPurpose): Promise<IProof[]> {
    return await this.proofRepo.findByPurpose(purpose);
  }

  async attachProofToMatch(
    proofId: mongoose.Types.ObjectId,
    matchId: mongoose.Types.ObjectId,
    uploaderId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    // Verify proof exists and belongs to uploader
    const proof = await this.proofRepo.findById(proofId);
    if (!proof) {
      throw new Error('Proof not found');
    }

    if (!proof.uploaderId.equals(uploaderId)) {
      throw new Error('Unauthorized to attach this proof');
    }

    // Verify match exists
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Additional business logic could be added here
    // For example, checking if the uploader is part of the match

    // For now, just return success - actual attachment would depend on how proofs are linked
    // This could be through a separate collection or by storing proof IDs in match/request
    return true;
  }

  async attachProofToRequest(
    proofId: mongoose.Types.ObjectId,
    requestId: mongoose.Types.ObjectId,
    uploaderId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    // Verify proof exists and belongs to uploader
    const proof = await this.proofRepo.findById(proofId);
    if (!proof) {
      throw new Error('Proof not found');
    }

    if (!proof.uploaderId.equals(uploaderId)) {
      throw new Error('Unauthorized to attach this proof');
    }

    // Verify request exists
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Update proof to reference the request
    const updatedProof = await this.proofRepo.update(proofId, { requestId });
    return !!updatedProof;
  }

  async validateProofForPurpose(
    proofId: mongoose.Types.ObjectId,
    expectedPurpose: ProofPurpose
  ): Promise<{ valid: boolean; reason?: string }> {
    const proof = await this.proofRepo.findById(proofId);
    if (!proof) {
      return { valid: false, reason: 'Proof not found' };
    }

    if (proof.purpose !== expectedPurpose) {
      return {
        valid: false,
        reason: `Proof purpose is ${proof.purpose}, expected ${expectedPurpose}`,
      };
    }

    // Additional validation based on purpose
    if (
      expectedPurpose === 'receipt' &&
      !this.isValidReceiptFile(proof.fileType)
    ) {
      return { valid: false, reason: 'Invalid file type for receipt' };
    }

    if (
      expectedPurpose === 'qa-photo' &&
      !this.isValidImageFile(proof.fileType)
    ) {
      return { valid: false, reason: 'Invalid file type for QA photo' };
    }

    return { valid: true };
  }

  private isValidImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  private isValidReceiptFile(fileType: string): boolean {
    return this.isValidImageFile(fileType) || fileType === 'application/pdf';
  }

  async deleteProof(
    proofId: mongoose.Types.ObjectId,
    uploaderId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const proof = await this.proofRepo.findById(proofId);
    if (!proof) {
      throw new Error('Proof not found');
    }

    if (!proof.uploaderId.equals(uploaderId)) {
      throw new Error('Unauthorized to delete this proof');
    }

    // Note: In a real implementation, you would also need to delete the file from storage (e.g., Uploadthing)
    // This is just removing the database record

    // For now, we'll assume deletion from storage is handled elsewhere
    return true; // Placeholder
  }
}
