import { BagItem, IBagItem } from '../models/BagItem';
import { ShopperRequest, IShopperRequest } from '../models/ShopperRequest';
import { Trip, ITrip, TripUpdateData } from '../models/Trip';
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
  async create(bagItem: Partial<IBagItem>, session?: mongoose.ClientSession | null): Promise<IBagItem> {
    const newBagItem = new BagItem(bagItem);
    return await newBagItem.save(session ? { session: session! } : {});
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IBagItem | null> {
    return await BagItem.findById(id);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IBagItem>,
    session?: mongoose.ClientSession | null
  ): Promise<IBagItem | null> {
    const options: any = {
      new: true,
      runValidators: true,
      context: 'query',
    };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await BagItem.findOneAndUpdate({ _id: id }, updates, options);
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
    return request ? (request.bagItems as IBagItem[]) : [];
  }

  async findByIds(ids: string[]): Promise<IBagItem[]> {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    return await BagItem.find({ _id: { $in: objectIds } });
  }
}

export class ShopperRequestRepository implements IShopperRequestRepository {
  async create(request: Partial<IShopperRequest>, session?: mongoose.ClientSession | null): Promise<IShopperRequest> {
    const newRequest = new ShopperRequest(request);
    return await newRequest.save(session ? { session: session! } : {});
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IShopperRequest | null> {
    return await ShopperRequest.findById(id).populate('bagItems');
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IShopperRequest>,
    session?: mongoose.ClientSession | null
  ): Promise<IShopperRequest | null> {
    const options: any = {
      new: true,
      runValidators: true,
    };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await ShopperRequest.findOneAndUpdate({ _id: id }, updates, options).populate('bagItems');
  }

  async findByShopper(
    shopperId: mongoose.Types.ObjectId
  ): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({ shopperId }).populate('bagItems');
  }

  async findOpenRequests(): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({ status: 'open' }).populate('bagItems');
  }

  async findByStatusAndCooldown(
    status: string,
    cooldownEnd: Date
  ): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({
      status,
      cooldownEndsAt: { $lte: cooldownEnd },
      cooldownProcessed: false,
    }).populate('bagItems');
  }

  async findByStatusAndDeadline(
    status: string,
    deadline: Date
  ): Promise<IShopperRequest[]> {
    return await ShopperRequest.find({
      status,
      purchaseDeadline: { $lte: deadline },
    }).populate('bagItems');
  }
}

export class TripRepository implements ITripRepository {
  async create(trip: Partial<ITrip>, session?: mongoose.ClientSession | null): Promise<ITrip> {
    const newTrip = new Trip(trip);
    return await newTrip.save(session ? { session: session! } : {});
  }

  async findById(id: mongoose.Types.ObjectId): Promise<ITrip | null> {
    return await Trip.findById(id);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: TripUpdateData,
    session?: mongoose.ClientSession | null
  ): Promise<ITrip | null> {
    const options: any = {
      new: true,
      runValidators: true,
    };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await Trip.findOneAndUpdate({ _id: id }, updates, options);
  }

  async findByTraveler(travelerId: mongoose.Types.ObjectId): Promise<ITrip[]> {
    return await Trip.find({ travelerId });
  }

  async findOpenTrips(): Promise<ITrip[]> {
    return await Trip.find({ status: 'active' });
  }

  async findByRoute(fromCountry: string, toCountry: string): Promise<ITrip[]> {
    return await Trip.find({
      fromCountry,
      toCountry,
      status: { $in: ['pending', 'active'] }
    });
  }
}

export class MatchRepository implements IMatchRepository {
  async create(match: Partial<IMatch>, session?: mongoose.ClientSession | null): Promise<IMatch> {
    const newMatch = new Match(match);
    return await newMatch.save(session ? { session: session! } : {});
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IMatch | null> {
    return await Match.findById(id).populate('assignedItems');
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IMatch>,
    session?: mongoose.ClientSession | null
  ): Promise<IMatch | null> {
    const options: any = {
      new: true,
      runValidators: true,
    };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await Match.findOneAndUpdate({ _id: id }, updates, options).populate('assignedItems');
  }

  async findByRequest(requestId: mongoose.Types.ObjectId): Promise<IMatch[]> {
    return await Match.find({ requestId }).populate('assignedItems');
  }

  async findByTrip(tripId: mongoose.Types.ObjectId): Promise<IMatch[]> {
    return await Match.find({ tripId }).populate('assignedItems');
  }

  async findByRequestAndTrip(requestId: mongoose.Types.ObjectId, tripId: mongoose.Types.ObjectId): Promise<IMatch | null> {
    return await Match.findOne({ requestId, tripId }).populate('assignedItems');
  }

  async findPendingMatches(): Promise<IMatch[]> {
    return await Match.find({ status: 'pending' }).populate('assignedItems');
  }
}

export class ProofRepository implements IProofRepository {
  async create(proof: Partial<IProof>, session?: mongoose.ClientSession | null): Promise<IProof> {
    const newProof = new Proof(proof);
    return await newProof.save(session ? { session: session! } : {});
  }

  async findById(id: mongoose.Types.ObjectId): Promise<IProof | null> {
    return await Proof.findById(id);
  }

  async update(
    id: mongoose.Types.ObjectId,
    updates: Partial<IProof>,
    session?: mongoose.ClientSession | null
  ): Promise<IProof | null> {
    const options: any = { new: true };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await Proof.findOneAndUpdate({ _id: id }, updates, options);
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
    updates: Partial<IUser>,
    session?: mongoose.ClientSession | null
  ): Promise<IUser | null> {
    const options: any = {
      new: true,
      runValidators: true,
    };
    if (session !== undefined) options.session = session;
    // @ts-ignore - Mongoose types issue with session
    return await User.findOneAndUpdate({ _id: id }, updates, options);
  }
}
