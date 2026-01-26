/**
 * Generate Implementation Plan Document
 * Run: npx ts-node docs/generate_implementation_plan.ts
 * Or: npm install docx && node docs/generate_implementation_plan.js
 */

const fs = require('fs');
const path = require('path');

async function generateDoc() {
  // Dynamic import to handle if docx isn't installed
  let docx;
  try {
    docx = require('docx');
  } catch {
    console.log('Installing docx package...');
    require('child_process').execSync('npm install docx --save-dev', { stdio: 'inherit' });
    docx = require('docx');
  }

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    PageBreak, LevelFormat
  } = docx;

  // Helper for borders
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  // Helper for table cells
  const cell = (text: string, options: any = {}) => new TableCell({
    borders,
    width: { size: options.width || 2340, type: WidthType.DXA },
    shading: options.header ? { fill: "1a56db", type: ShadingType.CLEAR } : { fill: "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({
        text,
        bold: options.bold || options.header,
        color: options.header ? "FFFFFF" : "111827",
        size: options.size || 22
      })]
    })]
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: "1a56db" },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: "111827" },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: "374151" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
      ]
    },
    numbering: {
      config: [
        { reference: "bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
          ] },
        { reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // TITLE PAGE
        new Paragraph({ spacing: { after: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "IMPLEMENTATION PLAN", size: 48, bold: true, color: "1a56db" })]
        }),
        new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Lafwa Text View & Hymn Reader Improvements", size: 32, color: "374151" })]
        }),
        new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Based on Senior Design Team UX/UI Review", size: 24, color: "6b7280" })]
        }),
        new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 1.0 • January 2026", size: 22, color: "6b7280" })]
        }),

        // CRITICAL ASSESSMENT BOX
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [9360],
          rows: [
            new TableRow({ children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 8, color: "dc2626" }, bottom: border, left: border, right: border },
                shading: { fill: "fef2f2", type: ShadingType.CLEAR },
                margins: { top: 200, bottom: 200, left: 200, right: 200 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "⚠️ CRITICAL ASSESSMENT", size: 28, bold: true, color: "dc2626" })] }),
                  new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Before implementing the UX review recommendations, three critical issues must be addressed:", size: 22, color: "374151" })] }),
                  new Paragraph({ spacing: { before: 80 }, numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Highlights Bug: Highlights are stored only in React state and disappear on refresh. The addHighlight query exists but is never called.", size: 22, bold: true, color: "991b1b" })] }),
                  new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Hymn Reader Missing: The Hymns tab shows placeholder data. Users cannot read hymn lyrics—50% of the app's value proposition.", size: 22, bold: true, color: "991b1b" })] }),
                  new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Reading Position Unused: Settings store has lastReadBible but BibleReader never calls setLastReadBible.", size: 22, bold: true, color: "991b1b" })] }),
                ]
              })
            ] })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // EXECUTIVE SUMMARY
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Executive Summary")] }),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun("This plan addresses gaps identified in the Senior Design Team's UX/UI review comparing Lafwa to Kindle, YouVersion Bible App, and Apple Books. The review identified strong foundations in typography, swipe navigation, and verse actions, but critical gaps in reading continuity, study features, and the Hymn Reader implementation.")
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Key Principle: ", bold: true }),
          new TextRun("We prioritize fixing broken functionality before adding new features. Shipping features that don't work undermines user trust and creates technical debt.")
        ]}),

        // SCOPE & PRIORITIES
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Scope Prioritization")] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [1500, 3000, 2000, 2860],
          rows: [
            new TableRow({ children: [
              cell("Phase", { header: true, width: 1500 }),
              cell("Focus Area", { header: true, width: 3000 }),
              cell("Timeline", { header: true, width: 2000 }),
              cell("Business Impact", { header: true, width: 2860 })
            ]}),
            new TableRow({ children: [
              cell("0", { bold: true, width: 1500 }),
              cell("Critical Bug Fixes", { width: 3000 }),
              cell("1-2 days", { width: 2000 }),
              cell("Prevents user data loss", { width: 2860 })
            ]}),
            new TableRow({ children: [
              cell("1", { bold: true, width: 1500 }),
              cell("Hymn Reader (Core Feature)", { width: 3000 }),
              cell("1-2 weeks", { width: 2000 }),
              cell("Delivers 50% of value prop", { width: 2860 })
            ]}),
            new TableRow({ children: [
              cell("2", { bold: true, width: 1500 }),
              cell("Reading Experience Polish", { width: 3000 }),
              cell("1 week", { width: 2000 }),
              cell("Competitive parity", { width: 2860 })
            ]}),
            new TableRow({ children: [
              cell("3", { bold: true, width: 1500 }),
              cell("Study Features", { width: 3000 }),
              cell("1-2 weeks", { width: 2000 }),
              cell("User engagement", { width: 2860 })
            ]}),
            new TableRow({ children: [
              cell("4", { bold: true, width: 1500 }),
              cell("Advanced Features (V1.1)", { width: 3000 }),
              cell("Post-launch", { width: 2000 }),
              cell("Nice-to-have", { width: 2860 })
            ]}),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // PHASE 0
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Phase 0: Critical Bug Fixes")] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Timeline: 1-2 days | Prerequisite for all other work", italics: true, color: "6b7280" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Fix Highlights Persistence")] }),
        new Paragraph({ spacing: { after: 100 }, children: [
          new TextRun({ text: "Problem: ", bold: true }),
          new TextRun("Highlights set by users disappear when they navigate away or close the app. The database table and query functions exist but are never called from the UI.")
        ]}),
        
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Root Cause Analysis")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("BibleReader.tsx line 85: handleHighlight only updates React state")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("queries.ts has addHighlight() and getHighlightForVerse() functions that are never imported")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("loadContent() doesn't check for existing highlights when enriching verses")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Implementation Steps")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Import addHighlight, removeHighlight, getHighlightForVerse from '../db/queries'")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("In loadContent(), call getHighlightForVerse() for each verse during enrichment")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("In handleHighlight(), call addHighlight(verseId, color) before updating state")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("In handleRemoveHighlight(), call removeHighlight(verseId) before updating state")] }),

        new Paragraph({ spacing: { before: 200 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Wire Up Reading Position Memory")] }),
        new Paragraph({ spacing: { after: 100 }, children: [
          new TextRun({ text: "Problem: ", bold: true }),
          new TextRun("Settings store has lastReadBible with setLastReadBible action, but BibleReader never calls it.")
        ]}),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Implementation Steps")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("In BibleReader, add useEffect that calls setLastReadBible(book.nameFr, chapter) when book/chapter changes")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("In Home tab, read lastReadBible and show 'Continue Reading' card")] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("Link 'Continue Reading' to Bible tab with pre-selected book/chapter")] }),

        new Paragraph({ children: [new PageBreak()] }),

        // PHASE 1
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Phase 1: Hymn Reader Implementation")] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Timeline: 1-2 weeks | Core feature required for launch", italics: true, color: "6b7280" })] }),

        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Strategic Context: ", bold: true }),
          new TextRun("The Hymn Reader is not a 'nice to have'—it's 50% of Lafwa's value proposition. Haitian churches chose this app because YouVersion doesn't have Chant d'Espérance.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Required Components")] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [2800, 4200, 2360],
          rows: [
            new TableRow({ children: [
              cell("Component", { header: true, width: 2800 }),
              cell("Description", { header: true, width: 4200 }),
              cell("Effort", { header: true, width: 2360 })
            ]}),
            new TableRow({ children: [
              cell("HymnReader.tsx", { bold: true, width: 2800 }),
              cell("Full-screen lyrics display matching Bible reader typography", { width: 4200 }),
              cell("1-2 days", { width: 2360 })
            ]}),
            new TableRow({ children: [
              cell("HymnDetailScreen", { bold: true, width: 2800 }),
              cell("Header with hymn number/title, reader, action bar", { width: 4200 }),
              cell("1 day", { width: 2360 })
            ]}),
            new TableRow({ children: [
              cell("PresentationMode.tsx", { bold: true, width: 2800 }),
              cell("Full-screen black bg, white text, section-by-section", { width: 4200 }),
              cell("2-3 days", { width: 2360 })
            ]}),
            new TableRow({ children: [
              cell("HymnNumberPicker", { bold: true, width: 2800 }),
              cell("Numeric keypad for quick jump to hymn by number", { width: 4200 }),
              cell("0.5 day", { width: 2360 })
            ]}),
            new TableRow({ children: [
              cell("Database queries", { bold: true, width: 2800 }),
              cell("getHymnWithSections(), getAllHymns(), search integration", { width: 4200 }),
              cell("0.5 day", { width: 2360 })
            ]}),
          ]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 HymnReader Specifications")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hymn number: Display size (32px), centered, Ocean Blue color")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Title: Title 1 (24px semibold), centered, below number")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Section labels: 'Vèsè 1', 'Vèsè 2' in Caption size, Slate color")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Refrain label: 'Refren' in Caption size, Ocean Blue color")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Refrain text: 8px left margin indent")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Presentation Mode Specifications")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Background: Pure black (#000000)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Text: Pure white (#FFFFFF)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Font size: 32px fixed")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("One section per screen (verse OR refrain)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Tap/swipe navigation between sections")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Screen stays awake (expo-keep-awake)")] }),

        // Summary footer
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Timeline Summary")] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [1800, 4000, 1800, 1760],
          rows: [
            new TableRow({ children: [
              cell("Phase", { header: true, width: 1800 }),
              cell("Deliverables", { header: true, width: 4000 }),
              cell("Duration", { header: true, width: 1800 }),
              cell("Cumulative", { header: true, width: 1760 })
            ]}),
            new TableRow({ children: [
              cell("0", { bold: true, width: 1800 }),
              cell("Bug fixes (highlights, reading position)", { width: 4000 }),
              cell("1-2 days", { width: 1800 }),
              cell("Day 2", { width: 1760 })
            ]}),
            new TableRow({ children: [
              cell("1", { bold: true, width: 1800 }),
              cell("Hymn Reader + Presentation Mode", { width: 4000 }),
              cell("1-2 weeks", { width: 1800 }),
              cell("Week 2", { width: 1760 })
            ]}),
            new TableRow({ children: [
              cell("2", { bold: true, width: 1800 }),
              cell("Sepia, line spacing, verse jump, progress", { width: 4000 }),
              cell("1 week", { width: 1800 }),
              cell("Week 3", { width: 1760 })
            ]}),
            new TableRow({ children: [
              cell("3", { bold: true, width: 1800 }),
              cell("Notes, multi-verse selection", { width: 4000 }),
              cell("1-2 weeks", { width: 1800 }),
              cell("Week 5", { width: 1760 })
            ]}),
          ]
        }),

        new Paragraph({ spacing: { before: 300 }, children: [
          new TextRun({ text: "Total estimated time to launch: 5-6 weeks", bold: true, size: 24 })
        ]}),

        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "— End of Document —", italics: true, color: "6b7280", size: 20 })
        ]}),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'Lafwa_Implementation_Plan_v1.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Document created: ${outputPath}`);
}

generateDoc().catch(console.error);
