"use client";

import React from "react";
import { splitSolvedSegments, type GrowthMarginChartPoint } from "../src/domain/chart-series";

function percent(value: number) { return `${(value * 100).toFixed(0)}%`; }

export function EqualValueChart({ points, currentMargin, currentGrowth, targetEV, targetLabel = "Fixed target EV", targetContext = "the reference EV" }: {
  points: GrowthMarginChartPoint[];
  currentMargin: number | undefined;
  currentGrowth: number | undefined;
  targetEV: number;
  targetLabel?: string;
  targetContext?: string;
}) {
  const width = 760, height = 330, left = 56, right = 22, top = 22, bottom = 44;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const solved = points.filter((point) => point.status === "solved");
  const maxGrowth = Math.max(0.5, ...solved.map((point) => point.growth));
  const minGrowth = Math.min(-0.2, ...solved.map((point) => point.growth));
  const range = maxGrowth - minGrowth || 0.7;
  const x = (margin: number) => left + (margin / 0.7) * plotWidth;
  const y = (growth: number) => top + ((maxGrowth - growth) / range) * plotHeight;
  const segments = splitSolvedSegments(points);
  const unavailable = points.filter((point) => point.status !== "solved");
  const current = currentMargin !== undefined && currentGrowth !== undefined && currentMargin >= 0 && currentMargin <= 0.7
    ? { cx: x(currentMargin), cy: y(currentGrowth) } : null;

  return <section className="panel chart-panel" aria-labelledby="chart-heading">
    <div className="panel-heading"><div><p className="eyebrow">Equal-value analysis</p><h2 id="chart-heading">Growth required by operating margin</h2></div>
      <span className="chart-target">{targetLabel} · ${targetEV.toLocaleString("en-US", { maximumFractionDigits: 1 })}m</span></div>
    <p className="muted chart-intro">Each point uses the same reverse solver to match {targetContext}. Blank regions indicate unavailable solutions; no values are interpolated.</p>
    <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue growth required at each forecast operating margin, from 0 to 70 percent">
      {[0, .25, .5, .75, 1].map((fraction) => {
        const value = maxGrowth - fraction * range; const py = top + fraction * plotHeight;
        return <g key={fraction}><line className="grid-line" x1={left} x2={width - right} y1={py} y2={py} /><text className="axis-label" x={left - 9} y={py + 4} textAnchor="end">{percent(value)}</text></g>;
      })}
      {[0, .1, .2, .3, .4, .5, .6, .7].map((margin) => <g key={margin}><line className="grid-line vertical" x1={x(margin)} x2={x(margin)} y1={top} y2={height - bottom} /><text className="axis-label" x={x(margin)} y={height - bottom + 20} textAnchor="middle">{percent(margin)}</text></g>)}
      {segments.map((segment, index) => <polyline key={index} className="curve" points={segment.map((point) => `${x(point.margin)},${y(point.growth)}`).join(" ")} />)}
      {points.map((point) => point.status === "solved" ? <circle key={point.margin} className="curve-point" cx={x(point.margin)} cy={y(point.growth)} r="2.3"><title>{`Margin ${percent(point.margin)}: growth ${percent(point.growth)}`}</title></circle> : <line key={point.margin} className="gap-mark" x1={x(point.margin)} x2={x(point.margin)} y1={height - bottom - 4} y2={height - bottom + 3}><title>{`Margin ${percent(point.margin)} unavailable: ${point.status}`}</title></line>)}
      {current && <g><circle className="current-marker-halo" cx={current.cx} cy={current.cy} r="8" /><circle className="current-marker" cx={current.cx} cy={current.cy} r="4" /><title>Current operating assumption</title></g>}
      <text className="axis-title" x={width / 2} y={height - 3} textAnchor="middle">Forecast operating margin</text>
      <text className="axis-title" transform={`translate(15 ${height / 2}) rotate(-90)`} textAnchor="middle">Required annual revenue growth</text>
    </svg></div>
    <div className="chart-legend"><span><i className="legend-line" /> Equal-value curve</span><span><i className="legend-dot" /> Current assumption</span><span><i className="legend-gap" /> Unavailable point</span></div>
    {unavailable.length > 0 && <details className="unavailable-details"><summary>{unavailable.length} of {points.length} margins unavailable</summary><div className="unavailable-list">{unavailable.map((point) => <span key={point.margin} title={point.reason}>{percent(point.margin)}: {point.status}</span>)}</div></details>}
  </section>;
}
