import React, { useState } from 'react';
import { Layers, ArrowRight, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { SAMPLE_PRODUCTS, SampleScenario } from '../services/sampleProducts';
import { calculateTrustScore } from '../services/scoringEngine';

export const ComparisonMatrix: React.FC = () => {
  const [productA, setProductA] = useState<SampleScenario>(SAMPLE_PRODUCTS[0]);
  const [productB, setProductB] = useState<SampleScenario>(SAMPLE_PRODUCTS[1]);

  const scoreA = calculateTrustScore(productA.product);
  const scoreB = calculateTrustScore(productB.product);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const bestProduct = scoreA.trustScore >= scoreB.trustScore ? productA : productB;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          Comparative Risk Matrix
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Risk Comparison
        </h2>
        <p className="text-sm text-slate-600">
          Compare multi-dimensional risk signals between alternative listings to identify which product presents fewer risk factors before purchasing.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Product A</label>
          <select
            value={productA.id}
            onChange={(e) => {
              const found = SAMPLE_PRODUCTS.find((p) => p.id === e.target.value);
              if (found) setProductA(found);
            }}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
          >
            {SAMPLE_PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Product B</label>
          <select
            value={productB.id}
            onChange={(e) => {
              const found = SAMPLE_PRODUCTS.find((p) => p.id === e.target.value);
              if (found) setProductB(found);
            }}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
          >
            {SAMPLE_PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 w-1/3">Evaluation Metric</th>
              <th className="p-4 text-center w-1/3 border-l border-slate-200">
                <span className="text-slate-900 block font-extrabold text-sm">{productA.product.title.slice(0, 36)}...</span>
                <span className="text-[11px] font-normal text-slate-500">{productA.product.domain}</span>
              </th>
              <th className="p-4 text-center w-1/3 border-l border-slate-200">
                <span className="text-slate-900 block font-extrabold text-sm">{productB.product.title.slice(0, 36)}...</span>
                <span className="text-[11px] font-normal text-slate-500">{productB.product.domain}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Overall Score */}
            <tr className="bg-slate-50/50 font-bold">
              <td className="p-4">
                <span className="text-sm font-extrabold text-slate-900 block">Trust Score (0–100)</span>
                <span className="text-[11px] text-slate-400 font-normal">Higher indicates lower risk</span>
              </td>
              <td className="p-4 text-center border-l border-slate-100">
                <span className="text-2xl font-black block" style={{ color: getScoreColor(scoreA.trustScore) }}>
                  {scoreA.trustScore}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
                  {scoreA.riskLevel}
                </span>
              </td>
              <td className="p-4 text-center border-l border-slate-100">
                <span className="text-2xl font-black block" style={{ color: getScoreColor(scoreB.trustScore) }}>
                  {scoreB.trustScore}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
                  {scoreB.riskLevel}
                </span>
              </td>
            </tr>

            {/* Price Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Price Risk (20% Weight)</td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreA.riskCategories.price.score} / 100
              </td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreB.riskCategories.price.score} / 100
              </td>
            </tr>

            {/* Review Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Review Risk (25% Weight)</td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreA.riskCategories.review.score} / 100
              </td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreB.riskCategories.review.score} / 100
              </td>
            </tr>

            {/* Seller Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Seller Risk (25% Weight)</td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreA.riskCategories.seller.score} / 100
              </td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreB.riskCategories.seller.score} / 100
              </td>
            </tr>

            {/* Policy Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Policy Risk (15% Weight)</td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreA.riskCategories.policy.score} / 100
              </td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreB.riskCategories.policy.score} / 100
              </td>
            </tr>

            {/* Description Risk */}
            <tr>
              <td className="p-4 font-semibold text-slate-700">Description Risk (15% Weight)</td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreA.riskCategories.description.score} / 100
              </td>
              <td className="p-4 text-center border-l border-slate-100 font-bold text-slate-900">
                {scoreB.riskCategories.description.score} / 100
              </td>
            </tr>
          </tbody>
        </table>

        {/* Objective Recommendation Box */}
        <div className="p-5 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3 text-sm text-indigo-950">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <strong className="block font-bold">Recommendation:</strong>
            <p>
              "{bestProduct.product.title}" <span className="underline decoration-indigo-300 font-semibold">shows fewer risk indicators</span> based on the available information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
