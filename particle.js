/*
 * Particle configuration and defaults
 */
var config = {
    framerate: 20,
    speedup: 1.25,
    vx_base: 60,
    vy_base: 50,
    gravity: -150,
    pps: 2/3,
    quality: 10,
    endPause: 0.5,
    scalePhysics: true
};

const dr = Math.pow(0.95, 30);
const dg = Math.pow(0.93, 30);
const db = Math.pow(0.90, 30);

/*
 * Particle
 * - x: number
 * - y: number
 * - color: number[4] (RGBA)
 * - width: canvas width
 * - height: canvas height
 * - cfg: optional configuration override
 */
function Particle(x, y, color, width, height, cfg) {
    cfg = cfg || config;
    width = width || (typeof renderWidth !== "undefined" ? renderWidth : 160);
    height = height || (typeof renderHeight !== "undefined" ? renderHeight : 160);

    const scaleX = cfg.scalePhysics ? width / 160 : 1;
    const scaleY = cfg.scalePhysics ? height / 160 : 1;

    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * cfg.vx_base * scaleX - cfg.vx_base * 0.5 * scaleX * ((width - x) / width - 0.5);
    this.vy = -Math.random() * cfg.vy_base * scaleY;
    this.color = [color[0], color[1], color[2], Math.floor(color[3])];
    this.fixed = true;

    this.update = () => {
        if (!this.fixed) {
            const fps = cfg.framerate || 20;
            const grav = (cfg.gravity != null ? cfg.gravity : -150) * scaleY;
            this.color[0] = Math.max(0, this.color[0] * Math.pow(dr, 1 / fps));
            this.color[1] = Math.max(0, this.color[1] * Math.pow(dg, 1 / fps));
            this.color[2] = Math.max(0, this.color[2] * Math.pow(db, 1 / fps));
            this.x += this.vx / fps;
            this.y += (0.5 * grav / fps + this.vy) / fps;
            this.vy += grav / fps;
        }
    };

    this.draw = (ctx) => {
        ctx.fillStyle = `rgba(${(this.color[0]).toFixed()}, ${(this.color[1]).toFixed()}, ${(this.color[2]).toFixed()}, ${this.color[3]})`;
        ctx.fillRect((this.x).toFixed(), (this.y).toFixed(), 1, 1);
    };
}