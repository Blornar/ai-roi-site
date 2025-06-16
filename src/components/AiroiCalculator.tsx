'use client';

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from "recharts";

/**
 * AI ROI Calculator v6‑fix
 * ───────────────────────
 * • Fixes truncated SliderWithLabel JSX that broke the build
 * • Keeps all prior functionality (reference line, CDF, sliders)
 */

const fmtB = (v: number) => `${v.toFixed(1)}B`;

const BANKS = {
  jpm: {
    name: "JPMorgan Chase",
    revenue: 158.1,
    techSpend: 15.5,
    roiPerDollar: 0.44,
  },
  boa: {
    name: "Bank of America",
    revenue: 98.6,
    techSpend: 12,
    roiPerDollar: 0.35,
  },
  uob: {
    name: "United Overseas Bank (UOB)",
    revenue: 10.6,
    techSpend: 0.83,
    roiPerDollar: 0.28,
  },
} as const;

type BankKey = keyof typeof BANKS;
const DISCOUNT = 0.08;
const REVENUE_UPLIFT_PCT = 0.003; // 0.3 %

export default function AiroiCalculator() {
  const [bankKey, setBankKey] = useState<BankKey>("jpm");
  const [aiShare, setAiShare] = useState(0.25);
  const [roiPerDollar, setRoiPerDollar] = useState<number>(BANKS["jpm"].roiPerDollar);
  const [horizon, setHorizon] = useState<3 | 5>(5);
  const [includeRevenue, setIncludeRevenue] = useState(false);

  const bank = BANKS[bankKey];

  useEffect(() => {
    setRoiPerDollar(bank.roiPerDollar);
  }, [bank]);

  const { aiSpend, potentialCost, chartData, npvWithRev } = useMemo(() => {
    const aiSpend = bank.techSpend * aiShare;
    const potentialCost = aiSpend * roiPerDollar;
    const adoption = horizon === 3 ? [0.3, 0.6, 0.9] : [0.3, 0.6, 0.9, 0.95, 1];

    let cumulative = 0;
    const chartData = adoption.map((rate, idx) => {
      const nominal = potentialCost * rate + (includeRevenue ? bank.revenue * REVENUE_UPLIFT_PCT : 0);
      const pv = nominal / Math.pow(1 + DISCOUNT, idx + 1);
      cumulative += pv;
      return { year: `Y${idx + 1}`, total: nominal, cdf: cumulative };
    });

    return { aiSpend, potentialCost, chartData, npvWithRev: cumulative };
  }, [bank, aiShare, roiPerDollar, horizon, includeRevenue]);

  const roiMultiple = npvWithRev / aiSpend;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardContent className="space-y-6 p-6">
          <h1 className="text-center text-2xl font-semibold">Bank AI ROI Playground</h1>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <ControlLabel title="Bank">
              <Select value={bankKey} onValueChange={(v) => setBankKey(v as BankKey)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BANKS).map(([key, b]) => (
                    <SelectItem key={key} value={key}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlLabel>
            <ControlLabel title="Horizon (yrs)">
              <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v) as 3 | 5)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </ControlLabel>
            <ControlLabel title="Rev uplift">
              <div className="flex items-center gap-2">
                <Switch checked={includeRevenue} onCheckedChange={setIncludeRevenue} />
                <span className="text-xs text-slate-600">+0.3 % / yr</span>
              </div>
            </ControlLabel>
          </div>

          <SliderWithLabel label="% of tech budget to AI" value={aiShare} onChange={setAiShare} min={0} max={0.5} step={0.05} />
          <SliderWithLabel label="ROI ($ saved per $AI)" value={roiPerDollar} onChange={setRoiPerDollar} min={0.2} max={1.5} step={0.05} />

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Metric label="Revenue" value={fmtB(bank.revenue)} />
            <Metric label="Tech Spend" value={fmtB(bank.techSpend)} />
            <Metric label="AI Spend" value={fmtB(aiSpend)} />
            <Metric label="Potential Savings" value={fmtB(potentialCost)} />
          </div>

          <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Year‑1 savings estimate:</p>
            <p className="text-3xl font-bold text-indigo-600">{fmtB(chartData[0].total)}</p>
            <p className="text-sm text-slate-600 mt-4">NPV Benefits ({horizon} yrs, 8 %):</p>
            <p className="text-xl font-semibold text-emerald-600">{fmtB(npvWithRev)}</p>
            <p className="text-sm text-slate-600 mt-2">ROI multiple vs AI Spend: <span className="font-medium">{roiMultiple.toFixed(2)}×</span></p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ right: 8, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${v.toFixed(1)}B`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)}B`} />
                <ReferenceLine y={aiSpend} stroke="#F59E0B" strokeDasharray="3 3" ifOverflow="extendDomain" label={{ value: "AI Spend", position: "insideTop", dy: -6, fill: "#F59E0B" }} />
                <Line type="monotone" dataKey="total" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="cdf" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Button asChild className="w-full">
            <a href="https://YOUR-TEARDOWN-LINK.com" target="_blank" rel="noopener noreferrer">View strategy teardown →</a>
          </Button>
        </CardContent>
      </Card>

      <footer className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Your Name. Estimates illustrative only.</footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 whitespace-nowrap">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ControlLabel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      {children}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}

function SliderWithLabel({ label, value, onChange, min, max, step }: SliderProps) {
  const displayVal = label.includes("%") ? `${Math.round(value * 100)} %` : value.toFixed(2);
  return (
    <div className="space-y-3">
      <Label>{label}: <span className="font-medium">{displayVal}</span></Label>
      <Slider defaultValue={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
