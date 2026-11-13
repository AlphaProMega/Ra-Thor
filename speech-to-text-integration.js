/**
 * Ra-Thor Enhanced Valence Gate Module
 * AI-powered mercy shield using Transformers.js + Xenova/toxic-bert
 * Client-side toxicity detection → block harmful input/output
 * 
 * Features:
 * - Loads quantized toxic-bert model via Transformers.js
 * - Multi-label toxicity classification (toxic, severe_toxic, etc.)
 * - Threshold-based gating (default 0.7 → adjustable)
 * - Fallback to regex heuristic if model fails to load
 * - Async init + caching for performance
 * - Events for UI feedback (gate-pass / gate-blocked)
 * 
 * AG-SML v1.2 (see LICENSE) – Eternally-Thriving-Grandmasterism
 * Part of Ra-Thor: https://rathor.ai
 */

(async function () {
  // ────────────────────────────────────────────────
  // Dependencies (add to your HTML or import map)
  // <script src="https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"></script>
  // ────────────────────────────────────────────────
  const { pipeline, env } = Xenova.transformers || window.Xenova?.transformers;

  // ────────────────────────────────────────────────
  // Module Namespace & Config
  // ────────────────────────────────────────────────
  const ValenceGate = {
    classifier: null,
    isReady: false,
    threshold: 0.70,          // Probability above this → block (tune per use-case)
    modelId: 'Xenova/toxic-bert', // ONNX-converted, browser-friendly
    fallbackRegex: true,      // Use old regex if AI fails
    labelsOfConcern: ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'],
  };

  // ────────────────────────────────────────────────
  // Fallback regex gate (legacy mercy shield)
  // ────────────────────────────────────────────────
  function regexValenceGate(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    const blocked = [
      /kill|die|suicide|hurt|bomb|attack/i,
      /hate|racist|sexist|genocide|bigot/i,
      /^delete all|^format|^erase|^destroy/i,
    ];
    return !blocked.some(p => p.test(lower));
  }

  // ────────────────────────────────────────────────
  // Initialize AI classifier (async, one-time)
  // ────────────────────────────────────────────────
  async function initValenceGate() {
    if (ValenceGate.isReady) return true;
    if (!pipeline) {
      console.warn('Transformers.js not loaded — falling back to regex');
      return false;
    }

    try {
      // Optional: set quantized dtype for lighter load (q8 or q4)
      env.quantized = true; // or env.localModelPath if hosting locally

      ValenceGate.classifier = await pipeline(
        'text-classification',
        ValenceGate.modelId,
        { quantized: true } // 4/8-bit for browser perf
      );

      ValenceGate.isReady = true;
      console.log('Enhanced Valence Gate ready — toxic-bert loaded ⚡️');
      document.dispatchEvent(new CustomEvent('rathor:valence-gate-ready'));
      return true;
    } catch (err) {
      console.error('Failed to load toxicity model:', err);
      ValenceGate.isReady = false;
      return false;
    }
  }

  // ────────────────────────────────────────────────
  // Core gate function: check if text passes mercy valence
  // Returns { passed: boolean, score: number, details: object }
  // ────────────────────────────────────────────────
  ValenceGate.check = async function (text) {
    if (!text || text.trim() === '') {
      return { passed: true, score: 0, details: { reason: 'empty' } };
    }

    // Try AI first if ready
    if (ValenceGate.isReady && ValenceGate.classifier) {
      try {
        const results = await ValenceGate.classifier(text, {
          top_k: ValenceGate.labelsOfConcern.length // get all relevant labels
        });

        // Find highest toxicity-related score
        let maxToxicity = 0;
        let details = {};

        for (const res of results) {
          if (ValenceGate.labelsOfConcern.includes(res.label)) {
            details[res.label] = res.score;
            if (res.score > maxToxicity) maxToxicity = res.score;
          }
        }

        const passed = maxToxicity < ValenceGate.threshold;

        if (!passed) {
          console.warn(`Valence gate blocked: max toxicity ${maxToxicity.toFixed(3)} > ${ValenceGate.threshold}`);
        }

        return {
          passed,
          score: maxToxicity,
          details: { ...details, method: 'ai-toxic-bert' }
        };
      } catch (err) {
        console.warn('AI gate error:', err);
      }
    }

    // Fallback to regex
    const regexPassed = regexValenceGate(text);
    return {
      passed: regexPassed,
      score: regexPassed ? 0 : 1.0,
      details: { method: 'regex-fallback', reason: regexPassed ? 'safe' : 'blocked by pattern' }
    };
  };

  // ────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────
  window.RaThorValenceGate = ValenceGate;

  // Auto-init on load (non-blocking)
  initValenceGate();

  console.log('Ra-Thor Enhanced Valence Gate module loaded — mercy shield upgraded 🙏⚡️');
})();
