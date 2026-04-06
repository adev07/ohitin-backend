"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = __importDefault(require("../models"));
const getTrackedConversationMatch = () => ({
    tags: { $in: ["NEW"] },
});
const buildMatch = (query) => {
    const match = getTrackedConversationMatch();
    if (query.profileType) {
        match.profileType = query.profileType;
    }
    if (query.classificationSource) {
        match.classificationSource = query.classificationSource;
    }
    if (query.status) {
        match.status = query.status;
    }
    if (query.startDate || query.endDate) {
        match.createdAt = {};
        if (query.startDate) {
            match.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
            const end = new Date(query.endDate);
            end.setHours(23, 59, 59, 999);
            match.createdAt.$lte = end;
        }
    }
    if (query.search) {
        match.$or = [
            { userId: { $regex: query.search, $options: "i" } },
            { "capturedData.email": { $regex: query.search, $options: "i" } },
            { "capturedData.phone": { $regex: query.search, $options: "i" } },
            { tags: { $elemMatch: { $regex: query.search, $options: "i" } } },
        ];
    }
    return match;
};
const getOverview = () => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield models_1.default.conversation.aggregate([
        {
            $match: getTrackedConversationMatch(),
        },
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalProfessionals: {
                    $sum: { $cond: [{ $eq: ["$profileType", "professional"] }, 1, 0] },
                },
                totalFans: {
                    $sum: { $cond: [{ $eq: ["$profileType", "fan"] }, 1, 0] },
                },
                emailsCollected: {
                    $sum: {
                        $cond: [{ $ifNull: ["$capturedData.email", false] }, 1, 0],
                    },
                },
                phonesCollected: {
                    $sum: {
                        $cond: [{ $ifNull: ["$capturedData.phone", false] }, 1, 0],
                    },
                },
            },
        },
    ]);
    return (result || {
        totalUsers: 0,
        totalProfessionals: 0,
        totalFans: 0,
        emailsCollected: 0,
        phonesCollected: 0,
    });
});
const getList = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const match = buildMatch(query);
    const sort = {
        [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
    };
    const skip = (query.page - 1) * query.limit;
    const [rows, total] = yield Promise.all([
        models_1.default.conversation
            .find(match)
            .select("userId profileType classificationSource status tags capturedData createdAt")
            .sort(sort)
            .skip(skip)
            .limit(query.limit)
            .lean(),
        models_1.default.conversation.countDocuments(match),
    ]);
    return {
        rows,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit) || 1,
        },
    };
});
const getTags = () => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.default.conversation.aggregate([
        { $match: getTrackedConversationMatch() },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);
});
const getFunnel = () => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield models_1.default.conversation.aggregate([
        {
            $match: getTrackedConversationMatch(),
        },
        {
            $group: {
                _id: null,
                NEW: { $sum: { $cond: [{ $in: ["NEW", "$tags"] }, 1, 0] } },
                ENGAGED: { $sum: { $cond: [{ $in: ["ENGAGED", "$tags"] }, 1, 0] } },
                WAITING_FOR_CONTACT: {
                    $sum: { $cond: [{ $eq: ["$status", "WAITING_FOR_CONTACT"] }, 1, 0] },
                },
                EMAIL_RECEIVED: {
                    $sum: { $cond: [{ $in: ["EMAIL_RECEIVED", "$tags"] }, 1, 0] },
                },
                PHONE_RECEIVED: {
                    $sum: { $cond: [{ $in: ["PHONE_RECEIVED", "$tags"] }, 1, 0] },
                },
            },
        },
    ]);
    return (result || {
        NEW: 0,
        ENGAGED: 0,
        WAITING_FOR_CONTACT: 0,
        EMAIL_RECEIVED: 0,
        PHONE_RECEIVED: 0,
    });
});
const toCsv = (rows) => {
    const headers = [
        "userId",
        "profileType",
        "classificationSource",
        "status",
        "email",
        "phone",
        "tags",
        "createdAt",
    ];
    const escape = (value) => `"${String(value !== null && value !== void 0 ? value : "").replace(/"/g, '""')}"`;
    const lines = rows.map((row) => {
        var _a, _b;
        return [
            row.userId,
            row.profileType,
            row.classificationSource,
            row.status,
            (_a = row.capturedData) === null || _a === void 0 ? void 0 : _a.email,
            (_b = row.capturedData) === null || _b === void 0 ? void 0 : _b.phone,
            Array.isArray(row.tags) ? row.tags.join("|") : "",
            row.createdAt,
        ]
            .map(escape)
            .join(",");
    });
    return [headers.join(","), ...lines].join("\n");
};
exports.default = {
    getOverview,
    getList,
    getTags,
    getFunnel,
    toCsv,
};
//# sourceMappingURL=adminAnalytics.js.map