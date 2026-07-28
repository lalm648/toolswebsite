import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const port = 3210;
const origin = `http://127.0.0.1:${port}`;
const chromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function createFixtures(directory) {
  const firstAudio = join(directory, "first.wav");
  const secondAudio = join(directory, "second.wav");
  const video = join(directory, "source.mp4");
  const pdf = join(directory, "text.pdf");
  const subtitles = join(directory, "captions.srt");

  for (const [path, frequency] of [
    [firstAudio, 440],
    [secondAudio, 660],
  ]) {
    const result = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `sine=frequency=${frequency}:duration=0.8`,
        "-ar",
        "44100",
        "-ac",
        "2",
        "-y",
        path,
      ],
      { cwd: projectRoot },
    );
    assert.equal(result.status, 0, result.stderr?.toString());
  }

  const videoResult = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=320x180:d=1",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=523.25:duration=1",
      "-shortest",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-y",
      video,
    ],
    { cwd: projectRoot },
  );
  assert.equal(videoResult.status, 0, videoResult.stderr?.toString());
  await writeFile(
    subtitles,
    "1\n00:00:00,100 --> 00:00:00,900\nVerified caption output\n",
  );

  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const firstPage = document.addPage([612, 792]);
  firstPage.drawText("Reliable PDF extraction", {
    x: 54,
    y: 720,
    size: 18,
    font,
    color: rgb(0.05, 0.1, 0.2),
  });
  firstPage.drawText("This sentence should preserve its words and line.", {
    x: 54,
    y: 684,
    size: 11,
    font,
  });
  const secondPage = document.addPage([612, 792]);
  secondPage.drawText("Second page content", {
    x: 54,
    y: 720,
    size: 14,
    font,
  });
  await writeFile(pdf, await document.save());

  return { firstAudio, secondAudio, video, pdf, subtitles };
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited early with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("Timed out waiting for the production server.");
}

async function readLastAudio(page) {
  await page.waitForFunction(
    () => {
      const audio = [...document.querySelectorAll("audio")].at(-1);
      return Boolean(audio?.src.startsWith("blob:"));
    },
    undefined,
    { timeout: 180_000 },
  );
  return page.evaluate(async () => {
    const audio = [...document.querySelectorAll("audio")].at(-1);
    if (!(audio instanceof HTMLAudioElement)) {
      throw new Error("No result audio element was rendered.");
    }
    if (audio.readyState < 1) {
      await new Promise((resolveLoaded, rejectLoaded) => {
        audio.addEventListener("loadedmetadata", resolveLoaded, { once: true });
        audio.addEventListener("error", rejectLoaded, { once: true });
      });
    }
    const response = await fetch(audio.src);
    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      duration: audio.duration,
      size: bytes.length,
      signature: [...bytes.slice(0, 12)],
    };
  });
}

async function readLastVideo(page) {
  await page.waitForFunction(
    () => {
      const video = [...document.querySelectorAll("video")].at(-1);
      return Boolean(video?.src.startsWith("blob:"));
    },
    undefined,
    { timeout: 60_000 },
  );
  return page.evaluate(async () => {
    const video = [...document.querySelectorAll("video")].at(-1);
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("No result video element was rendered.");
    }
    if (video.readyState < 1) {
      await new Promise((resolveLoaded, rejectLoaded) => {
        video.addEventListener("loadedmetadata", resolveLoaded, { once: true });
        video.addEventListener("error", rejectLoaded, { once: true });
      });
    }
    const response = await fetch(video.src);
    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      duration: video.duration,
      size: bytes.length,
      signature: [...bytes.slice(4, 12)],
    };
  });
}

async function waitForNamedResult(page, name, timeout = 60_000) {
  const toolError = page
    .locator('p[role="alert"]')
    .filter({ hasText: /\S/ })
    .first();
  const result = page
    .getByText(name, { exact: true })
    .first()
    .waitFor({ timeout })
    .then(() => "result");
  const failure = toolError.waitFor({ timeout }).then(() => "error");
  const outcome = await Promise.race([result, failure]);
  if (outcome === "error") {
    throw new Error(
      `Tool reported an error: ${await toolError.textContent()}`,
    );
  }
}

