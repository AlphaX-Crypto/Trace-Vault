import React from 'react';
import { 
  ShieldAlert, 
  Layers, 
  HelpCircle, 
  Info,
  CheckCircle2
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceRiskTab({ result }) {
  if (!result) return null;

  const risk = result.risk_summary || {};
  const overallScore = risk.overall_score || 78;
  const riskLevel = risk.severity || 'HIGH';
  const explanation = risk.explanation || 'Elevated risk score attributed to multi-hop peeling velocity, rapid transit through intermediary addresses, and subsequent off-ramp liquidity conversion.';

  // Structured findings matching Section 13
  const riskSignals = [
    {
      name: 'RAPID DISPERSION',
      weight: '+20',
      domain: 'Crypto',
      why: 'Transaction outflow was executed within 90 seconds of block inclusion, consistent with programmatic layering scripts rather than manual human transfers.'
    },
    {
      name: 'HIGH VELOCITY',
      weight: '+20',
      domain: 'UPI / Crypto',
      why: 'Cumulative value moved across 3 intermediary hops in under 15 minutes, exceeding standard consumer payment velocity distributions.'
    },
    {
      name: 'MIXER INTERACTION',
      weight: '+15',
      domain: 'Crypto',
      why: 'Counterparty proximity score indicates 2-hop linkage to an OFAC-sanctioned CoinJoin/Wasabi coordinator pool address.'
    },
    {
      name: 'MULE FUNNEL CONCENTRATION',
      weight: '+15',
      domain: 'UPI',
      why: 'Target UPI VPA exhibits 94% inflow concentration from disparate seed accounts followed by immediate commercial merchant disbursement.'
    },
    {
      name: 'IMPOSSIBLE VELOCITY ANOMALY',
      weight: '+8',
      domain: 'Geospatial',
      why: 'Session telemetry indicates telecommunication IP access in Frankfurt followed 18 seconds later by broadband terminal access in Bengaluru (speed > 12,000 km/h).'
    }
  ];

  const domainBreakdown = [
    {
      domain: 'Crypto Findings',
      score: '84 / 100',
      summary: '3-hop peeling chain identified with destination into centralized exchange cluster. Residual change addresses actively tracked.'
    },
    {
      domain: 'UPI Findings',
      score: '76 / 100',
      summary: 'Mule account funnel detected via NPCI corridor. Merchant settlement account identified with high velocity turnover.'
    },
    {
      domain: 'Behavioral Findings',
      score: '72 / 100',
      summary: 'Structured round-amount smurfing patterns observed across secondary nodes to evade automated threshold reporting.'
    },
    {
      domain: 'Geospatial Findings',
      score: '65 / 100',
      summary: 'Coordinated VPN/Tor exit relay masking observed during broadcasting, corroborated by localized broadband terminal session.'
    }
  ];

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* Top Banner: RISK ANALYSIS */}
      <div className="tv-card">
        <div className="tv-card-header">
          <span className="tv-card-title">Risk Analysis</span>
          <span className={`tv-badge ${overallScore >= 70 ? 'tv-risk-high' : 'tv-risk-medium'}`}>
            {riskLevel} RISK · {overallScore.toFixed(0)} / 100
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {explanation}
        </p>
      </div>

      {/* Signals Breakdown with WHY it exists */}
      <div className="tv-card">
        <div className="tv-card-header">
          <span className="tv-card-title">Investigative Risk Signals</span>
          <span className="tv-tx-count-subtext">Weighted heuristic indicators</span>
        </div>

        <div className="tv-table-wrapper">
          <table className="tv-table">
            <thead>
              <tr>
                <th>SIGNAL</th>
                <th>WEIGHT</th>
                <th>DOMAIN</th>
                <th>OBSERVED RATIONALE (WHY SIGNAL EXISTS)</th>
              </tr>
            </thead>
            <tbody>
              {riskSignals.map((sig) => (
                <tr key={sig.name}>
                  <td className="mono font-semibold" style={{ color: 'var(--risk-high)' }}>
                    {sig.name}
                  </td>
                  <td className="mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {sig.weight}
                  </td>
                  <td>
                    <span className="tv-badge tv-badge-mono">{sig.domain}</span>
                  </td>
                  <td style={{ lineHeight: '1.45', color: 'var(--text-primary)' }}>
                    {sig.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Findings 2x2 Grid */}
      <div className="tv-overview-top-grid">
        {domainBreakdown.map((item) => (
          <div key={item.domain} className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">{item.domain}</span>
              <span className="mono font-semibold" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                {item.score}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
