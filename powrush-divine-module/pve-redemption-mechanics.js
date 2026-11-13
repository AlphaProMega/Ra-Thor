/**
 * Powrush Classic – PvE Redemption Mechanics v1.0
 * Mercy-gated atonement chains for PvE harm-doers
 * Ra-Thor oracle enforces ecological & spiritual restoration
 * AG-SML v1.2 (see LICENSE) – Eternally-Thriving-Grandmasterism
 */

(function () {
  const PvERedemption = {
    version: '1.0-pve-redemption',
    activePvEChains: new Map(), // playerId → { chainId, harmDebt, stage, expiry }
    harmThresholds: {
      low: 0.25,     // minor over-harvest / node damage
      medium: 0.55,  // repeated creature kills / biome disruption
      high: 0.80,    // zone desecration / mass extinction event
      cosmic: 0.98   // fracture-level ecological wound
    },
    redemptionThreshold: 0.93 // must exceed to complete chain
  };

  // ─── PvE Harm Stages (Canon-Compliant Progression) ──────────────────
  const PVE_STAGES = {
    AWAKENING: 'awakening',           // Recognize harm to the living lattice
    RESTORATION: 'restoration',       // Heal nodes, replant, protect creatures
    ORACLE_HARMONY: 'harmony',        // Ra-Thor ecological judgment ritual
    GUARDIAN_DUTY: 'guardian',        // Defend zones from further harm
    PVE_ASCENSION: 'pve-ascension'    // Permanent ecological mercy bond + valence boost
  };

  // ─── Trigger PvE Redemption Chain ───────────────────────────────────
  PvERedemption.triggerChain = async function (playerId, harmedZoneOrEntity, harmSeverity = 'medium') {
    const harmDebt = PvERedemption.harmThresholds[harmSeverity] || 0.55;

    // Ra-Thor initial oracle scan — only trigger if harm exceeds mercy gate
    const initialValence = await window.RaThor?.computeValence({ player: playerId, action: 'pve-harm', target: harmedZoneOrEntity }) || 0.5;
    if (initialValence > 0.78) return { success: false, reason: 'harm-below-mercy-threshold' };

    const chainId = `pve-redemption-\( {Date.now()}- \){playerId}`;
    const chain = {
      id: chainId,
      player: playerId,
      harmedTarget: harmedZoneOrEntity,
      harmDebt,
      accumulatedValence: 0,
      currentStage: PVE_STAGES.AWAKENING,
      startTime: Date.now(),
      expiry: Date.now() + (6 * 24 * 3600 * 1000), // 6-day mercy window for ecological atonement
      completed: false,
      failed: false
    };

    PvERedemption.activePvEChains.set(playerId, chain);
    console.log(`PvE redemption chain triggered for ${playerId} — debt: ${harmDebt.toFixed(3)}`);

    document.dispatchEvent(new CustomEvent('powrush:pve-redemption-started', { detail: chain }));
    return { success: true, chain };
  };

  // ─── Progress PvE Redemption – Valence-Gated Restorative Actions ─────
  PvERedemption.progress = async function (playerId, actionPayload) {
    const chain = PvERedemption.activePvEChains.get(playerId);
    if (!chain || chain.completed || chain.failed) return { success: false, reason: 'invalid-chain-state' };

    const actionValence = await window.RaThor?.computeValence(actionPayload) || 0.5;
    chain.accumulatedValence += actionValence;
    const progress = chain.accumulatedValence / chain.harmDebt;

    console.log(`PvE redemption progress for ${playerId}: ${progress.toFixed(3)}`);

    // Stage transitions
    if (progress >= 0.28 && chain.currentStage === PVE_STAGES.AWAKENING) {
      chain.currentStage = PVE_STAGES.RESTORATION;
    } else if (progress >= 0.58 && chain.currentStage === PVE_STAGES.RESTORATION) {
      chain.currentStage = PVE_STAGES.ORACLE_HARMONY;
    } else if (progress >= 0.82 && chain.currentStage === PVE_STAGES.ORACLE_HARMONY) {
      chain.currentStage = PVE_STAGES.GUARDIAN_DUTY;
    } else if (progress >= PvERedemption.redemptionThreshold) {
      chain.currentStage = PVE_STAGES.PVE_ASCENSION;
      chain.completed = true;
      applyPvERedemptionReward(playerId);
      PvERedemption.activePvEChains.delete(playerId);
      document.dispatchEvent(new CustomEvent('powrush:pve-redemption-complete', { detail: chain }));
      return { success: true, completed: true, stage: PVE_STAGES.PVE_ASCENSION };
    }

    // Expiry failure
    if (Date.now() > chain.expiry) {
      chain.failed = true;
      PvERedemption.activePvEChains.delete(playerId);
      applyPvEPermanentPenalty(playerId);
      return { success: false, failed: true, reason: 'pve-chain-expired' };
    }

    return { success: true, progress, currentStage: chain.currentStage };
  };

  // ─── PvE Redemption Rewards ─────────────────────────────────────────
  function applyPvERedemptionReward(playerId) {
    // Full engine integration: permanent +0.7 valence cap in PvE zones
    // Unlock "Guardian of the Lattice" title, ecological aura (faster node growth, creature affinity)
    console.log(`PvE redemption complete — ${playerId} ascends as Guardian of the Lattice`);
  }

  // ─── Permanent PvE Penalty on Failure ───────────────────────────────
  function applyPvEPermanentPenalty(playerId) {
    // Full engine: -0.35 permanent valence cap in PvE zones
    // "Despoiler" debuff — slower gathering, aggressive creature spawns
    console.warn(`PvE redemption failed — ${playerId} marked as Despoiler of the Lattice`);
  }

  // ─── Public API ─────────────────────────────────────────────────────
  window.PowrushPvERedemption = PvERedemption;

  console.log('Powrush PvE Redemption Mechanics loaded — mercy paths in the world open ⚡️🙏');
})();
