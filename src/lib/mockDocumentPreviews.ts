// Mock SVG data URLs for realistic candidate document previews in demo mode

export const MOCK_DOC_PREVIEWS: Record<string, string> = {
  aadhaar: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8f0" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f7ff" />
    </linearGradient>
    <linearGradient id="flag" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff9933" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#128807" />
    </linearGradient>
  </defs>

  <!-- Card Base -->
  <rect width="600" height="380" rx="16" fill="url(#bg)" stroke="#cbd5e1" stroke-width="2" />
  
  <!-- Top National Header -->
  <rect x="0" y="0" width="600" height="8" rx="4" fill="url(#flag)" />
  <rect x="24" y="24" width="44" height="44" rx="8" fill="#1e293b" />
  <text x="46" y="52" fill="#ffffff" font-size="22" font-weight="bold" text-anchor="middle">🇮🇳</text>
  
  <text x="80" y="42" fill="#0f172a" font-size="16" font-weight="bold">Government of India</text>
  <text x="80" y="60" fill="#64748b" font-size="12">Unique Identification Authority of India (UIDAI)</text>
  
  <line x1="24" y1="80" x2="576" y2="80" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- Photo Box -->
  <rect x="36" y="104" width="120" height="150" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
  <circle cx="96" cy="155" r="32" fill="#94a3b8" />
  <path d="M 52 240 Q 96 195 140 240" fill="#64748b" />
  <text x="96" y="270" fill="#64748b" font-size="10" text-anchor="middle">VERIFIED IDENTITY</text>

  <!-- Candidate Information -->
  <text x="180" y="125" fill="#64748b" font-size="11" font-weight="600">NAME</text>
  <text x="180" y="146" fill="#0f172a" font-size="17" font-weight="bold">Ramesh Anand Patil</text>

  <text x="180" y="175" fill="#64748b" font-size="11" font-weight="600">DATE OF BIRTH / GENDER</text>
  <text x="180" y="194" fill="#1e293b" font-size="13" font-weight="500">15/05/1998 • Male</text>

  <text x="180" y="222" fill="#64748b" font-size="11" font-weight="600">PERMANENT ADDRESS</text>
  <text x="180" y="240" fill="#334155" font-size="12" font-weight="normal">Flat 402, Green Meadows, Baner Road, Pune</text>
  <text x="180" y="256" fill="#334155" font-size="12" font-weight="normal">Maharashtra, India - 411045</text>

  <!-- QR Code Mock -->
  <rect x="440" y="104" width="120" height="120" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
  <rect x="454" y="118" width="30" height="30" fill="#0f172a" />
  <rect x="516" y="118" width="30" height="30" fill="#0f172a" />
  <rect x="454" y="180" width="30" height="30" fill="#0f172a" />
  <rect x="495" y="155" width="20" height="20" fill="#0f172a" />
  <rect x="526" y="180" width="20" height="20" fill="#0f172a" />
  <text x="500" y="242" fill="#64748b" font-size="10" text-anchor="middle">UIDAI SECURE QR</text>

  <!-- Aadhaar Number Footer -->
  <rect x="24" y="294" width="552" height="60" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  <text x="300" y="333" fill="#0f172a" font-size="22" font-weight="bold" letter-spacing="4" text-anchor="middle">5412  8901  2345</text>
  <text x="300" y="348" fill="#16a34a" font-size="9" font-weight="bold" letter-spacing="1" text-anchor="middle">✓ AADHAAR VERIFIED BY UIDAI SYSTEM</text>
</svg>
`)}`,

  pan: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="panbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#eff6ff" />
    </linearGradient>
  </defs>

  <rect width="600" height="380" rx="16" fill="url(#panbg)" stroke="#93c5fd" stroke-width="2" />
  
  <!-- Header -->
  <text x="300" y="38" fill="#1e3a8a" font-size="15" font-weight="bold" text-anchor="middle">INCOME TAX DEPARTMENT</text>
  <text x="300" y="56" fill="#1e40af" font-size="12" text-anchor="middle">GOVT. OF INDIA / भारत सरकार</text>
  <line x1="24" y1="72" x2="576" y2="72" stroke="#bfdbfe" stroke-width="1.5" />

  <!-- Photo Box -->
  <rect x="40" y="96" width="110" height="140" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
  <circle cx="95" cy="145" r="28" fill="#94a3b8" />
  <path d="M 55 225 Q 95 180 135 225" fill="#64748b" />

  <!-- Fields -->
  <text x="180" y="112" fill="#64748b" font-size="10" font-weight="600">PERMANENT ACCOUNT NUMBER</text>
  <text x="180" y="138" fill="#0f172a" font-size="20" font-weight="bold" font-family="monospace" letter-spacing="2">ABCDE1234F</text>

  <text x="180" y="170" fill="#64748b" font-size="10" font-weight="600">CARDHOLDER NAME</text>
  <text x="180" y="190" fill="#0f172a" font-size="14" font-weight="bold">RAMESH ANAND PATIL</text>

  <text x="180" y="218" fill="#64748b" font-size="10" font-weight="600">FATHER'S NAME</text>
  <text x="180" y="236" fill="#1e293b" font-size="13" font-weight="600">ANAND PATIL</text>

  <text x="180" y="264" fill="#64748b" font-size="10" font-weight="600">DATE OF BIRTH</text>
  <text x="180" y="282" fill="#1e293b" font-size="13" font-weight="600">15/05/1998</text>

  <!-- Emblem / Hologram -->
  <circle cx="480" cy="160" r="42" fill="#fef08a" stroke="#ca8a04" stroke-width="2" opacity="0.85" />
  <text x="480" y="165" fill="#854d0e" font-size="10" font-weight="bold" text-anchor="middle">TAX SECURE</text>

  <!-- Signature -->
  <path d="M 420 300 Q 470 270 520 300 T 560 290" fill="none" stroke="#1e293b" stroke-width="2" />
  <text x="490" y="325" fill="#64748b" font-size="10" text-anchor="middle">Signature / हस्ताक्षर</text>
</svg>
`)}`,

  degree: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%" style="font-family: Georgia, 'Times New Roman', serif;">
  <rect width="600" height="420" fill="#fffdfa" stroke="#d4af37" stroke-width="6" />
  <rect x="14" y="14" width="572" height="392" fill="none" stroke="#e2e8f0" stroke-width="1.5" />

  <text x="300" y="60" fill="#1e293b" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="1">PUNE INSTITUTE OF COMPUTER TECHNOLOGY</text>
  <text x="300" y="82" fill="#64748b" font-size="12" font-style="italic" text-anchor="middle">Affiliated to Savitribai Phule Pune University</text>
  
  <line x1="150" y1="100" x2="450" y2="100" stroke="#d4af37" stroke-width="2" />

  <text x="300" y="135" fill="#475569" font-size="13" text-anchor="middle">This is to certify that</text>
  <text x="300" y="170" fill="#0f172a" font-size="22" font-weight="bold" text-anchor="middle">Ramesh Anand Patil</text>
  
  <text x="300" y="205" fill="#475569" font-size="13" text-anchor="middle">has successfully fulfilled all academic criteria for the conferment of the degree of</text>
  <text x="300" y="240" fill="#1e3a8a" font-size="18" font-weight="bold" text-anchor="middle">Bachelor of Engineering in Computer Science</text>
  
  <text x="300" y="275" fill="#334155" font-size="13" text-anchor="middle">with First Class with Distinction (8.7 CGPA)</text>
  <text x="300" y="298" fill="#64748b" font-size="12" text-anchor="middle">Conferred on this 24th day of July, 2020</text>

  <!-- Seal -->
  <circle cx="120" cy="350" r="32" fill="#fef3c7" stroke="#d4af37" stroke-width="2" />
  <text x="120" y="354" fill="#92400e" font-size="10" font-weight="bold" text-anchor="middle">PICT SEAL</text>

  <!-- Signatures -->
  <line x1="380" y1="365" x2="520" y2="365" stroke="#94a3b8" stroke-width="1.5" />
  <text x="450" y="380" fill="#64748b" font-size="11" text-anchor="middle">Dean & Controller of Exams</text>
</svg>
`)}`,

  cheque: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280" width="100%" height="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect width="600" height="280" rx="8" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5" />

  <text x="32" y="36" fill="#0369a1" font-size="15" font-weight="bold">HDFC BANK LTD.</text>
  <text x="32" y="52" fill="#64748b" font-size="11">Baner Branch, Pune - 411045 • IFSC: HDFC0000052</text>

  <!-- Cancelled Stamp -->
  <line x1="60" y1="180" x2="520" y2="70" stroke="#dc2626" stroke-width="4" stroke-opacity="0.8" />
  <line x1="80" y1="210" x2="540" y2="100" stroke="#dc2626" stroke-width="4" stroke-opacity="0.8" />
  <text x="300" y="150" fill="#dc2626" font-size="34" font-weight="bold" letter-spacing="8" text-anchor="middle" transform="rotate(-14 300 150)" opacity="0.85">CANCELLED</text>

  <text x="32" y="90" fill="#475569" font-size="11">PAY: ——————————————————————————————————————</text>
  <text x="32" y="130" fill="#475569" font-size="11">RUPEES: ——————————————————————————————————</text>

  <rect x="32" y="180" width="280" height="36" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
  <text x="44" y="195" fill="#64748b" font-size="9">A/C NO.</text>
  <text x="44" y="210" fill="#0f172a" font-size="14" font-family="monospace" font-weight="bold">50100456123489</text>

  <text x="450" y="240" fill="#0f172a" font-size="12" font-weight="bold" text-anchor="middle">RAMESH ANAND PATIL</text>
  <text x="450" y="255" fill="#64748b" font-size="9" text-anchor="middle">Authorised Signatory</text>
</svg>
`)}`,
};
