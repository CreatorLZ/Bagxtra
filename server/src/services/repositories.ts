import { IBagItem } from '../models/BagItem';
import { IShopperRequest } from '../models/ShopperRequest';
import { ITrip, TripUpdateData } from '../models/Trip';
import { IMatch } from '../models/Match';
import { IProof } from '../models/Proof';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

export interface IBagItemRepository {
  create(bagItem: Partial<IBagItem>, session?: mongoose.ClientSession | null): Promise<IBagItem>;
  findById(id: mongoose.Types.ObjectId): Promise<IBagItem | null>;
  findByIds(ids: string[]): Promise<IBagItem[]>;
  update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IBagItem>,
    session?: mongoose.ClientSession | null
  ): Promise<IBagItem | null>;
  delete(id: mongoose.Types.ObjectId): Promise<boolean>;
  findByShopperRequest(requestId: mongoose.Types.ObjectId): Promise<IBagItem[]>;
}

export interface IShopperRequestRepository {
  create(request: Partial<IShopperRequest>, session?: mongoose.ClientSession | null): Promise<IShopperRequest>;
  findById(id: mongoose.Types.ObjectId): Promise<IShopperRequest | null>;
  update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IShopperRequest>,
    session?: mongoose.ClientSession | null
  ): Promise<IShopperRequest | null>;
  findByShopper(shopperId: mongoose.Types.ObjectId): Promise<IShopperRequest[]>;
  findOpenRequests(): Promise<IShopperRequest[]>;
  findByStatusAndCooldown(status: string, cooldownEnd: Date): Promise<IShopperRequest[]>;
  findByStatusAndDeadline(status: string, deadline: Date): Promise<IShopperRequest[]>;
}

export interface ITripRepository {
  create(trip: Partial<ITrip>, session?: mongoose.ClientSession | null): Promise<ITrip>;
  findById(id: mongoose.Types.ObjectId): Promise<ITrip | null>;
  update(
    id: mongoose.Types.ObjectId,
    updates: TripUpdateData,
    session?: mongoose.ClientSession | null
  ): Promise<ITrip | null>;
  findByTraveler(travelerId: mongoose.Types.ObjectId): Promise<ITrip[]>;
  findOpenTrips(): Promise<ITrip[]>;
  findByRoute(fromCountry: string, toCountry: string): Promise<ITrip[]>;
}

export interface IMatchRepository {
  create(match: Partial<IMatch>, session?: mongoose.ClientSession | null): Promise<IMatch>;
  findById(id: mongoose.Types.ObjectId): Promise<IMatch | null>;
  update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IMatch>,
    session?: mongoose.ClientSession | null
  ): Promise<IMatch | null>;
  findByRequest(requestId: mongoose.Types.ObjectId): Promise<IMatch[]>;
  findByTrip(tripId: mongoose.Types.ObjectId): Promise<IMatch[]>;
  findPendingMatches(): Promise<IMatch[]>;
}

export interface IProofRepository {
  create(proof: Partial<IProof>, session?: mongoose.ClientSession | null): Promise<IProof>;
  findById(id: mongoose.Types.ObjectId): Promise<IProof | null>;
  update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IProof>,
    session?: mongoose.ClientSession | null
  ): Promise<IProof | null>;
  findByUploader(uploaderId: mongoose.Types.ObjectId): Promise<IProof[]>;
  findByPurpose(purpose: string): Promise<IProof[]>;
}

export interface IUserRepository {
  findById(id: mongoose.Types.ObjectId): Promise<IUser | null>;
  findByClerkId(clerkId: string): Promise<IUser | null>;
  update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IUser>,
    session?: mongoose.ClientSession | null
  ): Promise<IUser | null>;
}
