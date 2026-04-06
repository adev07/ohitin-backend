"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversation_1 = require("../controllers/conversation");
const validate_1 = __importDefault(require("../middleware/validate"));
const conversation_2 = require("../validators/conversation");
const router = express_1.default.Router();
router.post("/start", (0, validate_1.default)(conversation_2.startConversationValidator), conversation_1.startConversation);
router.post("/message", (0, validate_1.default)(conversation_2.sendMessageValidator), conversation_1.sendConversationMessage);
router.get("/:id", (0, validate_1.default)(conversation_2.getConversationValidator), conversation_1.getConversation);
exports.default = router;
//# sourceMappingURL=conversation.js.map