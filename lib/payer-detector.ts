export function detectPayer(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  const t = text.toLowerCase();

  if (
    t.includes("unitedhealthcare") ||
    t.includes("united health") ||
    t.includes("uhc") ||
    t.includes("optum")
  )
    return "UnitedHealthcare";
  if (
    t.includes("blue shield of california") ||
    t.includes("blueshieldca")
  )
    return "Blue Shield of California";
  if (t.includes("blue shield")) return "Blue Shield";
  if (t.includes("blue cross blue shield") || t.includes("bcbs"))
    return "Blue Cross Blue Shield";
  if (t.includes("blue cross")) return "Blue Cross";
  if (t.includes("cigna")) return "Cigna";
  if (t.includes("aetna")) return "Aetna";
  if (t.includes("humana")) return "Humana";
  if (t.includes("molina")) return "Molina";
  if (t.includes("anthem")) return "Anthem";
  if (t.includes("kaiser")) return "Kaiser Permanente";
  if (t.includes("medicare")) return "Medicare";
  if (t.includes("medicaid")) return "Medicaid";
  if (t.includes("tricare")) return "Tricare";
  if (t.includes("centene")) return "Centene";

  return null;
}

export function detectPayerFromFilename(filename: string): string | null {
  const f = filename.toLowerCase();

  if (
    f.includes("blue_shield") ||
    f.includes("blueshield") ||
    f.includes("blue shield") ||
    f.includes("bsc") ||
    f.includes("blue_ca") ||
    f.includes("blueca")
  )
    return "Blue Shield of California";
  if (f.includes("uhc") || f.includes("united")) return "UnitedHealthcare";
  if (f.includes("cigna")) return "Cigna";
  if (f.includes("aetna")) return "Aetna";
  if (f.includes("humana")) return "Humana";
  if (f.includes("bcbs") || f.includes("bluecross"))
    return "Blue Cross Blue Shield";
  if (f.includes("medicare")) return "Medicare";
  if (f.includes("medicaid")) return "Medicaid";
  if (f.includes("molina")) return "Molina";
  if (f.includes("kaiser")) return "Kaiser Permanente";
  if (f.includes("anthem")) return "Anthem";

  return null;
}
