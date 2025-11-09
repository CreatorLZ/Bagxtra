import { Request, Response } from 'express';
import { RoleAuditLog } from '../models/RoleAuditLog';
import { User } from '../models/User';
import { createErrorResponse } from '../errors.js';

/**
 * Get role audit logs (admin only)
 */
export const getRoleAuditLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
      return;
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    // Parse query parameters
    const pageStr = req.query['page'] as string;
    const limitStr = req.query['limit'] as string;
    const userId = req.query['userId'] as string;
    const changedBy = req.query['changedBy'] as string;
    const startDate = req.query['startDate'] as string;
    const endDate = req.query['endDate'] as string;

    let page = 1;
    let limit = 50;

    // Validate pagination
    if (pageStr) {
      const p = parseInt(pageStr, 10);
      if (isNaN(p) || p < 1) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'Bad Request',
              'Invalid page parameter',
              'INVALID_PARAMETER'
            )
          );
        return;
      }
      page = p;
    }

    if (limitStr) {
      const l = parseInt(limitStr, 10);
      if (isNaN(l) || l < 1 || l > 200) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'Bad Request',
              'Invalid limit parameter (1-200)',
              'INVALID_PARAMETER'
            )
          );
        return;
      }
      limit = l;
    }

    // Build query
    const query: any = {};

    if (userId) {
      query.userId = userId;
    }

    if (changedBy) {
      query.changedBy = changedBy;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          res
            .status(400)
            .json(
              createErrorResponse(
                'Bad Request',
                'Invalid startDate format',
                'INVALID_PARAMETER'
              )
            );
          return;
        }
        query.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          res
            .status(400)
            .json(
              createErrorResponse(
                'Bad Request',
                'Invalid endDate format',
                'INVALID_PARAMETER'
              )
            );
          return;
        }
        query.timestamp.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    // Execute query
    const [logs, total] = await Promise.all([
      RoleAuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email role')
        .populate('changedBy', 'fullName email role'),
      RoleAuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        userId,
        changedBy,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Get role audit logs error:', error);
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to retrieve role audit logs',
          'INTERNAL_ERROR'
        )
      );
  }
};

/**
 * Get role audit log statistics (admin only)
 */
export const getRoleAuditStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
      return;
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    // Get statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalLogs,
      recentLogs,
      roleChangeCounts,
      topChangers,
      topChangedUsers,
    ] = await Promise.all([
      RoleAuditLog.countDocuments(),
      RoleAuditLog.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
      RoleAuditLog.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { oldRole: '$oldRole', newRole: '$newRole' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            transition: {
              $concat: ['$_id.oldRole', ' -> ', '$_id.newRole'],
            },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      RoleAuditLog.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$changedBy',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: User.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            count: 1,
            user: { $arrayElemAt: ['$user', 0] },
          },
        },
      ]),
      RoleAuditLog.aggregate([
        { $match: { timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: User.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            count: 1,
            user: { $arrayElemAt: ['$user', 0] },
          },
        },
      ]),
    ]);

    res.json({
      totalLogs,
      recentLogs,
      roleChangeCounts,
      topChangers,
      topChangedUsers,
      period: 'last 30 days',
    });
  } catch (error) {
    console.error('Get role audit stats error:', error);
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to retrieve role audit statistics',
          'INTERNAL_ERROR'
        )
      );
  }
};
