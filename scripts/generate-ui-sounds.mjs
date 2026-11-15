#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const OUT_PUBLIC = path.join(root, "public", "sounds");
const OUT_DIST = path.join(root, "dist", "sounds");

const RATE = 44_100;

function writeWavToDir(dir, name, samples) {
  fs.mkdirSync(dir, { recursive: true });
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32760), 44 + index * 2);
  });
  const filePath = path.join(dir, `${name}.wav`);
  fs.writeFileSync(filePath, buffer);
  console.log(`wrote ${path.relative(root, filePath)} (${(dataLength / 1024).toFixed(1)} kB)`);
}

function envelope(t, duration, attack = 0.005, release = 0.08) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function click() {
  const duration = 0.065;
  const length = Math.floor(RATE * duration);
  const k = Math.log(350 / 920) / 0.05;
  const kGain = Math.log(0.001 / 0.9) / 0.06;
  let phase = 0;
  return Array.from({ length }, (_, index) => {
    const t = index / RATE;
    const freq = t <= 0.05 ? 920 * Math.exp(k * t) : 350;
    phase += (2 * Math.PI * freq) / RATE;
    const amp = t <= 0.06 ? 0.9 * Math.exp(kGain * t) : 0;
    return Math.sin(phase) * amp;
  });
}

function whoosh() {
  const duration = 0.28;
  const length = Math.floor(RATE * duration);
  const k1 = Math.log(580 / 180) / 0.16;
  const k2 = Math.log(220 / 580) / 0.12;
  const kGainDecay = Math.log(0.001 / 0.7) / 0.16;
  let phase = 0;
  return Array.from({ length }, (_, index) => {
    const t = index / RATE;
    let freq;
    if (t <= 0.16) {
      freq = 180 * Math.exp(k1 * t);
    } else {
      freq = 580 * Math.exp(k2 * (t - 0.16));
    }
    phase += (2 * Math.PI * freq) / RATE;

    let amp;
    if (t <= 0.12) {
      amp = 0.001 + (0.7 - 0.001) * (t / 0.12);
    } else {
      amp = 0.7 * Math.exp(kGainDecay * (t - 0.12));
    }
    return Math.sin(phase) * amp;
  });
}

function resolve() {
  const duration = 0.50;
  const length = Math.floor(RATE * duration);
  const chord = [523.25, 659.25, 783.99, 1046.5];
  const kDecay = Math.log(0.001 / 0.85) / 0.45;

  return Array.from({ length }, (_, index) => {
    const t = index / RATE;
    let sample = 0;
    chord.forEach((freq, idx) => {
      const startT = idx * 0.02;
      if (t >= startT) {
        const dt = t - startT;
        if (dt <= 0.45) {
          const amp = (0.85 / chord.length) * Math.exp(kDecay * dt);
          sample += Math.sin(2 * Math.PI * freq * dt) * amp;
        }
      }
    });
    return sample;
  });
}


const sounds = {
  click: click(),
  whoosh: whoosh(),
  resolve: resolve(),
};

for (const [name, samples] of Object.entries(sounds)) {
  writeWavToDir(OUT_PUBLIC, name, samples);
  if (fs.existsSync(OUT_DIST)) {
    writeWavToDir(OUT_DIST, name, samples);
  }
}


const publicTypeWav = path.join(OUT_PUBLIC, "type.wav");
const distTypeWav = path.join(OUT_DIST, "type.wav");
if (fs.existsSync(publicTypeWav) && fs.existsSync(OUT_DIST)) {
  fs.copyFileSync(publicTypeWav, distTypeWav);
  console.log(`preserved public/sounds/type.wav and synced to dist/sounds/type.wav`);
}
