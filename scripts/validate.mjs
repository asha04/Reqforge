#!/usr/bin/env node
// ReqForge — headless validation harness
// Extracts the application's JavaScript from index.html, runs the conversion
// pipeline against the built-in sample specification, and asserts 50 invariants.
//
// Usage:  node scripts/validate.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(resolve(HERE, '..', 'index.html'), 'utf8');

// Extract just the pipeline portion of the inline script (skip DOM wiring).
const scriptMatch = HTML.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('No <script> block found in index.html'); process.exit(1); }
const fullScript = scriptMatch[1];
const wiringMarker = '/* ============================================================\n   WIRING';
const core = fullScript.split(wiringMarker)[0];

// Browser-global shims so the core can execute under Node.
const shim = `
const document = {
  querySelector: () => ({
    value:'', classList:{add(){},remove(){},toggle(){}}, style:{},
    innerHTML:'', textContent:'', addEventListener(){}, appendChild(){}
  }),
  querySelectorAll: () => [],
  createElement: () => ({ click(){}, href:'', download:'', style:{} })
};
const window = {};
class DOMParser {
  parseFromString(xml){
    const stack=[]; const tagRe=/<\\/?([A-Za-z][\\w:-]*)(\\s[^>]*?)?\\/?>/g;
    let m, parserError=false; const selfClosing=/\\/>$/;
    while((m=tagRe.exec(xml))){
      const full=m[0], name=m[1];
      if(full.startsWith('</')){
        if(!stack.length || stack[stack.length-1]!==name){ parserError=true; break; }
        stack.pop();
      } else if(!selfClosing.test(full) && !full.startsWith('<?')) stack.push(name);
    }
    if(stack.length) parserError = true;
    return {
      querySelector:s => s==='parsererror'
        ? (parserError?{}:null)
        : (new RegExp('<'+s+'\\\\b','i').test(xml) ? {} : null),
      querySelectorAll(s){
        if(s==='SPEC-OBJECT') return [...xml.matchAll(/<SPEC-OBJECT\\s+IDENTIFIER="([^"]+)"/g)].map(m=>({getAttribute:()=>m[1]}));
        if(s==='ENUM-VALUE') return [...xml.matchAll(/<ENUM-VALUE\\s+IDENTIFIER="([^"]+)"/g)].map(m=>({getAttribute:()=>m[1]}));
        if(s==='SPEC-HIERARCHY SPEC-OBJECT-REF') return [...xml.matchAll(/<SPEC-HIERARCHY[\\s\\S]*?<SPEC-OBJECT-REF>([^<]+)<\\/SPEC-OBJECT-REF>/g)].map(m=>({textContent:m[1]}));
        if(s==='ENUM-VALUE-REF') return [...xml.matchAll(/<ENUM-VALUE-REF>([^<]+)<\\/ENUM-VALUE-REF>/g)].map(m=>({textContent:m[1]}));
        return [];
      }
    };
  }
}
`;

const drive = `
State.cfg = {
  project: 'MED — Infusion Platform',
  module:  'System Requirements Module',
  schema:  'IEC 62304 Medical Profile',
  baseline:'sample'
};
State.baseline = SAMPLE_BASELINE;
State.docNames = ['Pasted specification'];

const struct = parseDocument(SAMPLE_SPEC, 'Pasted specification');
const cands  = extractCandidates(struct);
State.reqs = normalize(cands);
State.reqs.forEach(classify);
State.hierarchy = buildHierarchy(State.reqs);
validate(State.reqs);
State.links = buildTraceability(State.reqs, State.baseline);
computeReadiness(State.reqs);
State.reqifXml   = generateReqIF(State.reqs, State.cfg);
State.reqifValid = validateReqIF(State.reqifXml, State.reqs);

globalThis.__OUT__ = {
  reqs: State.reqs,
  links: State.links,
  reqifXml: State.reqifXml,
  reqifValid: State.reqifValid
};
`;

// Evaluate the assembled module in this process.
const code = shim + core + drive;
// Use indirect eval so 'const'/'class' run in global scope.
(0, eval)(code);
const out = globalThis.__OUT__;
const R = out.reqs;
const L = out.links;
const X = out.reqifXml;
const V = out.reqifValid;

