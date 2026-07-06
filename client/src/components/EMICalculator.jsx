import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDollarSign, FiClock, FiPercent, FiInfo } from "react-icons/fi";

export default function EMICalculator({ initialAmountLakhs = 25, onEnquireClick }) {
  const [loanAmount, setLoanAmount] = useState(initialAmountLakhs); // in Lakhs
  const [interestRate, setInterestRate] = useState(8.75); // typical Indian rate
  const [tenureYears, setTenureYears] = useState(20);
  const [emi, setEmi] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
  useEffect(() => {
    const P = loanAmount * 100000; // convert Lakhs to Rupees
    const r = interestRate / (12 * 100); // monthly interest rate
    const n = tenureYears * 12; // monthly installments

    if (P > 0 && r > 0 && n > 0) {
      const emiVal = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalPayVal = emiVal * n;
      const totalIntVal = totalPayVal - P;

      setEmi(Math.round(emiVal));
      setTotalPayment(Math.round(totalPayVal));
      setTotalInterest(Math.round(totalIntVal));
    } else {
      setEmi(0);
      setTotalPayment(0);
      setTotalInterest(0);
    }
  }, [loanAmount, interestRate, tenureYears]);

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full bg-[#FFFBF5] border border-amber-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6 text-left">
      <div>
        <span className="text-[9px] font-extrabold text-[#F5A623] uppercase tracking-widest block mb-1">
          Financing Utility
        </span>
        <h3 className="text-lg font-bold text-[#2E2A26] font-display">
          Home Loan EMI Calculator
        </h3>
        <p className="text-[11px] text-[#6B625A]/70 mt-1">
          Estimate your monthly installments based on typical Indian home loan terms.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Loan Amount Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#6B625A]">Loan Amount</span>
            <span className="font-extrabold text-[#E8871E] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              {loanAmount} Lakhs ({formatRupee(loanAmount * 100000)})
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="1"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-[#E8871E]"
          />
          <div className="flex justify-between text-[10px] text-[#6B625A]/50">
            <span>₹5 Lakhs</span>
            <span>₹2 Crores</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#6B625A]">Interest Rate (p.a.)</span>
            <span className="font-extrabold text-[#E8871E] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              {interestRate}%
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="15"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-[#E8871E]"
          />
          <div className="flex justify-between text-[10px] text-[#6B625A]/50">
            <span>6.0%</span>
            <span>15.0%</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#6B625A]">Loan Tenure</span>
            <span className="font-extrabold text-[#E8871E] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              {tenureYears} Years
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-[#E8871E]"
          />
          <div className="flex justify-between text-[10px] text-[#6B625A]/50">
            <span>5 Years</span>
            <span>30 Years</span>
          </div>
        </div>
      </div>

      {/* Results View Card */}
      <div className="bg-white border border-amber-100 rounded-2xl p-5 flex flex-col gap-4 shadow-2xs">
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <span className="text-[10px] font-bold text-[#6B625A] uppercase tracking-wider">
            Estimated Monthly EMI
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={emi}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-extrabold font-display text-[#E8871E] mt-1"
            >
              {formatRupee(emi)} / month
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="border-t border-amber-100/50 pt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="border-r border-amber-100/50 pr-2">
            <span className="text-[9px] font-bold text-[#6B625A]/70 uppercase block">
              Principal Amount
            </span>
            <span className="font-bold text-[#2E2A26] mt-0.5 block">
              {formatRupee(loanAmount * 100000)}
            </span>
          </div>
          <div className="pl-2">
            <span className="text-[9px] font-bold text-[#6B625A]/70 uppercase block">
              Total Interest
            </span>
            <span className="font-bold text-[#2E2A26] mt-0.5 block">
              {formatRupee(totalInterest)}
            </span>
          </div>
        </div>
      </div>

      {/* Call to Action Nudge */}
      {onEnquireClick && (
        <button
          onClick={onEnquireClick}
          className="w-full bg-[#E8871E] text-white font-bold py-3.5 px-6 rounded-xl hover:bg-[#D4861A] transition-colors text-xs text-center shadow-md shadow-amber-500/10 active:scale-[0.98] select-none"
        >
          Check Eligibility & Enquire Now
        </button>
      )}

      {/* Financial Disclaimer */}
      <div className="flex gap-2 items-start text-[10px] text-[#6B625A]/60 leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-100/30">
        <FiInfo className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
        <p>
          <strong>Disclaimer:</strong> This calculator is an estimation tool only. Actual loan rates, terms, and eligibility depend entirely on bank partner policies and credit assessments.
        </p>
      </div>
    </div>
  );
}
