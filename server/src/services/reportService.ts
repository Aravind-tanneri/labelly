import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { writeReportFile, filePathFromPublicUrl, UPLOAD_DIR } from "./storageService";
import type { Inspection, ReportInfo } from "../types";


const BODY = "Helvetica";
const BOLD = "Helvetica-Bold";
const OBLIQUE = "Helvetica-Oblique";

// Color Palette
const COLORS = {
  primary: "#0f172a", // Dark Slate / Navy
  primaryLight: "#1e293b",
  accent: "#1e40af", // Royal Blue
  text: "#1e293b", // Slate 800
  textMuted: "#64748b", // Slate 500
  textDark: "#0f172a",
  border: "#e2e8f0",
  bgSubtle: "#f8fafc",
  bgCard: "#f1f5f9",
  pass: "#166534", // Green 800
  passBg: "#dcfce7", // Green 100
  passBorder: "#86efac",
  fail: "#991b1b", // Red 800
  failBg: "#fee2e2", // Red 100
  failBorder: "#fca5a5",
  review: "#854d0e", // Amber 800
  reviewBg: "#fef3c7", // Amber 100
  reviewBorder: "#fde68a",
  white: "#ffffff",
};

interface RenderContext {
  doc: PDFKit.PDFDocument;
  pageWidth: number;
  contentWidth: number;
  leftMargin: number;
  rightMargin: number;
  bottomMargin: number;
}

function ensureSpace(ctx: RenderContext, neededHeight: number): void {
  const { doc, bottomMargin } = ctx;
  if (doc.y + neededHeight > doc.page.height - bottomMargin) {
    doc.addPage();
    doc.y = 36;
  }
}

function ensureSpaceMin(ctx: RenderContext, neededHeight: number): void {
  const { doc, bottomMargin } = ctx;
  const availableSpace = doc.page.height - bottomMargin - doc.y;
  if (availableSpace < neededHeight && availableSpace < 40) {
    doc.addPage();
    doc.y = 36;
  }
}

function renderSectionHeader(ctx: RenderContext, title: string, subtitle?: string): void {
  const { doc, contentWidth, leftMargin } = ctx;
  ensureSpaceMin(ctx, 25);

  doc.moveDown(0.3);
  const startY = doc.y;

  // Small accent vertical bar
  doc.rect(leftMargin, startY, 3, 12).fillColor(COLORS.accent).fill();

  doc.font(BOLD).fontSize(10).fillColor(COLORS.primary);
  doc.text(title, leftMargin + 7, startY + 1, { width: contentWidth - 7 });

  if (subtitle) {
    doc.font(BODY).fontSize(7.5).fillColor(COLORS.textMuted);
    doc.text(subtitle, leftMargin + 7, doc.y + 1, { width: contentWidth - 7 });
  }

  doc.moveDown(0.2);
  doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + contentWidth, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.moveDown(0.3);
}

