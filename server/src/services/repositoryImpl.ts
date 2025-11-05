import { BagItem, IBagItem } from '../models/BagItem';
import { ShopperRequest, IShopperRequest } from '../models/ShopperRequest';
import { Trip, ITrip } from '../models/Trip';
import { Match, IMatch } from '../models/Match';
import { Proof, IProof } from '../models/Proof';
import { User, IUser } from '../models/User';
import {
  IBagItemRepository,
  IShopperRequestRepository,
  ITripRepository,
  IMatchRepository,
  IProofRepository,
  IUserRepository,
} from './repositories';
import mongoose from 'mongoose';

export class BagItemRepository implements IBagItemRepository {
  async create(bagItem: Partial<IBagItem>): Promise<IBagItem> {
    const newBagItem = new BagItem(bagItem);
    return await newBagItem.save();
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IBagItem | null> {
    return await BagItem.findById(id);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IBagItem>
  ): Promise<IBagItem | null> {
    return await BagItem.findByIdAndUpdate(id, updates, { new: true });
  }

  async delete(id: mongoose.Types.ObjectId): Promise<boolean> {
    const result = await BagItem.findByIdAndDelete(id);
    return !!result;
  }

  async findByShopperRequest(
    requestId: mongoose.Types.ObjectId
  ): Promise<IBagItem[]> {
    const request = await ShopperRequest.findById(requestId).populate(
      'bagItems'
    );
    return request ? request.bagItems : [];
  }
}

export class ShopperRequestRepository implements IShopperRequestRepository {
  async create(request: Partial<IShopperRequest>): Promise<IShopperRequest> {
    const newRequest = new ShopperRequest(request);
    return await newRequest.save();
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IShopperRequest | null> {
    return await ShopperRequest.findById(id).populate('bagItems');
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IShopperRequest>
  ): Promise<IShopperRequest | null> {
    return await ShopperRequest.findByIdAndUpdate(id, updates, { new: true });
  }

  async findByShopper(
    shopperId: mongoose.Types.ObjectId
  ): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({ shopperId }).populate('bagItems');
  }

  async findOpenRequests(): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({ status: 'open' }).populate('bagItems');
  }
}

export class TripRepository implements ITripRepository {
  async create(trip: Partial<ITrip>): Promise<ITrip> {
    const newTrip = new Trip(trip);
    return await newTrip.save();
  }

  async findById(id: mongoose.Types.ObjectId): Promise<ITrip | null> {
    return await Trip.findById(id);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<ITrip>
  ): Promise<ITrip | null> {
    return await Trip.findByIdAndUpdate(id, updates, { new: true });
  }

  async findByTraveler(travelerId: mongoose.Types.ObjectId): Promise<ITrip[]> {
    return await Trip.find({ travelerId });
  }

  async findOpenTrips(): Promise<ITrip[]> {
    return await Trip.find({ status: 'open' });
  }

  async findByRoute(fromCountry: string, toCountry: string): Promise<ITrip[]> {
    return await Trip.find({ fromCountry, toCountry, status: 'open' });
  }
}

export class MatchRepository implements IMatchRepository {
  async create(match: Partial<IMatch>): Promise<IMatch> {
    const newMatch = new Match(match);
    return await newMatch.save();
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IMatch | null> {
    return await Match.findById(id).populate('assignedItems');
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IMatch>
  ): Promise<IMatch | null> {
    return await Match.findByIdAndUpdate(id, updates, { new: true });
  }

  async findByRequest(requestId: mongoose.Types.ObjectId): Promise<IMatch[]> {
    return await Match.find({ requestId }).populate('assignedItems');
  }

  async findByTrip(tripId: mongoose.Types.ObjectId): Promise<IMatch[]> {
    return await Match.find({ tripId }).populate('assignedItems');
  }

  async findPendingMatches(): Promise<IMatch[]> {
    return await Match.find({ status: 'pending' }).populate('assignedItems');
  }
}

export class ProofRepository implements IProofRepository {
  async create(proof: Partial<IProof>): Promise<IProof> {
    const newProof = new Proof(proof);
    return await newProof.save();
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IProof | null> {
    return await Proof.findById(id);
  }

  async findByUploader(uploaderId: mongoose.Types.ObjectId): Promise<IProof[]> {
    return await Proof.find({ uploaderId });
  }

  async findByPurpose(purpose: string): Promise<IProof[]> {
    return await Proof.find({ purpose });
  }
}

export class UserRepository implements IUserRepository {
  async findById(id: mongoose.Types.ObjectId): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByClerkId(clerkId: string): Promise<IUser | null> {
    return await User.findByClerkId(clerkId);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IUser>
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }
}
