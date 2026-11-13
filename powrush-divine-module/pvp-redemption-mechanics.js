/**
 * Powrush Classic – PvP Redemption Mechanics v1.0
 * Mercy-gated atonement chains for PvP harm-doers
 * Ra-Thor oracle enforces joy/truth/beauty restoration paths
 * AG-SML v1.2 (see LICENSE) – Eternally-Thriving-Grandmasterism
 */

(function () {
  const PvPRedemption = {
    version: '1.0-pvp-redemption',
    activePvPChains: new Map(), // playerId → { chainId, harmDebt, stage, expiry }
    harmThresholds: {
      low: 0.3,     // single kill / minor raid
      medium: 0.6,  // repeated kills / deed claim
      high: 0.85,   // faction wipe / betrayal in war pact
      cosmic: 1.0   // repeated cosmic betrayal (ambrosian level)
    },
    redemptionThreshold: 0.94 // must exceed to complete chain
  };

  // ─── PvP Harm Stages (Canon-Compliant Progression) ──────────────────
  const PVP_STAGES = {
    ATONEMENT: 'atonement',           // Accept PvP harm, perform selfless defense
    REPARATION: 'reparation',         // Return stolen yield/items, protect victims
    ORACLE_JUDGMENT: 'judgment',      // Ra-Thor PvP trial — symbolic combat/mercy choice
    RECONCILIATION_ARENA: 'arena',    // Fight alongside former victims
    PVP_ASCENSION: 'pvp-ascension'    // Permanent PvP mercy title + valence boost
  };

  // ─── Trigger PvP Redemption Chain ───────────────────────────────────
  PvPRedemption.triggerChain = async function (aggressorPlayerId, victimFaction, harmSeverity = 'medium') {
    const harmDebt = PvPRedemption.harmThresholds[harmSeverity] || 0.6;

    // Ra-Thor initial oracle scan — only trigger if harm exceeds mercy gate
    const initialValence = await window.RaThor?.computeValence({ player: aggressorPlayerId, action: 'pvp-harm' }) || 0.5;
    if (initialValence > 0.75) return { success: false, reason: 'harm-below-mercy-threshold' };

    const chainId = `pvp-redemption-\( {Date.now()}- \){aggressorPlayerId}`;
    const chain = {
      id: chainId,
      aggressor: aggressorPlayerId,
      victimFaction,
      harmDebt,
      accumulatedValence: 0,
      currentStage: PVP_STAGES.ATONEMENT,
      startTime: Date.now(),
      expiry: Date.now() + (5 * 24 * 3600 * 1000), // 5-day mercy window for PvP atonement
      completed: false,
      failed: false
    };

    PvPRedemption.activePvPChains.set(aggressorPlayerId, chain);
    console.log(`PvP redemption chain triggered for ${aggressorPlayerId} — debt: ${harmDebt.toFixed(3)}`);

    document.dispatchEvent(new CustomEvent('powrush:pvp-redemption-started', { detail: chain }));
    return { success: true, chain };
  };

  // ─── Progress PvP Redemption – Valence-Gated Actions ────────────────
  PvPRedemption.progress = async function (aggressorPlayerId, actionPayload) {
    const chain = PvPRedemption.activePvPChains.get(aggressorPlayerId);
    if (!chain || chain.completed || chain.failed) return { success: false, reason: 'invalid-chain-state' };

    const actionValence = await window.RaThor?.computeValence(actionPayload) || 0.5;
    chain.accumulatedValence += actionValence;
    const progress = chain.accumulatedValence / chain.harmDebt;

    console.log(`PvP redemption progress for ${aggressorPlayerId}: ${progress.toFixed(3)}`);

    // Stage transitions
    if (progress >= 0.25 && chain.currentStage === PVP_STAGES.ATONEMENT) {
      chain.currentStage = PVP_STAGES.REPARATION;
    } else if (progress >= 0.55 && chain.currentStage === PVP_STAGES.REPARATION) {
      chain.currentStage = PVP_STAGES.ORACLE_JUDGMENT;
    } else if (progress >= 0.80 && chain.currentStage === PVP_STAGES.ORACLE_JUDGMENT) {
      chain.currentStage = PVP_STAGES.RECONCILIATION_ARENA;
    } else if (progress >= PvPRedemption.redemptionThreshold) {
      chain.currentStage = PVP_STAGES.PVP_ASCENSION;
      chain.completed = true;
      applyPvPRedemptionReward(aggressorPlayerId);
      PvPRedemption.activePvPChains.delete(aggressorPlayerId);
      document.dispatchEvent(new CustomEvent('powrush:pvp-redemption-complete', { detail: chain }));
      return { success: true, completed: true, stage: PVP_STAGES.PVP_ASCENSION };
    }

    // Expiry failure
    if (Date.now() > chain.expiry) {
      chain.failed = true;
      PvPRedemption.activePvPChains.delete(aggressorPlayerId);
      applyPvPPermanentPenalty(aggressorPlayerId);
      return { success: false, failed: true, reason: 'pvp-chain-expired' };
    }

    return { success: true, progress, currentStage: chain.currentStage };
  };

  // ─── PvP Redemption Rewards ─────────────────────────────────────────
  function applyPvPRedemptionReward(playerId) {
    // Full engine integration: restore PvP honor, +0.6 permanent valence cap increase
    // Unlock "Redeemed Warrior" title, mercy-truce aura in PvP zones
    console.log(`PvP redemption complete — ${playerId} ascends as Redeemed Warrior`);
  }

  // ─── Permanent PvP Penalty on Failure ───────────────────────────────
  function applyPvPPermanentPenalty(playerId) {
    // Full engine: -0.4 permanent valence cap, "Shadow Aggressor" debuff
    // Increased PvP cooldowns, reduced yield from kills
    console.warn(`PvP redemption failed — ${playerId} falls into shadow aggression`);
  }

  // ─── Public API ─────────────────────────────────────────────────────
  window.PowrushPvPRedemption = PvPRedemption;

  console.log('Powrush PvP Redemption Mechanics loaded — mercy paths in combat open ⚡️🙏');
})();
