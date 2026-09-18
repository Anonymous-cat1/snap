// DOM Elements
const cvs = document.getElementById("image");
const ctx = cvs.getContext("2d");
const resultImg = document.getElementById("result");
const imgInput = document.getElementById("img-input");
const goBtn = document.getElementById("go");
const downloadBtn = document.getElementById("download-btn");
const statusEl = document.getElementById("status");

// Resolution Controls
const renderWidthInput = document.getElementById("render-width");
const renderHeightInput = document.getElementById("render-height");
const useOrigResCheckbox = document.getElementById("use-orig-res");
const origResInfo = document.getElementById("orig-res-info");
const lockAspectCheckbox = document.getElementById("lock-aspect");

// Animation & Physics Controls
const fpsInput = document.getElementById("fps-input");
const speedInput = document.getElementById("speed-input");
const ppsInput = document.getElementById("pps-input");
const vxInput = document.getElementById("vx-input");
const gravityInput = document.getElementById("gravity-input");
const scalePhysicsCheckbox = document.getElementById("scale-physics");

// GIF Controls
const qualityInput = document.getElementById("quality-input");
const pauseInput = document.getElementById("pause-input");
const resetDefaultsBtn = document.getElementById("reset-defaults");

// State
let renderWidth = 160;
let renderHeight = 160;
let currentImage = null;
let particles = [];
let maxDist = 0;
let fn = (p) => Math.pow(p.x, 2) + Math.pow(p.y + renderHeight, 2);
let isRendering = false;

// Initialize canvas
cvs.width = renderWidth;
cvs.height = renderHeight;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateConfigFromUI() {
    config.framerate = parseInt(fpsInput.value, 10) || 20;
    config.speedup = parseFloat(speedInput.value) || 1.25;
    config.pps = parseFloat(ppsInput.value) || 2 / 3;
    config.vx_base = parseFloat(vxInput.value) || 60;
    config.gravity = -(parseFloat(gravityInput.value) || 150);
    config.scalePhysics = scalePhysicsCheckbox.checked;
    config.quality = parseInt(qualityInput.value, 10) || 10;
    config.endPause = parseFloat(pauseInput.value) || 0.5;
}

function rebuildParticles() {
    if (!currentImage) return;

    renderWidth = parseInt(renderWidthInput.value, 10) || 160;
    renderHeight = parseInt(renderHeightInput.value, 10) || 160;

    cvs.width = renderWidth;
    cvs.height = renderHeight;

    ctx.clearRect(0, 0, renderWidth, renderHeight);
    ctx.drawImage(currentImage, 0, 0, renderWidth, renderHeight);

    updateConfigFromUI();

    particles = [];
    const imgData = ctx.getImageData(0, 0, renderWidth, renderHeight).data;

    for (let i = 0; i < renderWidth; ++i) {
        for (let j = 0; j < renderHeight; ++j) {
            const idx = 4 * (j * renderWidth + i);
            const alpha = imgData[idx + 3];
            // Skip fully transparent pixels
            if (alpha === 0) continue;

            const color = [imgData[idx], imgData[idx + 1], imgData[idx + 2], alpha];
            particles.push(new Particle(i, j, color, renderWidth, renderHeight, config));
        }
    }

    maxDist = Math.sqrt(Math.pow(renderWidth, 2) + Math.pow(2 * renderHeight, 2));
    fn = (p) => Math.pow(p.x, 2) + Math.pow(p.y + renderHeight, 2);

    particles.sort((a, b) => fn(a) - fn(b));

    statusEl.textContent = `Ready: ${renderWidth}x${renderHeight} (${particles.length} particles)`;
    goBtn.disabled = false;
}

// File Selection Handler
imgInput.onchange = () => {
    const file = imgInput.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        currentImage = img;
        origResInfo.textContent = `(Original: ${img.naturalWidth}x${img.naturalHeight})`;

        if (useOrigResCheckbox.checked) {
            renderWidthInput.value = img.naturalWidth;
            renderHeightInput.value = img.naturalHeight;
        } else if (lockAspectCheckbox.checked) {
            const aspect = img.naturalWidth / img.naturalHeight;
            const currentW = parseInt(renderWidthInput.value, 10) || 160;
            renderHeightInput.value = Math.max(1, Math.round(currentW / aspect));
        }

        rebuildParticles();
    };
};

// Resolution Listeners
useOrigResCheckbox.onchange = () => {
    if (useOrigResCheckbox.checked && currentImage) {
        renderWidthInput.value = currentImage.naturalWidth;
        renderHeightInput.value = currentImage.naturalHeight;
        rebuildParticles();
    }
};

renderWidthInput.oninput = () => {
    const newWidth = parseInt(renderWidthInput.value, 10);
    if (!newWidth || newWidth <= 0) return;

    if (useOrigResCheckbox.checked) {
        useOrigResCheckbox.checked = false;
    }

    if (lockAspectCheckbox.checked && currentImage) {
        const aspect = currentImage.naturalWidth / currentImage.naturalHeight;
        renderHeightInput.value = Math.max(1, Math.round(newWidth / aspect));
    }

    rebuildParticles();
};

