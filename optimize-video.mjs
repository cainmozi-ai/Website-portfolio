/**
 * Video Optimization Script
 *
 * The source clips are render-farm output at 9-15 Mbps, which is 10-20x more
 * than web delivery needs. This re-encodes each to an H.264 MP4 + VP9 WebM pair
 * with a poster frame, under a clean hyphenated filename.
 *
 * Case-study clips are muted autoplay loops, so their audio track is dropped.
 *
 * Requires ffmpeg on PATH. Run from the repo root:  node optimize-video.mjs [--force]
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { stat, unlink } from 'fs/promises';
import sharp from 'sharp';

const run = promisify(execFile);
const FORCE = process.argv.includes('--force');
const A = 'site/assets';
const M = 'masters/video';   // raw render masters, kept out of the publish folder

// crf 23 for the showreel (it is the hero content and gets real controls);
// 26 for the decorative muted loops, which are graded dark and grainy and so
// cost a lot of bitrate for detail nobody is scrubbing through.
const JOBS = [
  // V4 reel (73s, with soundtrack): MP4 only, audio kept, plays with controls.
  { src: `${M}/TME_Showreel_V4_Web.mp4`, out: `${A}/showreel`, poster: 2, crf: 25, audio: true, mp4Only: true },
  // maxH caps the encode at roughly what the player actually renders (max-height: 80vh),
  // so these loops stop shipping 1080p detail nobody sees.
  { src: `${M}/Costa Ad0000-0240.mp4`,    out: `${A}/Costa/costa-ad`,       poster: 2, crf: 28, maxH: 1280 },
  { src: `${M}/Partnership teaser 2.mp4`, out: `${A}/Costa/partnership-teaser`, poster: 4, crf: 28, maxH: 720 },
  { src: `${M}/Color render with edt.mp4`, out: `${A}/Midnight/midnight-run`, poster: 5, crf: 28, maxH: 720 },
  // Has a soundtrack, so it keeps audio and plays with controls (no autoplay).
  { src: `${M}/Byodoin-VR.mp4`, out: `${A}/Byodo-in/byodoin-vr`, poster: 2, crf: 24, maxH: 1080, audio: true },
  // VP9 with alpha; H.264 has none, so flatten onto the lock screen's white.
  { src: `${A}/ascii-video.webm`, out: `${A}/ascii-video`, poster: 1, crf: 26, mp4Only: true, flatten: '#FFFFFF' },
];

const exists = (p) => stat(p).then(() => true, () => false);
const mb = async (p) => ((await stat(p)).size / 1048576).toFixed(1) + 'MB';

for (const job of JOBS) {
  if (!await exists(job.src)) { console.log(`skip (no source): ${job.src}`); continue; }

  const mp4 = `${job.out}.mp4`;
  const webm = `${job.out}.webm`;
  const poster = `${job.out}-poster.jpg`;
  const a = ['-an'];                       // most clips here play muted
  const aMp4 = job.audio ? ['-c:a', 'aac', '-b:a', '96k'] : a;
  const aWebm = job.audio ? ['-c:a', 'libopus', '-b:a', '64k'] : a;
  const crf = String(job.crf ?? 23);
  // libx264 and libvpx both require even dimensions.
  const cap = job.maxH
    ? `scale=-2:'min(${job.maxH},ih)'`
    : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  const scale = job.flatten
    ? `color=${job.flatten}[bg];[bg][0:v]scale2ref=w=trunc(iw/2)*2:h=trunc(ih/2)*2[bg][v];[bg][v]overlay=shortest=1`
    : cap;
  const vf = job.flatten ? ['-filter_complex', scale] : ['-vf', scale];

  if (FORCE || !await exists(mp4)) {
    await run('ffmpeg', ['-y', '-i', job.src,
      ...vf,
      '-c:v', 'libx264', '-crf', crf, '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ...aMp4, mp4]);
    console.log(`  ${mp4}  ${await mb(job.src)} -> ${await mb(mp4)}`);
  }

  if (!job.mp4Only && (FORCE || !await exists(webm))) {
    await run('ffmpeg', ['-y', '-i', job.src,
      '-vf', cap,
      '-c:v', 'libvpx-vp9', '-crf', String(Number(crf) + 11), '-b:v', '0',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', ...aWebm, webm]);
    console.log(`  ${webm}  -> ${await mb(webm)}`);
  }

  if (FORCE || !await exists(poster)) {
    const tmp = `${job.out}-poster.png`;
    await run('ffmpeg', ['-y', '-ss', String(job.poster), '-i', job.src, '-frames:v', '1', tmp]);
    await sharp(tmp).resize(1600, null, { withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true }).toFile(poster);
    await unlink(tmp);
    console.log(`  ${poster}  -> ${await mb(poster)}`);
  }
}
console.log('Done.');
