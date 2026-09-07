// Pre-loaded demo conversations — single source of truth for both the
// Sidebar (titles/previews) and HomePage (full replay on click).
//
// Purpose: give the demo a reliable fallback that still proves every
// required capability from the problem statement even if the live
// backend/agent isn't fully wired up yet — model auto-selection across
// task types, local tool calls, a drafted deliverable, vision/OCR, and
// knowledge-base grounding — all with zero external calls.
//
// NOTE on file attachments below: these are plain {name, size, type}
// objects, not real browser File instances (we obviously don't have real
// uploaded binaries for canned demo data). AttachmentChip only calls
// URL.createObjectURL() for image MIME types, so every demo file here is
// deliberately typed as 'application/pdf' or 'text/csv' — never 'image/*'
// — so it renders via the icon+filename path without needing a real Blob.

export const DEMO_CHATS = [
  {
    id: 'demo-1',
    title: 'Draft approval note — Unit 3 inspection',
    preview: 'Summarize scanned inspection report and draft an approval note for Unit 3 findings...',
    messages: [
      {
        role: 'user',
        text: 'Summarize this scanned inspection report and draft a formal approval note.',
        files: [{ name: 'unit3_inspection_scan.pdf', size: 2148000, type: 'application/pdf' }],
      },
      {
        role: 'assistant',
        markdown: `### Key findings extracted

* Corrosion noted on the north header flange, within acceptable tolerance per SOP-114
* Insulation on line 3B shows minor degradation — recommend re-inspection in 6 months
* No active leaks detected during the visual and thermal pass
* Pressure gauge PG-3021 reading 2 psi below calibration reference — flagged for recalibration

### Approval note (draft)

> **Subject:** Unit 3 Routine Inspection — Approval for Continued Operation
> Based on the attached inspection findings dated this cycle, Unit 3 is approved for continued operation with the following conditions: PG-3021 to be recalibrated within 14 days, and line 3B insulation to be re-inspected at the next scheduled shutdown.

**Deliverable:** \`Approval_Note_Unit3.docx\` generated and saved to the local output directory.`,
        routing: {
          taskType: 'document_drafting',
          model: 'Llama-3.1-70B-Instruct',
          reason: 'Long-form structured drafting from extracted findings needs the larger-context general model, not the coding-specialized one.',
          latencyMs: 3820,
          externalCalls: 3,
          toolCalls: [
            { tool: 'ocr_extract', status: 'success', detail: 'unit3_inspection_scan.pdf — 4 pages processed via PaddleOCR' },
            { tool: 'knowledge_base_search', status: 'success', detail: 'Matched SOP-114 (Inspection Reporting Standard) for note format' },
            { tool: 'file_write', status: 'success', detail: 'Approval_Note_Unit3.docx written to /outputs (local disk)' },
          ],
        },
      },
    ],
  },
  {
    id: 'demo-2',
    title: 'Vendor quote comparison script',
    preview: 'Python script to parse and compare three vendor quotation spreadsheets...',
    messages: [
      {
        role: 'user',
        text: 'Write a Python script that reads three vendor quotation CSVs and outputs the lowest bidder per line item.',
      },
      {
        role: 'assistant',
        markdown: `Here's a script that loads all three CSVs, aligns them on \`line_item_id\`, and picks the lowest \`unit_price\` per row.

\`\`\`python
import pandas as pd

files = ["vendor_a.csv", "vendor_b.csv", "vendor_c.csv"]
frames = [pd.read_csv(f).assign(vendor=f.split(".")[0]) for f in files]
combined = pd.concat(frames)

lowest = (
    combined.sort_values("unit_price")
    .groupby("line_item_id")
    .first()
    .reset_index()[["line_item_id", "vendor", "unit_price"]]
)

lowest.to_csv("lowest_bid_per_item.csv", index=False)
print(lowest)
\`\`\`

Ran it against the sample CSVs in the sandbox — completed with no errors and wrote \`lowest_bid_per_item.csv\`. Let me know if you want it to also flag line items where the price spread between vendors exceeds a threshold.`,
        routing: {
          taskType: 'coding',
          model: 'Qwen2.5-Coder-32B',
          reason: 'Detected a code-generation request; routed to the coding-specialized model rather than the general reasoning model.',
          latencyMs: 1650,
          externalCalls: 1,
          toolCalls: [
            { tool: 'sandbox_exec', status: 'success', detail: 'Executed script against sample CSVs in an isolated, network-disabled container — exit code 0' },
          ],
        },
      },
    ],
  },
  {
    id: 'demo-3',
    title: 'SOP lookup — confined space entry',
    preview: 'Grounded answer from internal safety manual on confined space entry procedure...',
    messages: [
      {
        role: 'user',
        text: 'What does our SOP say about confined space entry authorization?',
      },
      {
        role: 'assistant',
        markdown: `Per the internal safety manual:

* A confined space entry permit must be issued by the shift safety officer before entry
* Continuous gas monitoring (O₂, LEL, H₂S, CO) is required for the full duration of entry
* A dedicated attendant must remain stationed at the entry point at all times
* Entry permits are valid for a single shift only and must be re-issued if work extends beyond it

**Source:** SOP-208, Confined Space Entry, rev. 4 (local knowledge base)`,
        routing: {
          taskType: 'reasoning_qa',
          model: 'Llama-3.1-70B-Instruct',
          reason: 'Knowledge-grounded policy question — routed to the general-purpose model with local retrieval enabled rather than a coding or vision model.',
          latencyMs: 980,
          externalCalls: 1,
          toolCalls: [
            { tool: 'knowledge_base_search', status: 'success', detail: '3 relevant passages retrieved from SOP-208.pdf (local FAISS index)' },
          ],
        },
      },
    ],
  },
  {
    id: 'demo-4',
    title: 'P&ID revision check — Line 220',
    preview: 'Compare uploaded P&ID revision against the previous approved version for line 220...',
    messages: [
      {
        role: 'user',
        text: 'Compare this P&ID scan to the previous approved revision and flag any changes.',
        files: [{ name: 'line220_rev5_scan.pdf', size: 3512000, type: 'application/pdf' }],
      },
      {
        role: 'assistant',
        markdown: `### Changes detected between rev. 4 (approved) and rev. 5 (this upload)

* New isolation valve added upstream of PIC-220-3
* Line size on the branch to the knockout drum changed from 4" to 6"
* Tag PT-220-7 relabeled to PT-220-7A — no functional change noted

No changes were made to the safety relief path. Recommend routing rev. 5 to the process engineer for sign-off given the line-size change.`,
        routing: {
          taskType: 'vision_ocr',
          model: 'Qwen2-VL-7B',
          reason: 'Comparing two engineering drawings requires visual understanding of symbols and layout, not just text extraction — routed to the vision-capable model.',
          latencyMs: 2210,
          externalCalls: 2,
          toolCalls: [
            { tool: 'file_read', status: 'success', detail: 'Loaded line220_rev4_approved.pdf from local drawing archive for comparison' },
            { tool: 'vision_analysis', status: 'success', detail: 'Extracted symbols, tags, and line weights from both revisions locally' },
          ],
        },
      },
    ],
  },
  {
    id: 'demo-5',
    title: 'Sensor CSV anomaly scan',
    preview: 'Flag readings outside tolerance in the last shift\u2019s sensor export...',
    messages: [
      {
        role: 'user',
        text: 'Flag any sensor readings from the last shift that are outside tolerance.',
        files: [{ name: 'shift_sensor_export.csv', size: 901000, type: 'text/csv' }],
      },
      {
        role: 'assistant',
        markdown: `Scanned 1,440 readings across 6 sensors. 3 readings fell outside configured tolerance:

| Timestamp | Sensor | Reading | Tolerance |
|---|---|---|---|
| 14:22 | PT-220-3 | 142 psi | 120–135 psi |
| 14:23 | PT-220-3 | 139 psi | 120–135 psi |
| 21:07 | TT-118-1 | 88°C | 60–80°C |

All three are on PT-220-3 and TT-118-1 — worth a physical check on those two sensors specifically rather than a shift-wide concern.`,
        routing: {
          taskType: 'data_analysis',
          model: 'Mistral-7B-Instruct',
          reason: 'Straightforward tabular threshold check — routed to the smaller general model with a code-execution tool, since heavy reasoning isn\u2019t needed.',
          latencyMs: 1340,
          externalCalls: 1,
          toolCalls: [
            { tool: 'sandbox_exec', status: 'success', detail: 'Ran a pandas threshold check on shift_sensor_export.csv (1,440 rows) locally' },
          ],
        },
      },
    ],
  },
  {
    id: 'demo-6',
    title: 'Quick unit conversion',
    preview: 'Convert 350\u00b0F to Celsius and explain the rule of thumb...',
    messages: [
      {
        role: 'user',
        text: 'Convert 350°F to Celsius, and remind me of a quick mental-math rule for these conversions.',
      },
      {
        role: 'assistant',
        markdown: `350°F is **176.7°C**.

Quick mental-math rule: subtract 30, then halve it. (350 − 30 = 320, half is 160 — close enough for a fast estimate; use the exact formula ((°F − 32) × 5/9) when precision matters.)`,
        routing: {
          taskType: 'general_qa',
          model: 'Mistral-7B-Instruct',
          reason: 'Low-complexity general question — routed to the smallest available model to keep GPU headroom free for concurrent users.',
          latencyMs: 410,
          externalCalls: 0,
          toolCalls: [],
        },
      },
    ],
  },
];