renderHeightInput.oninput = () => {
    const newHeight = parseInt(renderHeightInput.value, 10);
    if (!newHeight || newHeight <= 0) return;

    if (useOrigResCheckbox.checked) {
        useOrigResCheckbox.checked = false;
    }

    if (lockAspectCheckbox.checked && currentImage) {
        const aspect = currentImage.naturalWidth / currentImage.naturalHeight;
        renderWidthInput.value = Math.max(1, Math.round(newHeight * aspect));
    }

    rebuildParticles();
};

// Inputs change handlers
fpsInput.oninput = updateConfigFromUI;
speedInput.oninput = updateConfigFromUI;
ppsInput.oninput = updateConfigFromUI;
vxInput.oninput = updateConfigFromUI;
gravityInput.oninput = updateConfigFromUI;
scalePhysicsCheckbox.onchange = updateConfigFromUI;
qualityInput.oninput = updateConfigFromUI;
pauseInput.oninput = updateConfigFromUI;

// Reset to Defaults
resetDefaultsBtn.onclick = () => {
    renderWidthInput.value = 160;
    renderHeightInput.value = 160;
    useOrigResCheckbox.checked = false;
    lockAspectCheckbox.checked = true;

    fpsInput.value = 20;
    speedInput.value = 1.25;
    ppsInput.value = 0.67;
    vxInput.value = 60;
    gravityInput.value = 150;
    scalePhysicsCheckbox.checked = true;
    qualityInput.value = 10;
    pauseInput.value = 0.5;

    updateConfigFromUI();
    rebuildParticles();
};

// Animation and GIF Generation
async function run() {
    if (isRendering || !currentImage) return;
    isRendering = true;

    updateConfigFromUI();
    rebuildParticles();

    goBtn.disabled = true;
    downloadBtn.classList.add("hidden");
    statusEl.textContent = "Recording frames...";

    const gif = new GIF({
        workers: 2,
        quality: config.quality,
        width: renderWidth,
        height: renderHeight,
        transparent: 0x00ff00,
        background: 0x00ff00,
        workerScript: "gif.worker.js",
    });

    // Draw initial state (frame 0)
    ctx.clearRect(0, 0, renderWidth, renderHeight);
    ctx.fillStyle = "rgb(0, 255, 0)";
    ctx.fillRect(0, 0, renderWidth, renderHeight);
    for (let p of particles) {
        p.draw(ctx);
    }
    gif.addFrame(cvs, { delay: 1000 / config.framerate / config.speedup, copy: true });

    let i = 0;
    let endframes = 0;
    const endPauseFrames = Math.max(1, Math.round(config.endPause * config.framerate));
    const maxFrames = Math.max(100, config.framerate * 30);

    // Auto set gif length to allow all particles to exit the screen
    while (endframes < endPauseFrames && i < maxFrames) {
        await sleep(1);

        let done = true;

        ctx.clearRect(0, 0, renderWidth, renderHeight);
        ctx.fillStyle = "rgb(0, 255, 0)";
        ctx.fillRect(0, 0, renderWidth, renderHeight);

        const currentThreshold = maxDist * (1 - (i * config.pps) / config.framerate);
        for (let j = 0; j < particles.length; ++j) {
            if (Math.sqrt(fn(particles[j])) > currentThreshold) {
                particles[j].fixed = false;
            }
        }

        for (let p of particles) {
            p.update();
            p.draw(ctx);
            // Particle is still on screen if it lies within the canvas bounds
            if (p.x >= 0 && p.x < renderWidth && p.y >= 0 && p.y < renderHeight) {
                done = false;
            }
        }

        // If all particles have exited the screen, count endframes
        if (done) {
            endframes += 1;
        }
        i += 1;

        statusEl.textContent = `Recording frame ${i}...`;
        gif.addFrame(cvs, { delay: 1000 / config.framerate / config.speedup, copy: true });
    }

    statusEl.textContent = "Encoding GIF...";

    gif.on("progress", function (p) {
        const percent = Math.round(p * 100);
        statusEl.textContent = `Encoding GIF: ${percent}%`;
    });

    gif.on("finished", function (blob) {
        const blobUrl = URL.createObjectURL(blob);
        resultImg.src = blobUrl;

        downloadBtn.href = blobUrl;
        downloadBtn.classList.remove("hidden");

        const sizeKb = (blob.size / 1024).toFixed(1);
        statusEl.textContent = `Done! GIF rendered (${sizeKb} KB, ${i} frames).`;
        goBtn.disabled = false;
        isRendering = false;

        // Reset canvas back to original image
        ctx.clearRect(0, 0, renderWidth, renderHeight);
        ctx.drawImage(currentImage, 0, 0, renderWidth, renderHeight);
    });

    gif.render();
}

goBtn.onclick = run;

