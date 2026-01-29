const os = require('os');
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');

console.log('OS Platform:', os.platform());
console.log('ffmpeg-static requirement:', ffmpegStatic);

let ffmpegPath = ffmpegStatic;

// Mimic the logic in audioExtractor.ts
if (os.platform() === 'win32' && ffmpegPath && (ffmpegPath.startsWith('\\ROOT') || !fs.existsSync(ffmpegPath))) {
    console.log('Attempting to fix Windows path...');
    console.log('Original Path:', ffmpegPath);

    const possiblePaths = [
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
        path.join(process.cwd(), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    ];

    try {
        // This might fail if we are in a script context vs module context, but let's try
        const pkgPath = require.resolve('ffmpeg-static');
        console.log('require.resolve("ffmpeg-static"):', pkgPath);
        const calculatedPath = path.join(path.dirname(pkgPath), 'ffmpeg.exe');
        possiblePaths.unshift(calculatedPath);
        console.log('Calculated from package path:', calculatedPath);
    } catch (e) {
        console.log('Error resolving ffmpeg-static package:', e.message);
    }

    for (const p of possiblePaths) {
        console.log(`Checking path: ${p}`);
        if (fs.existsSync(p)) {
            console.log(`FOUND at: ${p}`);
            ffmpegPath = p;
            break;
        } else {
            console.log(`NOT FOUND at: ${p}`);
        }
    }
}

if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    console.log('\nSUCCESS: Valid ffmpeg path found:', ffmpegPath);
} else {
    console.log('\nFAILURE: Could not find valid ffmpeg path.');
    if (ffmpegPath) console.log('Last checked path:', ffmpegPath);
}
