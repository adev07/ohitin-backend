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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAllBusinessMetrics = exports.calculateBasicMetrics = exports.calculateIRR = exports.calculatePMT = exports.calculateAdvancedProjections = exports.performSensitivityAnalysis = exports.calculateNPV = exports.calculateSellerLoanPayments = void 0;
const calculateSellerLoanPayments = (sellerLoanAmount, sellerLoanInterest, sellerLoanTerm) => {
    const monthlyInterestRate = sellerLoanInterest / 100 / 12;
    const totalPayments = sellerLoanTerm * 12;
    if (sellerLoanAmount <= 0 || sellerLoanInterest < 0 || sellerLoanTerm <= 0) {
        throw new Error("Invalid input values for loan calculations.");
    }
    let monthlyPayment;
    if (monthlyInterestRate > 0) {
        monthlyPayment =
            (sellerLoanAmount *
                monthlyInterestRate *
                Math.pow(1 + monthlyInterestRate, totalPayments)) /
                (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    }
    else {
        monthlyPayment = sellerLoanAmount / totalPayments;
    }
    return Math.round(monthlyPayment * 100) / 100;
};
exports.calculateSellerLoanPayments = calculateSellerLoanPayments;
const calculateNPV = (discountRate, cashFlows) => {
    return cashFlows.reduce((acc, cashFlow, index) => {
        return acc + cashFlow / Math.pow(1 + discountRate, index);
    }, 0);
};
exports.calculateNPV = calculateNPV;
const performSensitivityAnalysis = (initialCashFlow, baseGrowthRate) => {
    const scenarios = [
        ["Pessimistic", baseGrowthRate - 0.02],
        ["Base", baseGrowthRate],
        ["Optimistic", baseGrowthRate + 0.02],
    ];
    const analysis = {};
    scenarios.forEach(([scenario, growthRate]) => {
        const npvValues = [];
        [0.08, 0.1, 0.12].forEach((discountRate) => {
            const cashFlows = Array.from({ length: 5 }, (_, i) => initialCashFlow * Math.pow(1 + growthRate, i + 1));
            const npv = (0, exports.calculateNPV)(discountRate, [-initialCashFlow, ...cashFlows]);
            npvValues.push(Math.round(npv * 100) / 100);
        });
        analysis[scenario] = {
            growth_rate: Math.round(growthRate * 100 * 100) / 100,
            npv_low_discount: Math.round(npvValues[0]),
            npv_medium_discount: Math.round(npvValues[1]),
            npv_high_discount: Math.round(npvValues[2]),
        };
    });
    return analysis;
};
exports.performSensitivityAnalysis = performSensitivityAnalysis;
const calculateAdvancedProjections = (initialCashFlow, growthRate, years) => {
    const projections = [];
    for (let year = 1; year <= years; year++) {
        const cashFlow = initialCashFlow * Math.pow(1 + growthRate, year);
        const revenue = cashFlow / 0.15;
        const expenses = revenue - cashFlow;
        projections.push({
            year,
            revenue: Math.round((revenue + Number.EPSILON) * 100) / 100,
            expenses: Math.round((expenses + Number.EPSILON) * 100) / 100,
            cash_flow: Math.round((cashFlow + Number.EPSILON) * 100) / 100,
        });
    }
    return { advanced_projections: projections };
};
exports.calculateAdvancedProjections = calculateAdvancedProjections;
const calculatePMT = (interestRate, numPayments, principal) => {
    return ((principal * interestRate * Math.pow(1 + interestRate, numPayments)) /
        (Math.pow(1 + interestRate, numPayments) - 1));
};
exports.calculatePMT = calculatePMT;
const calculateIRR = (cashFlows) => {
    let rate = 0.1;
    let iterations = 100;
    const precision = 1e-6;
    while (iterations-- > 0) {
        const npv = (0, exports.calculateNPV)(rate, cashFlows);
        if (Math.abs(npv) < precision) {
            break;
        }
        const npvDerivative = cashFlows.reduce((acc, cashFlow, index) => {
            return acc - (index * cashFlow) / Math.pow(1 + rate, index + 1);
        }, 0);
        rate -= npv / npvDerivative;
    }
    return rate;
};
exports.calculateIRR = calculateIRR;
const calculateBasicMetrics = (listingPrice, grossRevenue, cashFlow, loanAmount, loanInterest, loanTerm, downPayment, startupCapital, ownerSalary, growthRate, sellerLoanPayment) => {
    const totalInvestment = downPayment + startupCapital;
    if (totalInvestment === 0) {
        throw new Error("Total investment cannot be zero");
    }
    const annualRoi = (cashFlow / totalInvestment) * 100;
    const annualDebtService = (0, exports.calculatePMT)(loanInterest / 12, loanTerm * 12, -loanAmount);
    const dscr = annualDebtService === 0 ? Infinity : cashFlow / (annualDebtService * 12);
    const discountRate = 0.1;
    const cashFlows = Array.from({ length: 5 }, (_, i) => cashFlow * Math.pow(1 + growthRate, i + 1));
    const npv = (0, exports.calculateNPV)(discountRate, [-totalInvestment, ...cashFlows]);
    let irr;
    try {
        irr = (0, exports.calculateIRR)([-totalInvestment, ...cashFlows]);
    }
    catch (_a) {
        irr = null;
    }
    const fixedCosts = ownerSalary + annualDebtService * 12;
    const variableCostRatio = 0.3;
    const breakEvenRevenue = fixedCosts / (1 - variableCostRatio);
    let cumulativeCashFlow = 0;
    let paybackPeriod = Infinity;
    for (let i = 0; i < cashFlows.length; i += 1) {
        cumulativeCashFlow += cashFlows[i];
        if (cumulativeCashFlow >= totalInvestment) {
            paybackPeriod =
                i + (totalInvestment - (cumulativeCashFlow - cashFlows[i])) / cashFlows[i];
            break;
        }
    }
    const grossProfitMargin = grossRevenue === 0 ? 0 : (((grossRevenue - grossRevenue * variableCostRatio) / grossRevenue) * 100);
    const netProfitMargin = grossRevenue === 0 ? 0 : (cashFlow / grossRevenue) * 100;
    const totalCashFlow = cashFlows.reduce((acc, cf) => acc + cf, 0);
    const equityMultiple = totalCashFlow + listingPrice > 0 ? (totalCashFlow + listingPrice) / totalInvestment : 0;
    const sdeMultiple = cashFlow > 0 ? listingPrice / cashFlow : 0;
    const yearlyDebtPayments = annualDebtService * 12 + sellerLoanPayment * 12;
    const cashFlowAfterPurchase = cashFlow - yearlyDebtPayments;
    return {
        roi: Math.round(annualRoi * 100) / 100,
        dscr: Math.round(dscr * 100) / 100,
        npv: Math.round(npv * 100) / 100,
        irr: irr !== null ? Math.round(irr * 100 * 100) / 100 : null,
        break_even_revenue: Math.round(breakEvenRevenue * 100) / 100,
        payback_period: Math.round(paybackPeriod * 100) / 100,
        gross_profit_margin: Math.round(grossProfitMargin * 100) / 100,
        net_profit_margin: Math.round(netProfitMargin * 100) / 100,
        equity_multiple: Math.round(equityMultiple * 100) / 100,
        sde_multiple: Math.round(sdeMultiple * 100) / 100,
        cash_flow_projection: cashFlows.map((cf) => Math.round(cf * 100) / 100),
        cash_flow_after_purchase: Math.round(cashFlowAfterPurchase * 100) / 100,
        yearly_debt_payments: Math.round(yearlyDebtPayments * 100) / 100,
    };
};
exports.calculateBasicMetrics = calculateBasicMetrics;
const calculateAllBusinessMetrics = (business) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const sellerLoanRate = parseFloat(`${(_a = business.loan_seller_rate) !== null && _a !== void 0 ? _a : 0}`);
    const sellerLoanTerm = parseInt(`${(_b = business.loan_seller_term) !== null && _b !== void 0 ? _b : 0}`, 10);
    const sellerLoanAmount = parseFloat(`${(_c = business.loan_seller_amount) !== null && _c !== void 0 ? _c : 0}`);
    const sellerLoadPayment = (0, exports.calculateSellerLoanPayments)(sellerLoanAmount, sellerLoanRate, sellerLoanTerm);
    const basicMetrics = (0, exports.calculateBasicMetrics)(business.business_listing_price, business.business_gross_revenue, business.business_cash_flow, business.loan_sba_amount, business.loan_sba_rate / 100, business.loan_sba_term, business.loan_down_payment, business.additional_startup_capital, business.desired_owner_salary, business.expected_annual_growth_rate / 100, sellerLoadPayment);
    basicMetrics.sellerLoadPayment = sellerLoadPayment;
    const advancedProjections = (0, exports.calculateAdvancedProjections)(business.business_cash_flow, business.expected_annual_growth_rate / 100, 5);
    const sensitivityAnalysis = (0, exports.performSensitivityAnalysis)(business.business_cash_flow, business.expected_annual_growth_rate / 100);
    return Object.assign(Object.assign({}, basicMetrics), { advancedProjections: advancedProjections.advanced_projections, sensitivityAnalysis });
});
exports.calculateAllBusinessMetrics = calculateAllBusinessMetrics;
//# sourceMappingURL=business.js.map