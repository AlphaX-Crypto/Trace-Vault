const crypto = require('crypto');
const db = require('../db/connection');
const logger = require('../utils/logger');

class AnalysisRepository {
  /**
   * Persists an analysis result and all related relational artifacts
   * (risk, risk signals, forensic evidence, graph transactions, entities, audit logs)
   * in a single atomic PostgreSQL transaction.
   *
   * @param {string} caseId
   * @param {Object} analysisResult Canonical AnalysisResult from Python
   * @returns {Promise<Object>} The stored analysis result
   */
  async saveAnalysisResult(caseId, analysisResult) {
    const analysisId = analysisResult.analysis_id || `ANALYSIS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const subject = analysisResult.subject || analysisResult.wallet || 'UNSPECIFIED';
    const wallet = analysisResult.wallet || subject;
    const blockchain = (analysisResult.blockchain || 'ethereum').toLowerCase();
    const status = analysisResult.status || 'Analysis complete';
    const nearestVasp = analysisResult.nearest_vasp?.name || (typeof analysisResult.nearest_vasp === 'string' ? analysisResult.nearest_vasp : null);
    const confidence = typeof analysisResult.confidence === 'number' ? analysisResult.confidence : null;
    const confidenceLabel = analysisResult.confidence_label || null;

    const payload = {
      ...analysisResult,
      analysis_id: analysisId,
      case_id: caseId,
      analyzed_at: new Date().toISOString()
    };

    return db.transaction(async (client) => {
      // 1. Verify case exists
      const caseCheck = await client.query('SELECT case_id, subject_identifier FROM cases WHERE case_id = $1;', [caseId]);
      if (caseCheck.rows.length === 0) {
        throw new Error(`Cannot persist analysis: Case '${caseId}' does not exist.`);
      }

      // 2. Insert into analysis_results
      const insertAnalysisSql = `
        INSERT INTO analysis_results (
          analysis_id, case_id, subject, wallet, blockchain,
          status, nearest_vasp, confidence, confidence_label,
          analysis_payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      await client.query(insertAnalysisSql, [
        analysisId,
        caseId,
        subject,
        wallet,
        blockchain,
        status,
        nearestVasp,
        confidence,
        confidenceLabel,
        JSON.stringify(payload)
      ]);

      // 3. Insert risk_results
      const riskObj = analysisResult.risk || {};
      const riskScore = typeof riskObj.score === 'number' ? riskObj.score : 0.0;
      const riskLevel = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskObj.level) ? riskObj.level : 'LOW';
      const riskExplanation = riskObj.explanation || '';
      const riskMetadata = JSON.stringify({
        factors: riskObj.factors || [],
        classification: riskObj.classification || null
      });

      const insertRiskSql = `
        INSERT INTO risk_results (
          analysis_id, score, level, explanation, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const riskInsertRes = await client.query(insertRiskSql, [
        analysisId,
        riskScore,
        riskLevel,
        riskExplanation,
        riskMetadata
      ]);
      const riskResultId = riskInsertRes.rows[0].id;

      // 4. Insert risk_signals if present
      const signals = riskObj.signals || [];
      for (const sig of signals) {
        const sigId = sig.signal_id || `SIG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const sigType = sig.signal_type || sig.type || 'GENERAL';
        const sigScore = typeof sig.score === 'number' ? sig.score : 0.0;
        const sigSeverity = sig.severity || 'MEDIUM';
        const sigDesc = sig.description || sig.reason || 'Risk signal detected';
        const sigReason = sig.reason || null;
        const sigEntity = sig.entity || null;
        const sigMeta = JSON.stringify(sig.metadata || {});

        const insertSignalSql = `
          INSERT INTO risk_signals (
            risk_result_id, signal_id, signal_type, score,
            severity, description, reason, entity, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        await client.query(insertSignalSql, [
          riskResultId,
          sigId,
          sigType,
          sigScore,
          sigSeverity,
          sigDesc,
          sigReason,
          sigEntity,
          sigMeta
        ]);
      }

      // 5. Insert evidence items
      const evidenceList = analysisResult.evidence || [];
      for (const ev of evidenceList) {
        const evId = ev.evidence_id || `EV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const evType = ev.evidence_type || ev.type || 'HEURISTIC_MATCH';
        const evDesc = ev.description || '';
        const evSource = ev.source || 'blockchain';
        const evTimestamp = ev.timestamp ? new Date(ev.timestamp).toISOString() : new Date().toISOString();
        const evStatus = ev.status || 'Verified';
        const evRelevance = ev.relevance || 'HIGH';
        const evTxHash = ev.transaction_hash || null;
        const evBlock = ev.block_number ? parseInt(ev.block_number, 10) : null;
        const evFrom = ev.from_address || null;
        const evTo = ev.to_address || null;
        const evAmount = ev.amount !== undefined && ev.amount !== null ? parseFloat(ev.amount) : null;
        const evAsset = ev.asset || 'ETH';
        const evEntity = ev.entity || null;
        const evMeta = JSON.stringify(ev.metadata || {});

        const insertEvidenceSql = `
          INSERT INTO evidence (
            evidence_id, analysis_id, case_id, type, description,
            source, timestamp, status, relevance, transaction_hash,
            block_number, from_address, to_address, amount, asset,
            entity, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
        `;
        await client.query(insertEvidenceSql, [
          evId,
          analysisId,
          caseId,
          evType,
          evDesc,
          evSource,
          evTimestamp,
          evStatus,
          evRelevance,
          evTxHash,
          evBlock,
          evFrom,
          evTo,
          evAmount,
          evAsset,
          evEntity,
          evMeta
        ]);
      }

