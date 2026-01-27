/**
 * Lafwa Logo Asset Generator
 * 
 * Generates all required PNG assets from the dove SVG logo.
 * 
 * Run with: npx ts-node scripts/generate_logo_assets.ts
 * 
 * Generates:
 *   - assets/icon.png (1024×1024) - iOS app icon
 *   - assets/adaptive-icon.png (1024×1024) - Android foreground (dove only, transparent)
 *   - assets/splash-icon.png (512×512) - Splash screen
 *   - assets/favicon.png (64×64) - Web favicon
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === DESIGN SYSTEM COLORS ===
const OCEAN_BLUE = '#1a56db';
const WHITE = '#ffffff';

// === LOGO SVG (Dove with Ocean Blue background) ===
// Updated from original #4472c4 to match design system
const FULL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 800 800">
  <rect fill="${OCEAN_BLUE}" width="800" height="800"/>
  <g fill="${WHITE}">
    <path d="M171.9 245.5c-1 .9 1.1 13.3 3.7 22.1 4.2 14.7 10 24.3 18.1 30.1 12.2 8.8 27 14.2 63.5 23.3 46 11.5 64.4 19.1 86.3 35.5 9.8 7.4 25.2 23.8 31.9 33.9 9.8 14.8 17.9 33.6 22.6 52.5.6 2.3 1.3 4.1 1.5 3.9.3-.2 2-5.8 3.9-12.3 9-31.4 24-54.9 47.1-74.2 21.6-18 43.8-27.7 88.5-38.7 43.4-10.6 60.6-17.5 71.9-28.5 6.6-6.4 16.1-32.8 16.1-44.6v-4l-3.2 4c-7.1 8.8-17.6 17.2-29.1 23.4-13.5 7.3-24.5 10.6-78.2 23.7-38.1 9.2-61.2 20.9-81.3 41-10.1 10-10.3 10.2-11.2 7.8-1.5-3.8-1.2-13.7.4-17.6 2.2-5.1 7.3-9.6 13.8-12 5.5-2 5.7-2.2 3.8-3.5-4.4-3.1-12.9-6.3-19-7.2-22.4-3.1-43.1 10.7-49.9 33.4-.7 2.2-1.4 4.5-1.6 5.2s-4.4-2.7-9.2-7.5c-22.2-21.9-49.4-33.8-102.8-45.2-13.8-3-35.5-9.3-44.5-13-16.6-6.8-31-17.2-40.1-28.8-1.4-1.8-2.7-3-3-2.7"/>
    <path d="M154.5 288c3.4 20.5 14.9 50.8 26 68 15.8 24.7 34.3 41.4 58.8 53 12.2 5.8 21.7 9 47.7 16.4 25.9 7.2 33.6 9.9 45.5 15.6 17.2 8.2 33.5 21.4 42.6 34.7 7.4 10.8 15.3 30.1 16.5 40.8 1.3 11.2 2.4 6.1 2.4-11.3 0-43.7-9.2-78.9-28.3-108-15.1-23.2-38.1-41.4-67.2-53.5-11.3-4.7-21.5-7.8-47.1-14.3-55.2-14-71-20.8-89.2-37.9l-8.5-8zM635.9 292.3c-8.4 7.9-18.9 14.5-31.9 20-13.7 5.7-21.8 8.2-53 16.1-46.3 11.8-60.5 17.4-83.5 33-26.8 18.1-47 49-56.4 86.1-4 16.1-6.2 32.6-6.7 52-.7 21.5.4 28.8 2.5 16.5 4.3-26 21.5-51.9 44.3-66.6 15.6-10 28.3-15.1 59.8-23.9 27.8-7.7 36.4-10.7 50.5-17.6 35.2-17.1 59.7-46.9 75.1-91.2 2.8-8 8.4-28.8 8.4-31.1 0-1.5-2 0-9.1 6.7"/>
  </g>
</svg>`;

// === DOVE-ONLY SVG (for Android adaptive icon - transparent background) ===
const DOVE_ONLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 800 800">
  <g fill="${WHITE}">
    <path d="M171.9 245.5c-1 .9 1.1 13.3 3.7 22.1 4.2 14.7 10 24.3 18.1 30.1 12.2 8.8 27 14.2 63.5 23.3 46 11.5 64.4 19.1 86.3 35.5 9.8 7.4 25.2 23.8 31.9 33.9 9.8 14.8 17.9 33.6 22.6 52.5.6 2.3 1.3 4.1 1.5 3.9.3-.2 2-5.8 3.9-12.3 9-31.4 24-54.9 47.1-74.2 21.6-18 43.8-27.7 88.5-38.7 43.4-10.6 60.6-17.5 71.9-28.5 6.6-6.4 16.1-32.8 16.1-44.6v-4l-3.2 4c-7.1 8.8-17.6 17.2-29.1 23.4-13.5 7.3-24.5 10.6-78.2 23.7-38.1 9.2-61.2 20.9-81.3 41-10.1 10-10.3 10.2-11.2 7.8-1.5-3.8-1.2-13.7.4-17.6 2.2-5.1 7.3-9.6 13.8-12 5.5-2 5.7-2.2 3.8-3.5-4.4-3.1-12.9-6.3-19-7.2-22.4-3.1-43.1 10.7-49.9 33.4-.7 2.2-1.4 4.5-1.6 5.2s-4.4-2.7-9.2-7.5c-22.2-21.9-49.4-33.8-102.8-45.2-13.8-3-35.5-9.3-44.5-13-16.6-6.8-31-17.2-40.1-28.8-1.4-1.8-2.7-3-3-2.7"/>
    <path d="M154.5 288c3.4 20.5 14.9 50.8 26 68 15.8 24.7 34.3 41.4 58.8 53 12.2 5.8 21.7 9 47.7 16.4 25.9 7.2 33.6 9.9 45.5 15.6 17.2 8.2 33.5 21.4 42.6 34.7 7.4 10.8 15.3 30.1 16.5 40.8 1.3 11.2 2.4 6.1 2.4-11.3 0-43.7-9.2-78.9-28.3-108-15.1-23.2-38.1-41.4-67.2-53.5-11.3-4.7-21.5-7.8-47.1-14.3-55.2-14-71-20.8-89.2-37.9l-8.5-8zM635.9 292.3c-8.4 7.9-18.9 14.5-31.9 20-13.7 5.7-21.8 8.2-53 16.1-46.3 11.8-60.5 17.4-83.5 33-26.8 18.1-47 49-56.4 86.1-4 16.1-6.2 32.6-6.7 52-.7 21.5.4 28.8 2.5 16.5 4.3-26 21.5-51.9 44.3-66.6 15.6-10 28.3-15.1 59.8-23.9 27.8-7.7 36.4-10.7 50.5-17.6 35.2-17.1 59.7-46.9 75.1-91.2 2.8-8 8.4-28.8 8.4-31.1 0-1.5-2 0-9.1 6.7"/>
  </g>
</svg>`;

// === ASSET CONFIGURATIONS ===
interface AssetConfig {
  name: string;
  filename: string;
  size: number;
  svg: string;
  description: string;
  transparent: boolean;
}

const ASSETS: AssetConfig[] = [
  {
    name: 'App Icon (iOS)',
    filename: 'icon.png',
    size: 1024,
    svg: FULL_LOGO_SVG,
    description: 'iOS app icon - full logo with Ocean Blue background',
    transparent: false,
  },
  {
    name: 'Adaptive Icon (Android)',
    filename: 'adaptive-icon.png',
    size: 1024,
    svg: DOVE_ONLY_SVG,
    description: 'Android adaptive icon foreground - dove only, transparent background',
    transparent: true,
  },
  {
    name: 'Splash Icon',
    filename: 'splash-icon.png',
    size: 512,
    svg: FULL_LOGO_SVG,
    description: 'Splash screen icon',
    transparent: false,
  },
  {
    name: 'Favicon',
    filename: 'favicon.png',
    size: 64,
    svg: FULL_LOGO_SVG,
    description: 'Web favicon',
    transparent: false,
  },
];

// === MAIN GENERATION FUNCTION ===
async function generateAssets(): Promise<void> {
  console.log('\n🎨 Lafwa Logo Asset Generator');
  console.log('================================');
  
  // Dynamic import for sharp (handles ESM/CJS issues)
  let sharp: typeof import('sharp');
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.error('\n❌ Failed to load Sharp.');
    console.error('   Error:', error);
    console.error('\n   Try reinstalling:');
    console.error('   npm uninstall sharp && npm install sharp --save-dev\n');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const assetsDir = path.join(projectRoot, 'assets');

  console.log(`📁 Output directory: ${assetsDir}`);
  console.log(`🎨 Primary color: ${OCEAN_BLUE} (Ocean Blue)`);
  console.log('');

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('📁 Created assets directory');
  }

  // Generate each asset
  for (const asset of ASSETS) {
    const outputPath = path.join(assetsDir, asset.filename);
    
    try {
      // Convert SVG to PNG at the specified size
      const svgBuffer = Buffer.from(asset.svg);
      
      await sharp(svgBuffer, { density: 300 })
        .resize(asset.size, asset.size, {
          fit: 'contain',
          background: asset.transparent 
            ? { r: 0, g: 0, b: 0, alpha: 0 }  // Transparent for adaptive icon
            : { r: 26, g: 86, b: 219, alpha: 1 }  // Ocean Blue for others
        })
        .png({
          compressionLevel: 9,
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.log(`✅ ${asset.name}`);
      console.log(`   📄 ${asset.filename} (${asset.size}×${asset.size}px, ${sizeKB} KB)`);
      console.log(`   📝 ${asset.description}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to generate ${asset.filename}:`, error);
      process.exit(1);
    }
  }

  // Verify app.json configuration
  const appJsonPath = path.join(projectRoot, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    const expo = appJson.expo || {};
    
    console.log('🔍 Verifying app.json configuration...');
    
    const checks = [
      {
        name: 'iOS icon',
        expected: './assets/icon.png',
        actual: expo.icon,
      },
      {
        name: 'Splash image',
        expected: './assets/splash-icon.png',
        actual: expo.splash?.image,
      },
      {
        name: 'Splash background',
        expected: OCEAN_BLUE,
        actual: expo.splash?.backgroundColor,
      },
      {
        name: 'Android adaptive icon',
        expected: './assets/adaptive-icon.png',
        actual: expo.android?.adaptiveIcon?.foregroundImage,
      },
      {
        name: 'Android adaptive background',
        expected: OCEAN_BLUE,
        actual: expo.android?.adaptiveIcon?.backgroundColor,
      },
      {
        name: 'Web favicon',
        expected: './assets/favicon.png',
        actual: expo.web?.favicon,
      },
    ];

    let allGood = true;
    for (const check of checks) {
      if (check.actual === check.expected) {
        console.log(`   ✅ ${check.name}: ${check.actual}`);
      } else {
        console.log(`   ⚠️  ${check.name}: expected "${check.expected}", got "${check.actual}"`);
        allGood = false;
      }
    }

    if (!allGood) {
      console.log('\n⚠️  Some app.json values need updating. See above.');
    }
  }

  console.log('\n================================');
  console.log('🎉 Asset generation complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npx expo prebuild --clean');
  console.log('   2. Test iOS: npx expo run:ios');
  console.log('   3. Test Android: npx expo run:android');
  console.log('');
}

// Run the generator
generateAssets().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
