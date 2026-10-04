import React from 'react';

export const ProductFooter: React.FC = () => {
  return (
    <footer className="product-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="2" />
                <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
              <span className="brand-name">TRACEVAULT</span>
            </div>
            <p className="brand-statement">
              Institutional intelligence platform for tracing pseudo-anonymous cryptocurrency flows, 
              detecting complex peeling chains, and connecting off-ramp fund laundering to domestic UPI endpoints.
            </p>
            <div className="system-status">
              <span className="status-ping" />
              <span className="status-text font-mono">ALL ENGINES OPERATIONAL // MULTI-CHAIN + UPI RAILS</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="link-col">
              <span className="col-title font-mono">PLATFORM</span>
              <ul className="col-links">
                <li><a href="#graph-tracing">Crypto Wallet Tracing</a></li>
                <li><a href="#capabilities">Peel Chain Analytics</a></li>
                <li><a href="#graph-tracing">Mixer De-Anonymization</a></li>
                <li><a href="#capabilities">Cross-Rail Correlation</a></li>
              </ul>
            </div>

            <div className="link-col">
              <span className="col-title font-mono">INVESTIGATIONS</span>
              <ul className="col-links">
                <li><a href="#workspace">Case Workspace</a></li>
                <li><a href="#graph-tracing">Mule VPA Clustering</a></li>
                <li><a href="#capabilities">Audit Trail Exporter</a></li>
                <li><a href="#workspace">Entity Intelligence DB</a></li>
              </ul>
            </div>

            <div className="link-col">
              <span className="col-title font-mono">STANDARDS</span>
              <ul className="col-links">
                <li><span>ISO/IEC 27037 Compliant</span></li>
                <li><span>Cryptographic Chain-of-Custody</span></li>
                <li><span>Payload Integrity Digest Verification</span></li>
                <li><span>Enterprise Role Security</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copy-text font-mono">
            © 2026 TRACEVAULT SYSTEMS. FINANCIAL INVESTIGATION PLATFORM. ALL RIGHTS RESERVED.
          </span>
          <div className="footer-sub-links font-mono">
            <span>SECURE PROTOCOL v2.4</span>
            <span>•</span>
            <span>END-TO-END ENCRYPTED</span>
          </div>
        </div>
      </div>

      <style>{`
        .product-footer {
          width: 100%;
          background: #050a0e;
          border-top: 1px solid #16222f;
          padding: 64px 48px 36px 48px;
        }

        .footer-container {
          max-width: 1560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 64px;
        }

        @media (max-width: 1024px) {
          .footer-top {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #ffffff;
        }

        .brand-statement {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .system-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 4px;
          margin-top: 8px;
          width: fit-content;
        }

        .status-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .status-text {
          font-size: 10px;
          color: #10b981;
          letter-spacing: 0.06em;
        }

        .footer-links-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 640px) {
          .footer-links-grid {
            grid-template-columns: 1fr;
          }
        }

        .link-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .col-title {
          font-size: 11px;
          color: #ffffff;
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .col-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .col-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .col-links a:hover {
          color: #24c7c9;
        }

        .col-links span {
          color: #64748b;
          font-size: 13px;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-wrap: wrap;
          gap: 16px;
        }

        .copy-text {
          font-size: 11px;
          color: #64748b;
        }

        .footer-sub-links {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #64748b;
        }
      `}</style>
    </footer>
  );
};
