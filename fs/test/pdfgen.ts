export function generateRobustPDF(creationDate?: string): string {
  const parts: string[] = [];

  // Build each object and track exact byte positions
  const objects: { offset: number; content: string }[] = [];

  // Start with header
  let currentOffset = '%PDF-1.7\n'.length;

  // Object 1: Catalog
  const catalog = `1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
`;
  objects.push({ offset: currentOffset, content: catalog });
  currentOffset += catalog.length;

  // Object 2: Pages tree
  const pages = `2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
`;
  objects.push({ offset: currentOffset, content: pages });
  currentOffset += pages.length;

  // Object 3: Page (empty)
  const page = `3 0 obj
<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>
endobj
`;
  objects.push({ offset: currentOffset, content: page });
  currentOffset += page.length;

  // Object 4: Info with creation date
  const dateStr = creationDate || Date.now().toString().slice(0, -3);
  const info = `4 0 obj
<</Title (Minimal PDF) /CreationDate (D:${dateStr}Z)>>
endobj
`;
  objects.push({ offset: currentOffset, content: info });
  currentOffset += info.length;

  // Build the PDF content
  parts.push('%PDF-1.7\n');
  objects.forEach((obj) => parts.push(obj.content));

  // Xref table
  const xrefStart = parts.join('').length;
  parts.push('xref\n');
  parts.push('0 5\n');
  parts.push('0000000000 65535 f \n');
  objects.forEach((obj) => {
    parts.push(`${obj.offset.toString().padStart(10, '0')} 00000 n \n`);
  });

  // Trailer
  parts.push('trailer\n');
  parts.push('<</Size 5 /Root 1 0 R /Info 4 0 R>>\n');
  parts.push('\n');
  parts.push(`startxref\n`);
  parts.push(`${xrefStart}\n`);
  parts.push('%%EOF');

  return parts.join('');
}