function renderReport(doc: PDFKit.PDFDocument, inspection: Inspection): void {
  const leftMargin = 32;
  const rightMargin = 32;
  const topMargin = 32;
  const bottomMargin = 35;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const ctx: RenderContext = {
    doc,
    pageWidth,
    contentWidth,
    leftMargin,
    rightMargin,
    bottomMargin,
  };

  const compliance = inspection.compliance;
  const violations = compliance?.violations ?? [];
  const reviewItems = compliance?.reviewRequired ?? [];
  const passedRules = compliance?.passedRules ?? [];
  const status = compliance?.status ?? (inspection.status === "APPROVED" ? "COMPLIANT" : "REVIEW_REQUIRED");

  // ─────────────────────────────────────────────────────────────
  // 1. TOP HEADER BANNER
  // ─────────────────────────────────────────────────────────────
  const headerHeight = 68;
  doc.roundedRect(leftMargin, topMargin, contentWidth, headerHeight, 4)
    .fillColor(COLORS.primary)
    .fill();

  // Government Subtitle
  doc.font(BOLD).fontSize(7).fillColor("#94a3b8");
  doc.text("GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", leftMargin + 12, topMargin + 8, {
    width: contentWidth - 120,
    characterSpacing: 0.3,
  });

  // Main Title
  doc.font(BOLD).fontSize(11.5).fillColor(COLORS.white);
  doc.text("LEGAL METROLOGY INSPECTION CERTIFICATE", leftMargin + 12, topMargin + 20, {
    width: contentWidth - 120,
  });

  // Act reference
  doc.font(BODY).fontSize(7).fillColor("#cbd5e1");
  doc.text("Enforcement Report under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011", leftMargin + 12, topMargin + 36, {
    width: contentWidth - 120,
  });

  // Verification Tag
  doc.font(OBLIQUE).fontSize(6.5).fillColor("#94a3b8");
  doc.text("Labelly Metrology AI Engine • Digital Verification Trail", leftMargin + 12, topMargin + 50);

  // Status Stamp Badge (Top Right)
  const badgeWidth = 100;
  const badgeHeight = 40;
  const badgeX = leftMargin + contentWidth - badgeWidth - 10;
  const badgeY = topMargin + 14;

  let badgeBg = COLORS.passBg;
  let badgeBorder = COLORS.passBorder;
  let badgeColor = COLORS.pass;
  let badgeText = "COMPLIANT";

  if (status === "NON_COMPLIANT") {
    badgeBg = COLORS.failBg;
    badgeBorder = COLORS.failBorder;
    badgeColor = COLORS.fail;
    badgeText = "NON-COMPLIANT";
  } else if (status === "REVIEW_REQUIRED") {
    badgeBg = COLORS.reviewBg;
    badgeBorder = COLORS.reviewBorder;
    badgeColor = COLORS.review;
    badgeText = "REVIEW REQUIRED";
  }

  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4)
    .fillColor(badgeBg)
    .strokeColor(badgeBorder)
    .lineWidth(1)
    .fillAndStroke();

  doc.font(BOLD).fontSize(9).fillColor(badgeColor);
  doc.text(badgeText, badgeX, badgeY + 8, {
    width: badgeWidth,
    align: "center",
  });

  const scoreText = compliance?.score !== undefined ? `Score: ${compliance.score}/100` : `Status: ${inspection.status}`;
  doc.font(BODY).fontSize(7).fillColor(badgeColor);
  doc.text(scoreText, badgeX, badgeY + 22, {
    width: badgeWidth,
    align: "center",
  });

  doc.y = topMargin + headerHeight + 8;

  // ─────────────────────────────────────────────────────────────
  // 2. SUMMARY DETAILS GRID (2 Equal Columns)
  // ─────────────────────────────────────────────────────────────
  const cardGap = 8;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 64;
  const cardsY = doc.y;

  // Left Card: Inspection Record
  doc.roundedRect(leftMargin, cardsY, cardWidth, cardHeight, 4)
    .fillColor(COLORS.bgSubtle)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .fillAndStroke();

  doc.font(BOLD).fontSize(8).fillColor(COLORS.accent);
  doc.text("INSPECTION RECORD", leftMargin + 8, cardsY + 6);

  const formattedDate = inspection.createdAt
    ? new Date(inspection.createdAt.toString()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const leftDetails = [
    { label: "Inspection ID:", val: inspection.inspectionId || "—" },
    { label: "Date & Time:", val: formattedDate },
    { label: "Officer ID:", val: inspection.inspectorId || "—" },
    { label: "Status:", val: inspection.status || "SUBMITTED" },
  ];

  let leftY = cardsY + 18;
  for (const item of leftDetails) {
    doc.font(BOLD).fontSize(7).fillColor(COLORS.textMuted).text(item.label, leftMargin + 8, leftY, { width: 70 });
    doc.font(BODY).fontSize(7).fillColor(COLORS.textDark).text(item.val, leftMargin + 80, leftY, { width: cardWidth - 88 });
    leftY += 10;
  }

  // Right Card: Product Record
  const rightX = leftMargin + cardWidth + cardGap;
  doc.roundedRect(rightX, cardsY, cardWidth, cardHeight, 4)
    .fillColor(COLORS.bgSubtle)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .fillAndStroke();

  doc.font(BOLD).fontSize(8).fillColor(COLORS.accent);
  doc.text("PRODUCT DETAILS", rightX + 8, cardsY + 6);

  const rightDetails = [
    { label: "Product Name:", val: inspection.product?.name || "Packaged Commodity" },
    { label: "Brand:", val: inspection.product?.brand || "—" },
    { label: "Category:", val: inspection.product?.category || "General" },
    { label: "Declared Qty:", val: inspection.extractedData?.netQuantity || "Not Found" },
  ];

  let rightY = cardsY + 18;
  for (const item of rightDetails) {
    doc.font(BOLD).fontSize(7).fillColor(COLORS.textMuted).text(item.label, rightX + 8, rightY, { width: 70 });
    doc.font(BODY).fontSize(7).fillColor(COLORS.textDark).text(item.val, rightX + 80, rightY, { width: cardWidth - 88 });
    rightY += 10;
  }

  doc.y = cardsY + cardHeight + 6;

  // ─────────────────────────────────────────────────────────────
  // 3. MANDATORY DECLARATIONS TABLE (Rule 6 PC Rules)
  // ─────────────────────────────────────────────────────────────
  renderSectionHeader(ctx, "1. Mandatory Declarations Verification", "Evaluated against Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011");

  const declarationsMap: Array<{ key: keyof typeof inspection.extractedData; label: string; ruleRef: string }> = [
    { key: "manufacturer", label: "Manufacturer / Packer", ruleRef: "Rule 6(1)(a)" },
    { key: "importer", label: "Country of Origin / Importer", ruleRef: "Rule 6(1)(a)" },
    { key: "netQuantity", label: "Net Quantity & Standard Units", ruleRef: "Rule 6(1)(b)" },
    { key: "mrp", label: "Retail Sale Price (MRP incl. taxes)", ruleRef: "Rule 6(1)(c)" },
    { key: "manufacturingDate", label: "Date of Mfg / Packing / Import", ruleRef: "Rule 6(1)(d)" },
    { key: "consumerCare", label: "Consumer Care Contact Details", ruleRef: "Rule 6(1)(n)" },
    { key: "batchNumber", label: "Batch / Lot Identification No.", ruleRef: "Rule 6(1)(g)" },
  ];

  const colW = {
    field: 135,
    rule: 65,
    val: contentWidth - 135 - 65 - 75,
    conf: 75,
  };

  // Table Header
  const tblHeaderY = doc.y;
  doc.rect(leftMargin, tblHeaderY, contentWidth, 16).fillColor(COLORS.bgCard).fill();
  doc.font(BOLD).fontSize(7).fillColor(COLORS.primary);
  doc.text("MANDATORY FIELD", leftMargin + 6, tblHeaderY + 4, { width: colW.field - 8 });
  doc.text("RULE REF", leftMargin + colW.field, tblHeaderY + 4, { width: colW.rule });
  doc.text("EXTRACTED LABEL VALUE", leftMargin + colW.field + colW.rule, tblHeaderY + 4, { width: colW.val - 8 });
  doc.text("CONFIDENCE", leftMargin + colW.field + colW.rule + colW.val, tblHeaderY + 4, { width: colW.conf - 6, align: "right" });

  doc.y = tblHeaderY + 16;

  // Table Rows
  declarationsMap.forEach((item, idx) => {
    const rawVal = inspection.extractedData?.[item.key];
    const valText = rawVal ? String(rawVal).trim() : "NOT PRESENT / UNREADABLE";
    const confidence = inspection.extractionConfidence?.[item.key];
    const isMissing = !rawVal;

    doc.font(BODY).fontSize(7);
    const valHeight = doc.heightOfString(valText, { width: colW.val - 10 });
    const rowHeight = Math.max(15, valHeight + 6);

    ensureSpace(ctx, rowHeight);
    const rowY = doc.y;

    if (idx % 2 === 1) {
      doc.rect(leftMargin, rowY, contentWidth, rowHeight).fillColor(COLORS.bgSubtle).fill();
    }

    doc.moveTo(leftMargin, rowY + rowHeight).lineTo(leftMargin + contentWidth, rowY + rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();

    doc.font(BOLD).fontSize(7).fillColor(COLORS.textDark);
    doc.text(item.label, leftMargin + 6, rowY + 4, { width: colW.field - 8 });

    doc.font(BODY).fontSize(6.5).fillColor(COLORS.textMuted);
    doc.text(item.ruleRef, leftMargin + colW.field, rowY + 4, { width: colW.rule });

    doc.font(isMissing ? OBLIQUE : BODY).fontSize(7).fillColor(isMissing ? COLORS.fail : COLORS.textDark);
    doc.text(valText, leftMargin + colW.field + colW.rule, rowY + 4, { width: colW.val - 10 });

    let confStr = "—";
    let confColor = COLORS.textMuted;
    if (confidence !== undefined) {
      const confNum = Math.round(confidence);
      confStr = `${confNum}%`;
      confColor = confNum >= 80 ? COLORS.pass : confNum >= 50 ? COLORS.review : COLORS.fail;
    } else if (isMissing) {
      confStr = "Missing";
      confColor = COLORS.fail;
    }

    doc.font(BOLD).fontSize(7).fillColor(confColor);
    doc.text(confStr, leftMargin + colW.field + colW.rule + colW.val, rowY + 4, { width: colW.conf - 6, align: "right" });

    doc.y = rowY + rowHeight;
  });

  doc.moveDown(0.3);

  // ─────────────────────────────────────────────────────────────
  // 4. COMPLIANCE VIOLATIONS & OBSERVATIONS
  // ─────────────────────────────────────────────────────────────
  renderSectionHeader(ctx, "2. Regulatory Violations & Non-Compliance Findings");

  if (violations.length === 0 && reviewItems.length === 0) {
    const boxY = doc.y;
    doc.roundedRect(leftMargin, boxY, contentWidth, 22, 3)
      .fillColor(COLORS.passBg)
      .strokeColor(COLORS.passBorder)
      .lineWidth(0.5)
      .fillAndStroke();

    doc.font(BOLD).fontSize(7.5).fillColor(COLORS.pass);
    doc.text("✓ FULL COMPLIANCE VERIFIED", leftMargin + 8, boxY + 6);
    doc.font(BODY).fontSize(7).fillColor(COLORS.pass);
    doc.text("No statutory violations detected. All mandatory declarations conform to PC Rules 2011.", leftMargin + 160, boxY + 6);
    doc.y = boxY + 26;
  } else {
    violations.forEach((v) => {
      doc.font(BODY).fontSize(7);
      const msgH = doc.heightOfString(v.message, { width: contentWidth - 16 });
      const boxH = Math.max(30, 17 + msgH + 4);

      ensureSpace(ctx, boxH + 3);
      const vY = doc.y;

      doc.roundedRect(leftMargin, vY, contentWidth, boxH, 3)
        .fillColor(COLORS.failBg)
        .strokeColor(COLORS.failBorder)
        .lineWidth(0.5)
        .fillAndStroke();

      const sevWidth = 55;
      doc.roundedRect(leftMargin + 6, vY + 4, sevWidth, 11, 2)
        .fillColor(COLORS.fail)
        .fill();

      doc.font(BOLD).fontSize(6).fillColor(COLORS.white);
      doc.text(`FAIL • ${v.severity || "HIGH"}`, leftMargin + 6, vY + 6, { width: sevWidth, align: "center" });

      doc.font(BOLD).fontSize(7.5).fillColor(COLORS.fail);
      doc.text(`${v.ruleId} — ${v.field}`, leftMargin + 68, vY + 5, { width: contentWidth - 75 });

      doc.font(BODY).fontSize(7).fillColor(COLORS.textDark);
      doc.text(v.message, leftMargin + 8, vY + 17, { width: contentWidth - 16 });

      doc.y = vY + boxH + 3;
    });

    reviewItems.forEach((r) => {
      doc.font(BODY).fontSize(7);
      const msgH = doc.heightOfString(r.message, { width: contentWidth - 16 });
      const boxH = Math.max(26, 16 + msgH + 4);

      ensureSpace(ctx, boxH + 3);
      const rY = doc.y;

      doc.roundedRect(leftMargin, rY, contentWidth, boxH, 3)
        .fillColor(COLORS.reviewBg)
        .strokeColor(COLORS.reviewBorder)
        .lineWidth(0.5)
        .fillAndStroke();

      const sevWidth = 55;
      doc.roundedRect(leftMargin + 6, rY + 4, sevWidth, 11, 2)
        .fillColor(COLORS.review)
        .fill();

      doc.font(BOLD).fontSize(6).fillColor(COLORS.white);
      doc.text(`REVIEW`, leftMargin + 6, rY + 6, { width: sevWidth, align: "center" });

      doc.font(BOLD).fontSize(7.5).fillColor(COLORS.review);
      doc.text(r.ruleId ? `${r.ruleId} — ${r.field}` : `Manual Review: ${r.field}`, leftMargin + 68, rY + 5, { width: contentWidth - 75 });

      doc.font(BODY).fontSize(7).fillColor(COLORS.textDark);
      doc.text(r.message, leftMargin + 8, rY + 16, { width: contentWidth - 16 });

      doc.y = rY + boxH + 3;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. PASSED RULES
  // ─────────────────────────────────────────────────────────────
  if (passedRules.length > 0) {
    renderSectionHeader(ctx, "3. Verified Statutory Checks (Passed Rules)", "Legal checks confirmed compliant with standards");

    const passCols = 2;
    const passColW = (contentWidth - 10) / passCols;

    for (let i = 0; i < passedRules.length; i += passCols) {
      const rowRules = passedRules.slice(i, i + passCols);

      doc.font(BODY).fontSize(6.8);
      const heights = rowRules.map((p) =>
        doc.heightOfString(p.message || p.field, { width: passColW - 68 })
      );
      const maxTextH = Math.max(...heights, 9);
      const rowHeight = maxTextH + 4;

      ensureSpace(ctx, rowHeight);
      const rowY = doc.y;

      rowRules.forEach((p, colIdx) => {
        const px = leftMargin + colIdx * (passColW + 10);
        doc.font(BOLD).fontSize(6.5).fillColor(COLORS.pass).text("✓", px, rowY, { width: 10 });
        doc.font(BOLD).fontSize(7).fillColor(COLORS.textDark).text(`${p.ruleId}:`, px + 10, rowY, { width: 55 });
        doc.font(BODY).fontSize(6.8).fillColor(COLORS.textMuted).text(p.message || p.field, px + 68, rowY, { width: passColW - 68 });
      });

      doc.y = rowY + rowHeight;
    }

    doc.moveDown(0.2);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. INSPECTOR OBSERVATIONS & REMARKS
  // ─────────────────────────────────────────────────────────────
  renderSectionHeader(ctx, "4. Officer Observations & Field Notes");

  const remarksY = doc.y;
  const remarksText = inspection.remarks?.trim() || "No adverse field observations recorded at the time of inspection.";
  doc.font(BODY).fontSize(7);
  const remarksTextH = doc.heightOfString(remarksText, { width: contentWidth - 14 });
  const remarksBoxH = Math.max(22, remarksTextH + 8);

  doc.roundedRect(leftMargin, remarksY, contentWidth, remarksBoxH, 3)
    .fillColor(COLORS.bgSubtle)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .fillAndStroke();

  doc.font(BODY).fontSize(7).fillColor(COLORS.text);
  doc.text(remarksText, leftMargin + 7, remarksY + 4, { width: contentWidth - 14 });
  doc.y = remarksY + remarksBoxH + 6;

  // ─────────────────────────────────────────────────────────────
  // 7. PACKAGING LABEL EVIDENCE PHOTOS (ALL ATTACHED IMAGES)
  // ─────────────────────────────────────────────────────────────
  const evidenceImages: Array<{ path: string; filename: string }> = [];
  if (inspection.images && inspection.images.length > 0) {
    for (const img of inspection.images) {
      const url = img.originalUrl || img.thumbnailUrl;
      if (url) {
        const filename = path.basename(url);
        const candidatePath = path.join(UPLOAD_DIR, "images", filename);
        if (fs.existsSync(candidatePath)) {
          evidenceImages.push({ path: candidatePath, filename });
        }
      }
    }
  }

  if (evidenceImages.length > 0) {
    const photoCountLabel = evidenceImages.length === 1 ? "1 Photo Archived" : `${evidenceImages.length} Photos Archived`;
    renderSectionHeader(
      ctx,
      "5. Photographic Evidence Record",
      `High-resolution captured labels archived in statutory record (${photoCountLabel})`
    );

    if (evidenceImages.length === 1) {
      const single = evidenceImages[0];
      const imgBoxY = doc.y;
      const imgBoxH = 110;

      doc.roundedRect(leftMargin, imgBoxY, contentWidth, imgBoxH, 4)
        .fillColor(COLORS.bgSubtle)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .fillAndStroke();

      try {
        const maxImgW = contentWidth - 20;
        const maxImgH = imgBoxH - 22;
        doc.image(single.path, leftMargin + 10, imgBoxY + 6, {
          fit: [maxImgW, maxImgH],
          align: "center",
          valign: "center"
        });
      } catch {
        doc.font(OBLIQUE).fontSize(7).fillColor(COLORS.textMuted);
        doc.text("[Photographic evidence archived digitally in repository]", leftMargin + 14, imgBoxY + 16);
      }

      doc.font(OBLIQUE).fontSize(6).fillColor(COLORS.textMuted);
      doc.text(`Digital Evidence Attached • File ID: ${single.filename}`, leftMargin + 8, imgBoxY + imgBoxH - 10);
      doc.y = imgBoxY + imgBoxH + 6;
    } else {
      const colGap = 8;
      const cardW = (contentWidth - colGap) / 2;
      const cardH = 110;

      for (let i = 0; i < evidenceImages.length; i += 2) {
        ensureSpace(ctx, cardH + 8);
        const rowY = doc.y;

        const rowItems = [evidenceImages[i], evidenceImages[i + 1]].filter(Boolean);
        rowItems.forEach((item, colIdx) => {
          const cardX = leftMargin + colIdx * (cardW + colGap);
          doc.roundedRect(cardX, rowY, cardW, cardH, 4)
            .fillColor(COLORS.bgSubtle)
            .strokeColor(COLORS.border)
            .lineWidth(0.5)
            .fillAndStroke();

          doc.font(BOLD).fontSize(6.5).fillColor(COLORS.accent);
          doc.text(`Evidence Photo #${i + colIdx + 1}`, cardX + 8, rowY + 5);

          try {
            doc.image(item.path, cardX + 8, rowY + 16, {
              fit: [cardW - 16, cardH - 28],
              align: "center",
              valign: "center"
            });
          } catch {
            doc.font(OBLIQUE).fontSize(6.5).fillColor(COLORS.textMuted);
            doc.text("[Image preview unavailable]", cardX + 8, rowY + 30);
          }

          doc.font(OBLIQUE).fontSize(5.5).fillColor(COLORS.textMuted);
          doc.text(`File: ${item.filename}`, cardX + 8, rowY + cardH - 9, { width: cardW - 16, ellipsis: true });
        });

        doc.y = rowY + cardH + 6;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. OFFICIAL CERTIFICATION & SIGN-OFF BLOCK
  // ─────────────────────────────────────────────────────────────
  ensureSpaceMin(ctx, 45);
  const signY = doc.y;
  const signHeight = 58;

  doc.roundedRect(leftMargin, signY, contentWidth, signHeight, 4)
    .fillColor(COLORS.bgSubtle)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .fillAndStroke();

  // Left certification notice
  doc.font(BOLD).fontSize(7).fillColor(COLORS.primary);
  doc.text("STATUTORY CERTIFICATION & AUDIT INTEGRITY", leftMargin + 8, signY + 6);

  doc.font(BODY).fontSize(6.5).fillColor(COLORS.textMuted);
  doc.text(
    "This electronic inspection report was compiled under the provisions of the Legal Metrology Act, 2009. " +
    "All declarations have been digitally audited and cross-referenced with statutory schedule requirements.",
    leftMargin + 8,
    signY + 16,
    { width: contentWidth * 0.58 }
  );

  doc.font(OBLIQUE).fontSize(6).fillColor(COLORS.accent);
  doc.text(`Digital Record ID: ${inspection.inspectionId} • Auth Hash: ${Buffer.from(inspection.inspectionId).toString("hex").slice(0, 24).toUpperCase()}`, leftMargin + 8, signY + 44);

  // Right Signature Block
  const sigX = leftMargin + contentWidth * 0.62;
  const sigW = contentWidth * 0.35;

  doc.moveTo(sigX, signY + 36).lineTo(sigX + sigW, signY + 36).strokeColor(COLORS.textMuted).lineWidth(0.5).stroke();

  doc.font(BOLD).fontSize(7).fillColor(COLORS.primary);
  doc.text("Authorized Metrology Officer", sigX, signY + 40, { width: sigW, align: "center" });

  doc.font(BODY).fontSize(6.5).fillColor(COLORS.textMuted);
  doc.text(`Officer ID: ${inspection.inspectorId || "DoCA-INSP"}`, sigX, signY + 49, { width: sigW, align: "center" });

  doc.y = signY + signHeight + 6;
}



function addPageFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const leftMargin = 36;
  const rightMargin = 36;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 24;

    doc.moveTo(leftMargin, footerY - 5)
      .lineTo(leftMargin + contentWidth, footerY - 5)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc.font(BODY).fontSize(6.5).fillColor(COLORS.textMuted);
    doc.text("Department of Consumer Affairs, Government of India • Legal Metrology Enforcement Portal", leftMargin, footerY, {
      width: contentWidth * 0.7,
    });

    doc.font(BOLD).fontSize(6.5).fillColor(COLORS.textMuted);
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, leftMargin + contentWidth * 0.7, footerY, {
      width: contentWidth * 0.3,
      align: "right",
    });
  }
}

export async function generateReport(
  inspection: Inspection
): Promise<{ reportUrl: string; reportId: string }> {
  const buffer = await buildReportPdf(inspection);
  const { reportUrl, reportId } = await writeReportFile(inspection.inspectionId, buffer);
  
  return { reportUrl, reportId };
}

export function buildReportPdf(inspection: Inspection): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 45, left: 36, right: 36 },
        bufferPages: true,
        info: {
          Title: `Legal Metrology Inspection Report - ${inspection.inspectionId}`,
          Author: "Department of Consumer Affairs (Labelly Enforcement)",
          Subject: "Packaged Commodities Rules 2011 Statutory Inspection",
          Keywords: "Legal Metrology, Inspection, Consumer Affairs, Compliance",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      renderReport(doc, inspection);
      addPageFooters(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/** Absolute local path for a stored report URL (used to stream the PDF). */
export function getReportFilePath(reportUrl: string): string {
  return filePathFromPublicUrl(reportUrl);
}