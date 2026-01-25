import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PHASES = [
  { name: 'URL Discovery', script: 'discover_urls.ts', output: 'src/assets/data/raw/hymn_urls.json' },
  { name: 'Content Scraping', script: 'scrape_content.ts', output: 'src/assets/data/raw/hymns_raw.json' },
  { name: 'Parsing', script: 'parse_sections.ts', output: 'src/assets/data/raw/hymns_parsed.json' },
  { name: 'Validation', script: 'validate.ts', output: 'src/assets/data/raw/hymns_final.json' },
];

function runPhase(phase: typeof PHASES[0], skipIfExists: boolean): boolean {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PHASE: ${phase.name}`);
  console.log(`${'='.repeat(60)}\n`);

  // Check if output already exists
  if (skipIfExists && fs.existsSync(phase.output)) {
    console.log(`Output ${phase.output} already exists.`);
    console.log('Skipping this phase. Delete the file to re-run.\n');
    return true;
  }

  const scriptPath = path.join(__dirname, phase.script);

  try {
    execSync(`npx ts-node ${scriptPath}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    return true;
  } catch (error) {
    console.error(`\nPhase "${phase.name}" failed!`);
    return false;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const skipExisting = args.includes('--skip-existing');
  const phaseArg = args.find(a => a.startsWith('--phase='));
  const specificPhase = phaseArg ? parseInt(phaseArg.split('=')[1], 10) : null;

  console.log('='.repeat(60));
  console.log('CHANT D\'ESPERANCE HYMN SCRAPER');
  console.log('='.repeat(60));
  console.log(`\nStarted at: ${new Date().toISOString()}`);

  if (skipExisting) {
    console.log('Mode: Skip existing outputs');
  }

  if (specificPhase !== null) {
    // Run specific phase only
    if (specificPhase < 1 || specificPhase > PHASES.length) {
      console.error(`Invalid phase number. Use 1-${PHASES.length}`);
      process.exit(1);
    }

    const phase = PHASES[specificPhase - 1];
    const success = runPhase(phase, skipExisting);

    if (!success) {
      process.exit(1);
    }
  } else {
    // Run all phases
    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const success = runPhase(phase, skipExisting);

      if (!success) {
        console.error(`\nPipeline stopped at phase ${i + 1}: ${phase.name}`);
        process.exit(1);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nFinished at: ${new Date().toISOString()}`);
  console.log('\nOutput files:');
  for (const phase of PHASES) {
    const exists = fs.existsSync(phase.output);
    console.log(`  ${exists ? '[OK]' : '[--]'} ${phase.output}`);
  }
  console.log('\nNext step: Run "npx ts-node scripts/generate_db.ts" to generate the database.');
}

main();
