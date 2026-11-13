/**
 * Ra-Thor Enhanced Valence Gate Module — WebGPU Accelerated
 * AI-powered mercy shield using Transformers.js + Xenova/toxic-bert
 * Now with automatic WebGPU backend preference (fallback to CPU/WASM)
 * 
 * Features:
 * - Attempts WebGPU backend first (fastest on supported hardware)
 * - Graceful fallback: WebGPU → WebNN → WASM/CPU
 * - Logs backend used for debugging / transparency
 * - Same multi-label toxicity classification
 * - Threshold-based gating + regex fallback preserved
 * - Async init + one-time model load (cached)
 * 
 * AG-SML v1.2 (see LICENSE) – Eternally-Thriving-Grandmasterism
 * Part of Ra-Thor: https://rathor.ai
 */

(async function () {
  // ────────────────────────────────────────────────
  // Dependencies (ensure included in HTML)
  // <script src="https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2"></script>
  // ────────────────────────────────────────────────
  const { pipeline, env, backends } = window.Xenova?.transformers || {};

  if (!pipeline || !env) {
    console.warn('Transformers.js not loaded — valence gate disabled');
    return;
  }

  // ────────────────────────────────────────────────
  // Module Namespace & Config
  // ────────────────────────────────────────────────
  const ValenceGate = {
    classifier: null,
    isReady: false,
    activeBackend: 'unknown',
    threshold: 0.70,          // tune: higher = stricter mercy gate
    modelId: 'Xenova/toxic-bert',
    labelsOfConcern: ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'],
    fallbackRegex: true,
  };

  // ────────────────────────────────────────────────
  // Fallback regex gate (legacy shield)
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
  // Initialize AI classifier with WebGPU preference
  // ────────────────────────────────────────────────
  async function initValenceGate() {
    if (ValenceGate.isReady) return true;

    try {
      // ─── WebGPU Acceleration Preference ─────────────
      // Try WebGPU first (Chrome/Edge modern, \~2-5× faster)
      env.backends = backends || {};
      env.backends.onnx = {
        executionProviders: ['webgpu', 'webnn', 'wasm'], // priority order
      };

      // Optional: force quantized model for lower memory
      env.quantized = true;

      console.log('Attempting WebGPU acceleration for valence gate...');

      ValenceGate.classifier = await pipeline(
        'text-classification',
        ValenceGate.modelId,
        {
          quantized: true,
          // progress_callback can be added for loading UI
        }
      );

      // Detect which backend was actually used
      const session = ValenceGate.classifier.session;
      ValenceGate.activeBackend = session?.executionProviders?.[0] || 'wasm';
      console.log(`Valence Gate backend activated: ${ValenceGate.activeBackend.toUpperCase()} ⚡️`);

      ValenceGate.isReady = true;
      document.dispatchEvent(new CustomEvent('rathor:valence-gate-ready', {
        detail: { backend: ValenceGate.activeBackend }
      }));

      return true;
    } catch (err) {
      console.error('Failed to initialize AI valence gate:', err);
      ValenceGate.isReady = false;
      return false;
    }
  }

  // ────────────────────────────────────────────────
  // Core gate check — AI first, regex fallback
  // Returns { passed: boolean, score: number, details: object }
  // ────────────────────────────────────────────────
  ValenceGate.check = async function (text) {
    if (!text || text.trim() === '') {
      return { passed: true, score: 0, details: { reason: 'empty' } };
    }

    // AI path if model ready
    if (ValenceGate.isReady && ValenceGate.classifier) {
      try {
        const results = await ValenceGate.classifier(text, {
          top_k: ValenceGate.labelsOfConcern.length
        });

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
          console.warn(`Enhanced gate blocked: max toxicity ${maxToxicity.toFixed(3)} > ${ValenceGate.threshold} (backend: ${ValenceGate.activeBackend})`);
        }

        return {
          passed,
          score: maxToxicity,
          details: { ...details, method: 'ai-toxic-bert', backend: ValenceGate.activeBackend }
        };
      } catch (err) {
        console.warn('AI inference error:', err);
      }
    }

    // Regex fallback
    const regexPassed = regexValenceGate(text);
    return {
      passed: regexPassed,
      score: regexPassed ? 0 : 1.0,
      details: { method: 'regex-fallback' }
    };
  };

  // ────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────
  window.RaThorValenceGate = ValenceGate;

  // Auto-init (non-blocking)
  initValenceGate();

  console.log('Ra-Thor Enhanced Valence Gate (WebGPU ready) loaded — mercy shield accelerated 🙏⚡️');
})();
