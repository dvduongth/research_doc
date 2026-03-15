/**
 * generate_pptx.js
 * Combiner — OpenClaw Presentation (all 22 slides)
 *
 * Usage:
 *   node generate_pptx.js
 *
 * Requires:
 *   npm install pptxgenjs
 *
 * Output:
 *   OpenClaw_Presentation.pptx  (in the same directory as this script)
 */

"use strict";

const path = require("path");

// Part 1 creates the pres instance and adds slides 1–11, then exports it.
const { pres } = require("./generate_pptx_part1");

// Part 2 receives the pres object and appends slides 12–22.
const { addSlides12to22 } = require("./generate_pptx_part2");

addSlides12to22(pres);

// Write the combined PPTX file
const outPath = path.join(__dirname, "OpenClaw_Presentation.pptx");

pres.writeFile({ fileName: outPath })
  .then(() => {
    console.log("Generated:", outPath);
  })
  .catch((err) => {
    console.error("Error generating PPTX:", err);
    process.exit(1);
  });