async function runBrowserChecks(fixtures) {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-background-networking"],
  });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("toolswebsite-cookie-consent", "declined");
    localStorage.setItem("theme", "light");
  });
  const page = await context.newPage();
  page.setDefaultTimeout(180_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const results = {};
  try {
    await page.goto(`${origin}/tools/audio/audio-joiner`, {
      waitUntil: "networkidle",
    });
    await page.locator('input[type="file"]').first().setInputFiles([
      fixtures.firstAudio,
      fixtures.secondAudio,
    ]);
    await page
      .getByRole("button", { name: "Join tracks in order" })
      .click();
    await page
      .getByText("joined-2-tracks.mp3", { exact: true })
      .first()
      .waitFor();
    results.audioJoin = await readLastAudio(page);
    assert.ok(results.audioJoin.size > 2_000);
    assert.ok(results.audioJoin.duration > 1.4);
    console.log(JSON.stringify({ stage: "audio-join", ...results.audioJoin }));

    await page
      .getByRole("button", { name: /Mix simultaneously/ })
      .click();
    await page
      .getByRole("button", { name: "Mix tracks together" })
      .click();
    await page
      .getByText("mixed-2-tracks.mp3", { exact: true })
      .first()
      .waitFor();
    results.audioMix = await readLastAudio(page);
    assert.ok(results.audioMix.size > 1_000);
    assert.ok(results.audioMix.duration > 0.7);
    assert.ok(results.audioMix.duration < 1.2);
    console.log(JSON.stringify({ stage: "audio-mix", ...results.audioMix }));

    await page.goto(`${origin}/tools/video/audio-extractor`, {
      waitUntil: "networkidle",
    });
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fixtures.video);
    await page.getByRole("button", { name: "Extract audio" }).click();
    await page
      .getByText("source-audio.mp3", { exact: true })
      .first()
      .waitFor();
    results.audioExtract = await readLastAudio(page);
    assert.ok(results.audioExtract.size > 1_000);
    assert.ok(results.audioExtract.duration > 0.8);
    console.log(
      JSON.stringify({ stage: "audio-extract", ...results.audioExtract }),
    );

    await page.goto(`${origin}/tools/video/subtitles-burner`, {
      waitUntil: "networkidle",
    });
    const subtitleInputs = page.locator('input[type="file"]');
    await subtitleInputs.nth(0).setInputFiles(fixtures.video);
    await subtitleInputs.nth(1).setInputFiles(fixtures.subtitles);
    await page.getByRole("button", { name: "Process media" }).click();
    await waitForNamedResult(page, "source-captioned.mp4");
    results.subtitleBurn = await readLastVideo(page);
    assert.ok(results.subtitleBurn.size > 2_000);
    assert.ok(results.subtitleBurn.duration > 0.8);
    console.log(
      JSON.stringify({ stage: "subtitle-burn", ...results.subtitleBurn }),
    );

    await page.goto(`${origin}/tools/document/pdf-text-extractor`, {
      waitUntil: "networkidle",
    });
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fixtures.pdf);
    await page.getByRole("button", { name: "Process document" }).click();
    await page.getByText("Reliable PDF extraction", { exact: false }).waitFor();
    const extractedText = await page.locator("pre").last().textContent();
    assert.match(extractedText ?? "", /Reliable PDF extraction/);
    assert.match(
      extractedText ?? "",
      /This sentence should preserve its words and line\./,
    );
    assert.match(extractedText ?? "", /Second page content/);
    results.pdfText = extractedText;
    console.log(
      JSON.stringify({
        stage: "pdf-text",
        characters: extractedText?.length ?? 0,
      }),
    );

    assert.deepEqual(pageErrors, []);
    return results;
  } finally {
    await browser.close();
  }
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "webutilia-output-"));
const server = spawn(
  "npm",
  ["run", "start", "--", "-p", String(port), "-H", "127.0.0.1"],
  {
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  const fixtures = await createFixtures(temporaryDirectory);
  await waitForServer(server);
  const results = await runBrowserChecks(fixtures);
  console.log(
    JSON.stringify(
      {
        ok: true,
        audioJoin: results.audioJoin,
        audioMix: results.audioMix,
        audioExtract: results.audioExtract,
        subtitleBurn: results.subtitleBurn,
        pdfTextCharacters: results.pdfText?.length ?? 0,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(serverOutput);
  throw error;
} finally {
  server.kill("SIGTERM");
  await rm(temporaryDirectory, { recursive: true, force: true });
}
