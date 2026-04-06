"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlowReply = exports.getReplyLimitForFlow = void 0;
const assistant_1 = require("../config/assistant");
const getReplyLimitForFlow = (flow) => flow === "GENERAL" ? assistant_1.GENERAL_REPLY_LIMIT : assistant_1.PROFESSIONAL_REPLY_LIMIT;
exports.getReplyLimitForFlow = getReplyLimitForFlow;
const getFlowReply = (flow, step, branch) => {
    if (flow === "PRODUCER") {
        if (step === 1) {
            return assistant_1.FLOW_MESSAGES.PRODUCER[0];
        }
        if (branch === "creative") {
            return assistant_1.FLOW_MESSAGES.CREATIVE[step - 1];
        }
        return assistant_1.FLOW_MESSAGES.PRODUCER[step - 1];
    }
    return assistant_1.FLOW_MESSAGES[flow][step - 1];
};
exports.getFlowReply = getFlowReply;
//# sourceMappingURL=flowEngine.js.map