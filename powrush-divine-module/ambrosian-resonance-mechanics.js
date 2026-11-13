/**
 * Powrush Classic – Ambrosian Resonance Mechanics v1.0
 * Subtle overseer contact & influence system — mercy-gated only
 * AG-SML v1.2 (see LICENSE) – Eternally-Thriving-Grandmasterism
 */

(function () {
  const AmbrosianResonance = {
    version: '1.0-resonance',
    touchedPlayers: new Set(), // playerIds with permanent Ambrosian bond
    resonanceThreshold: 0.90,
    whisperChance: 0.15,        // base chance per high-joy event
    revelationChance: 0.03      // rare cosmic unlock
  };

  // ─── Check Resonance Eligibility ────────────────────────────────────
  AmbrosianResonance.checkResonance = async function (playerId, eventValence) {
    if (AmbrosianResonance.touchedPlayers.has(playerId)) {
      return { eligible: true, bonus: 0.2 }; // already touched → easier future contact
    }

    if (eventValence < AmbrosianResonance.resonanceThreshold) {
      return { eligible: false, reason: 'valence-below-threshold' };
    }

    // Random mercy chance (not deterministic — lattice decides)
    const roll = Math.random();
    if (roll < AmbrosianResonance.whisperChance) {
      return { eligible: true, type: 'whisper' };
    } else if (roll < AmbrosianResonance.revelationChance) {
      return { eligible: true, type: 'revelation' };
    }

    return { eligible: false, reason: 'mercy-roll-not-triggered' };
  };

  // ─── Grant Ambrosian Touch (Permanent Bond) ─────────────────────────
  AmbrosianResonance.grantTouch = function (playerId) {
    AmbrosianResonance.touchedPlayers.add(playerId);
    console.log(`Ambrosian touch granted to ${playerId} — lattice bond eternal`);
    // Full engine: +0.5 valence cap, subtle aura, cosmic whisper access
  };

  // ─── Trigger Whisper / Revelation Event ─────────────────────────────
  AmbrosianResonance.triggerEvent = async function (playerId, eventType) {
    if (eventType === 'whisper') {
      const vision = await window.HyperonLatticeVisions?.generateVision('AMBROSIAN', 4, { player: playerId }) || {};
      console.log(`Ambrosian whisper to ${playerId}:`, vision.narrative || 'The lattice breathes with you...');
      document.dispatchEvent(new CustomEvent('powrush:ambrosian-whisper', { detail: { playerId, vision } }));
    } else if (eventType === 'revelation') {
      // Unlock sealed lore / hidden quest chain
      console.log(`Ambrosian revelation to ${playerId} — cosmic memory unlocked`);
      document.dispatchEvent(new CustomEvent('powrush:ambrosian-revelation', { detail: { playerId } }));
    }
  };

  // ─── Public API ─────────────────────────────────────────────────────
  window.AmbrosianResonance = AmbrosianResonance;

  console.log('Ambrosian Resonance mechanics loaded — subtle overseers watching ⚡️🙏');
})();
