// Generates small, valid sample PDF files for the seeded study materials so the
// in-app Study Hub reader has something real to display.
// Run with: node scripts/gen-sample-pdfs.js
const fs = require('fs');
const path = require('path');

function makePdf(titleLine, bodyLines) {
  const lines = [titleLine, '', ...bodyLines];

  let content = 'BT\n/F1 16 Tf\n72 740 Td\n20 TL\n';
  lines.forEach((ln, i) => {
    const safe = String(ln).replace(/([()\\])/g, '\\$1');
    content += (i === 0 ? `(${safe}) Tj\n` : `T* (${safe}) Tj\n`);
  });
  content += 'ET';

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, idx) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${idx + 1} 0 obj\n${o}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

const outDir = path.join(process.cwd(), 'public', 'materials');
fs.mkdirSync(outDir, { recursive: true });

const files = [
  {
    name: 'electrostatics_formulas.pdf',
    title: 'Electrostatics Formula Sheet',
    body: [
      'Coulomb\'s Law:  F = k * q1 * q2 / r^2     (k = 9e9 N m^2 / C^2)',
      'Electric Field:  E = F / q = k * Q / r^2',
      'Electric Potential:  V = k * Q / r',
      'Potential Energy:  U = k * q1 * q2 / r',
      'Capacitance:  C = Q / V',
      'Parallel Plate:  C = e0 * A / d',
      'Energy in Capacitor:  U = 1/2 * C * V^2',
      'Gauss\'s Law:  flux = Q_enclosed / e0',
    ],
  },
  {
    name: 'calculus_integration.pdf',
    title: 'Calculus Integration Cheat Sheet',
    body: [
      'Power Rule:  Int x^n dx = x^(n+1) / (n+1) + C',
      'Exponential:  Int e^x dx = e^x + C',
      'Logarithm:  Int 1/x dx = ln|x| + C',
      'Trig:  Int sin(x) dx = -cos(x) + C',
      'Trig:  Int cos(x) dx = sin(x) + C',
      'Sec^2:  Int sec^2(x) dx = tan(x) + C',
      'By Parts:  Int u dv = u v - Int v du',
      'Definite:  Int[a,b] f(x) dx = F(b) - F(a)',
    ],
  },
];

for (const f of files) {
  const buf = makePdf(f.title, f.body);
  fs.writeFileSync(path.join(outDir, f.name), buf);
  console.log(`Wrote public/materials/${f.name} (${buf.length} bytes)`);
}
