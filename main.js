// main.js – sovereign entry with persistence & dossiers
// AG-SML v1.2 – Autonomicity Games Inc. 2026 (see LICENSE)

import { hyperon } from './hyperon-runtime.js';
import { seedProfessionalDossiers } from './professional-dossiers-seeder.js';
// Assume chat-ui-streaming.js handles load

async function initRathor() {
  await hyperon.init();
  await seedProfessionalDossiers();
  console.log("[Rathor] Sovereign lattice + professional mercy seeded – streaming eternal");
}

initRathor();
