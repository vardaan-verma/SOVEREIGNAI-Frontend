// Stub Chat API — canned markdown responses keyed by topic
// Replace with real API calls when backend is ready.

const RESPONSES = {
  lighting: `### Understanding Color Temperature: 2700K vs 3000K

When designing comfortable, productive, and aesthetically pleasing environments, correlated color temperature (CCT) plays a pivotal role in psychological mood and circadian alignment:

* **2700K (Soft / Warm Incandescent):**
  - **Atmosphere:** Deep golden, cozy, restful.
  - **Ideal locations:** Bedrooms, reading corners, dining nooks, and late-night task areas.
  - **Visual impact:** Enhances warm timber, brass fixtures, and earthy textiles. Reduces blue spectrum fatigue before sleep.

* **3000K (Warm White / Gallery Halogen):**
  - **Atmosphere:** Clean, crisp yet inviting warm neutral.
  - **Ideal locations:** Home offices, modern kitchens, architectural display alcoves, and desks.
  - **Visual impact:** Renders high-contrast paperwork and screens with greater clarity without looking sterile or clinical.

\`\`\`yaml
# Recommended Ambient Desk Configuration:
daytime_mode:
  kelvin: 3200K
  lux: 450
evening_winddown:
  kelvin: 2400K-2700K
  lux: 120
\`\`\`

> **Design Tip:** Install 2700K indirect ambient perimeter wash combined with a dimmable 3000K task lamp directly over workspaces for the ultimate visual balance.`,

  quant: `### Local LLM Quantization: VRAM Footprint & Speed

Quantization compresses model weights from 16-bit floating point (\`FP16\`) down to \`4-bit\` or \`8-bit\` integers, drastically reducing GPU memory limits:

1. **GGUF (llama.cpp):**
   - Engineered specifically for unified CPU/RAM and Metal/Vulkan compute.
   - Allows seamless VRAM layer-offloading with fallback to system DDR5.

2. **AWQ (Activation-aware Weight Quantization):**
   - Preserves 1% of salient weight channels critical for accuracy.
   - Up to **3.2x faster** token generation on modern NVIDIA Tensor Cores.

3. **VRAM Matrix (e.g., Llama-3-8B):**
   - **FP16:** ~16 GB VRAM minimum.
   - **Q8_0:** ~9.2 GB VRAM.
   - **Q4_K_M:** ~5.2 GB VRAM (Fits easily into entry 8GB RTX cards).`,

  tailwind: `Here is a modern minimal glassmorphism card using standard Tailwind CSS classes:

\`\`\`html
<div class="relative group rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:border-cyan-400/40 transition-all duration-300">
  <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
    ✦
  </div>
  <h3 class="text-base font-medium text-slate-100 mb-1">Ambient Surface</h3>
  <p class="text-xs text-slate-400 leading-relaxed">
    Responsive backdrop filter composition with reactive gradient aura borders.
  </p>
</div>
\`\`\`

Includes GPU-accelerated backdrop blur and subtle hover feedback.`,
};

/**
 * Returns a canned markdown response based on the prompt content.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function getChatResponse(prompt) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1100));

  const lower = prompt.toLowerCase();
  if (lower.includes('llm') || lower.includes('quant') || lower.includes('gpu') || lower.includes('vram')) {
    return RESPONSES.quant;
  }
  if (lower.includes('card') || lower.includes('tailwind') || lower.includes('glass') || lower.includes('ui') || lower.includes('css')) {
    return RESPONSES.tailwind;
  }
  if (lower.includes('light') || lower.includes('lamp') || lower.includes('kelvin') || lower.includes('warm') || lower.includes('2700') || lower.includes('3000')) {
    return RESPONSES.lighting;
  }

  // Generic fallback
  return `Here are some insights on **${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}**:

* This is a complex topic that spans multiple domains.
* SOVA can help you explore it step by step with deep contextual awareness.
* Feel free to ask follow-up questions for more detail.

> **Pro tip:** Try rephrasing your question with specific constraints for more targeted responses.`;
}