// --- Assertions ------------------------------------------------------------
const VALID_TYPES = new Set(['Functional','Non-Functional','Performance','Interface','Security','Safety','Compliance','Data','Operational','Constraint','Assumption','Open Question']);
const VALID_LINKS = new Set(['Derives From','Refines','Satisfies','Traces To','Depends On','Conflicts With','Duplicate Of','Related To']);
const READY_KEYS  = ['statement','title','validType','mandatoryAttrs','sourceTrace','validHierarchy','noConflicts','noDuplicates','schemaValid','reqifValid'];

const auth      = R.filter(r => /authenticate/i.test(r.text));
const alarms    = R.filter(r => /(alarm|occlusion)/i.test(r.text));
const interfaces= R.filter(r => /(hl7|usb)/i.test(r.text));
const perf      = R.filter(r => /(self-test|accuracy)/i.test(r.text));

const checks = [
  ['Extraction: ≥12 requirements',                        R.length >= 12],
  ['Extraction: TOC lines ignored',                       !R.some(r => /Introduction \.\.\./.test(r.original))],
  ['Extraction: revision history ignored',                !R.some(r => /Initial release/.test(r.original))],
  ['Extraction: marketing ignored',                       !R.some(r => /market-leading/.test(r.original))],
  ['Extraction: every item has a modal verb',             R.every(r => /\b(shall|must|will|should|required to|needs to|has to|is to)\b/i.test(r.original))],
  ['Conversion: every requirement uses "shall"',          R.every(r => /\bshall\b/.test(r.text))],
  ['Conversion: no leftover must/will/should',            !R.some(r => /\b(must|will|should)\b/.test(r.text))],
  ['Conversion: no double-modal bug',                     !R.some(r => /(shall shall|must shall)/.test(r.text))],
  ['Conversion: original preserved',                      R.every(r => !!r.original)],
  ['Conversion: title generated',                         R.every(r => !!r.title)],
  ['Conversion: statement ends in period',                R.every(r => r.text.trim().endsWith('.'))],
  ['Compound: at least one split applied',                R.filter(r => r.flags.compound).length >= 1],
  ['Compound: bolus delivery atomized into two reqs',     R.some(r => /bolus delivery/i.test(r.text)) && R.some(r => /log every bolus/i.test(r.text))],
  ['Metadata: 11 mandatory fields on every requirement',  R.every(r => ['id','title','text','original','type','priority','doc','sectionPath','page','confidence','status'].every(f => r[f] !== undefined && r[f] !== ''))],
  ['Classification: types in 12-type taxonomy',           R.every(r => VALID_TYPES.has(r.type))],
  ['Classification: confidence in [0,1]',                 R.every(r => r.typeConf >= 0 && r.typeConf <= 1)],
  ['Classification: authentication → Security',           auth.every(r => r.type === 'Security')],
  ['Classification: alarm/occlusion → Safety',            alarms.some(r => r.type === 'Safety')],
  ['Classification: HL7/USB → Interface',                 interfaces.every(r => r.type === 'Interface')],
  ['Classification: self-test/accuracy → Performance',    perf.some(r => r.type === 'Performance')],
  ['Validation: ambiguous detected (≥2)',                 R.filter(r => r.flags.ambiguous.length).length >= 2],
  ['Validation: "fast"/"user-friendly" flagged',          R.some(r => r.flags.ambiguous.some(w => ['fast','user-friendly'].includes(w)))],
  ['Validation: "robust" flagged',                        R.some(r => r.flags.ambiguous.includes('robust'))],
  ['Validation: duplicates detected (≥2)',                R.filter(r => r.flags.duplicateOf.length).length >= 2],
  ['Validation: non-testable detected (≥1)',              R.filter(r => r.flags.nonTestable).length >= 1],
  ['Hierarchy: ≥4 distinct sections',                     new Set(R.map(r => r.sectionPath)).size >= 4],
  ['Hierarchy: no TOC artifacts in section paths',        !R.some(r => /\.{3,}\s*\d/.test(r.sectionPath))],
  ['Hierarchy: Dose Delivery section present',            R.some(r => /Dose Delivery/.test(r.sectionPath))],
  ['Hierarchy: Alarms section present',                   R.some(r => /Alarms/.test(r.sectionPath))],
  ['Hierarchy: no orphans',                               !R.some(r => r.flags.orphan)],
  ['Traceability: ≥4 links generated',                    L.length >= 4],
  ['Traceability: all link types in 8-type set',          L.every(l => VALID_LINKS.has(l.type))],
  ['Traceability: all links scored in [0,1]',             L.every(l => l.confidence >= 0 && l.confidence <= 1)],
  ['Traceability: all links carry an explanation',        L.every(l => !!l.explanation)],
  ['Traceability: low-confidence links flagged',          L.some(l => l.lowConf) || L.every(l => !l.lowConf)],
  ['Readiness: 10-criteria checklist on every req',       R.every(r => READY_KEYS.every(k => k in r.readyChecklist))],
  ['Readiness: percentage in [0,100]',                    (() => { const p = Math.round(R.filter(r=>r.ready).length / R.length * 100); return p>=0 && p<=100; })()],
  ['ReqIF: internal validator passes',                    V.valid === true],
  ['ReqIF: contains all expected spec-objects',           V.objCount === R.length],
  ['ReqIF: well-formed (no parser error)',                X.startsWith('<?xml')],
  ['ReqIF: has REQ-IF-HEADER',                            /<REQ-IF-HEADER\b/.test(X)],
  ['ReqIF: has DATATYPES block',                          /<DATATYPES>/.test(X) && /<DATATYPE-DEFINITION-/.test(X)],
  ['ReqIF: has SPEC-OBJECT-TYPE with 5 attrs',            (X.match(/<ATTRIBUTE-DEFINITION-/g) || []).length >= 5],
  ['ReqIF: spec-objects count = requirement count',       (X.match(/<SPEC-OBJECT\s+IDENTIFIER=/g) || []).length === R.length],
  ['ReqIF: every object references OT-REQ',               !/<TYPE><SPEC-OBJECT-TYPE-REF>(?!OT-REQ<)/.test(X)],
  ['ReqIF: SPEC-RELATIONS count = link count',            (X.match(/<SPEC-RELATION\s/g) || []).length === L.length],
  ['ReqIF: all enum refs resolve',                        (() => {
    const ids  = new Set([...X.matchAll(/<ENUM-VALUE\s+IDENTIFIER="([^"]+)"/g)].map(m=>m[1]));
    const refs = new Set([...X.matchAll(/<ENUM-VALUE-REF>([^<]+)<\/ENUM-VALUE-REF>/g)].map(m=>m[1]));
    return [...refs].every(r => ids.has(r));
  })()],
  ['ReqIF: all hierarchy refs resolve',                   (() => {
    const objs = new Set([...X.matchAll(/<SPEC-OBJECT\s+IDENTIFIER="([^"]+)"/g)].map(m=>m[1]));
    const hier = [...X.matchAll(/<SPEC-HIERARCHY[\s\S]*?<SPEC-OBJECT-REF>([^<]+)<\/SPEC-OBJECT-REF>/g)].map(m=>m[1]);
    return hier.every(h => objs.has(h));
  })()],
  ['Human-in-the-loop: every req starts in "review"',     R.every(r => r.status === 'review')]
];

// --- Report ----------------------------------------------------------------
let pass = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '\u2705' : '\u274C') + '  ' + name);
  if (ok) pass++;
}
const pct = Math.round(R.filter(r => r.ready).length / R.length * 100);
console.log('\n' + '='.repeat(60));
console.log(`Result: ${pass}/${checks.length} checks passed`);
console.log(`Sample run: ${R.length} requirements, ${L.length} traceability links, ${pct}% Upload Ready`);
console.log(`ReqIF: ${X.length} bytes, valid=${V.valid}`);
console.log('='.repeat(60));

process.exit(pass === checks.length ? 0 : 1);