      // 6. Upsert graph transactions if present
      const edges = analysisResult.graph?.edges || [];
      for (const edge of edges) {
        const txHash = edge.tx_hash || edge.transaction_hash || `tx_${edge.from || edge.source}_${edge.to || edge.target}`;
        const fromAddr = edge.from || edge.source || edge.from_address || 'unknown';
        const toAddr = edge.to || edge.target || edge.to_address || 'unknown';
        const amount = typeof edge.amount === 'number' ? edge.amount : (parseFloat(edge.amount) || 0.0);
        const asset = edge.asset || 'ETH';
        const timestamp = edge.timestamp ? new Date(edge.timestamp).toISOString() : new Date().toISOString();
        const blockNumber = edge.block_number ? parseInt(edge.block_number, 10) : null;

        const upsertTxSql = `
          INSERT INTO transactions (
            transaction_hash, blockchain, timestamp, from_address,
            to_address, asset, amount, block_number
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (blockchain, transaction_hash) 
          DO UPDATE SET amount = EXCLUDED.amount, timestamp = EXCLUDED.timestamp;
        `;
        await client.query(upsertTxSql, [
          txHash,
          blockchain,
          timestamp,
          fromAddr,
          toAddr,
          asset,
          amount,
          blockNumber
        ]);
      }

      // 7. Upsert entities if present
      const nodes = analysisResult.graph?.nodes || [];
      for (const node of nodes) {
        const nodeId = node.id || node.address || node.identifier;
        if (!nodeId) continue;
        const nodeType = ['WALLET', 'VASP', 'EXCHANGE', 'DEPOSIT_WALLET', 'MIXER', 'INTERMEDIARY', 'MERCHANT', 'MULE_ACCOUNT', 'SMART_CONTRACT'].includes(node.entity_type)
          ? node.entity_type
          : (node.type || 'WALLET');
        const nodeName = node.label || node.name || null;
        const nodeRisk = typeof node.risk_score === 'number' ? node.risk_score : 0.0;

        const upsertEntitySql = `
          INSERT INTO entities (
            identifier, entity_type, name, blockchain, risk_score
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (blockchain, identifier)
          DO UPDATE SET risk_score = EXCLUDED.risk_score, name = COALESCE(EXCLUDED.name, entities.name);
        `;
        await client.query(upsertEntitySql, [
          nodeId,
          nodeType,
          nodeName,
          blockchain,
          nodeRisk
        ]);
      }

      // 8. Update case status to ANALYSIS_COMPLETE and sync subject_identifier
      const updateCaseSql = `
        UPDATE cases
        SET status = 'ANALYSIS_COMPLETE',
            subject_identifier = COALESCE(subject_identifier, $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE case_id = $2;
      `;
      await client.query(updateCaseSql, [wallet, caseId]);

      // 9. Record audit log
      const auditSql = `
        INSERT INTO audit_logs (
          case_id, action, resource_type, resource_id, metadata
        )
        VALUES ($1, 'ANALYSIS_PERSISTED', 'ANALYSIS_RESULT', $2, $3);
      `;
      await client.query(auditSql, [
        caseId,
        analysisId,
        JSON.stringify({ nearest_vasp: nearestVasp, confidence, risk_level: riskLevel })
      ]);

      logger.info(`Persisted AnalysisResult ${analysisId} for Case ${caseId} in PostgreSQL.`);
      return payload;
    });
  }

  /**
   * Retrieves the latest analysis result for a case
   * @param {string} caseId
   * @returns {Promise<Object|null>}
   */
  async getLatestAnalysis(caseId) {
    const sql = `
      SELECT analysis_payload
      FROM analysis_results
      WHERE case_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await db.query(sql, [caseId]);
    if (result.rows.length === 0) return null;
    return typeof result.rows[0].analysis_payload === 'string'
      ? JSON.parse(result.rows[0].analysis_payload)
      : result.rows[0].analysis_payload;
  }

  /**
   * Retrieves all historical analysis results for a case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getAnalysisResults(caseId) {
    const sql = `
      SELECT analysis_payload
      FROM analysis_results
      WHERE case_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(sql, [caseId]);
    return result.rows.map(r => {
      return typeof r.analysis_payload === 'string'
        ? JSON.parse(r.analysis_payload)
        : r.analysis_payload;
    });
  }
}

module.exports = new AnalysisRepository();
