class ButterflySim {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.count = options.count || 20;
        this.scale = options.scale || 0.8;
        this.butterflies = [];
        this.mx = -999;
        this.my = -999;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.container.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mx = e.clientX - r.left;
            this.my = e.clientY - r.top;
        });

        this.container.addEventListener('mouseleave', () => {
            this.mx = -999;
            this.my = -999;
        });

        this.sync();
        this.loop();
    }

    resize() {
        this.width = this.canvas.width = this.container.clientWidth;
        this.height = this.canvas.height = this.container.clientHeight;
    }

    sync() {
        while (this.butterflies.length < this.count) {
            this.butterflies.push(new Butterfly(this));
        }
        if (this.butterflies.length > this.count) {
            this.butterflies.length = this.count;
        }
    }

    loop() {
        // Effet de traînée identique à votre original
        this.ctx.fillStyle = 'rgba(224, 240, 255, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.butterflies.forEach(b => {
            b.update();
            b.draw();
        });

        requestAnimationFrame(() => this.loop());
    }
}

class Butterfly {
    constructor(sim) {
        this.sim = sim;
        this.init(true);
    }

    init(randomizeAll = false) {
        this.x = randomizeAll ? Math.random() * this.sim.width : (Math.random() < 0.5 ? -50 : this.sim.width + 50);
        this.y = randomizeAll ? Math.random() * this.sim.height : Math.random() * this.sim.height;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = 1 + Math.random() * 2;
        this.wobblePhase = Math.random() * 100;
        this.flapPhase = Math.random() * Math.PI * 2;
        this.idleT = 0;
        this.fleeing = false;
    }

    update() {
        const dx = this.sim.mx - this.x, dy = this.sim.my - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150 && this.sim.mx > 0) {
            this.fleeing = true;
            this.targetAngle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 2;
            this.idleT = 10;
        } else {
            this.fleeing = false;
            this.idleT--;
            if (this.idleT <= 0) {
                const isMajorChange = Math.random() > 0.94;
                this.targetAngle += isMajorChange ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 1.2;
                this.idleT = isMajorChange ? 30 + Math.random() * 60 : 10 + Math.random() * 20;
            }
        }

        let da = this.targetAngle - this.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        
        const turnChaos = 1 + Math.sin(this.wobblePhase * 0.5) * 0.5;
        this.angle += da * (this.fleeing ? 0.3 : 0.08) * turnChaos;

        this.wobblePhase += 0.1;
        const currentSpeed = (this.fleeing ? this.speed * 2.5 : this.speed) * (1 + Math.cos(this.wobblePhase * 0.7) * 0.3);

        this.x += Math.cos(this.angle) * currentSpeed;
        this.y += Math.sin(this.angle) * currentSpeed + Math.sin(this.wobblePhase) * 1.2;

        this.flapPhase += (currentSpeed * 0.06) + 0.1;

        const margin = 100 * this.sim.scale;
        if (this.x < -margin) this.x = this.sim.width + margin;
        if (this.x > this.sim.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = this.sim.height + margin;
        if (this.y > this.sim.height + margin) this.y = -margin;
    }

    draw() {
        const ctx = this.sim.ctx;
        const s = this.sim.scale * 30;
        const flapAmp = Math.sin(this.flapPhase); 
        const wingWidthFactor = 0.1 + Math.abs(flapAmp) * 0.9;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2 + Math.sin(this.wobblePhase)*0.1);
        
        const yOffset = flapAmp * s * 0.1;
        this._drawWings(ctx, s, wingWidthFactor, yOffset);
        this._drawBody(ctx, s);
        this._drawAntennae(ctx, s);
        ctx.restore();
    }

    _drawWings(ctx, s, widthFact, yOff) {
        const colorBlue = '#1f4796'; // Votre bleu
        const colorBlack = '#111111';
        const colorWhite = '#ffffff';

        ctx.save();
        ctx.translate(0, yOff);
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.scale(side * widthFact, 1);
            
            // Aile supérieure
            ctx.fillStyle = colorBlue;
            ctx.strokeStyle = colorBlack;
            ctx.lineWidth = s * 0.05;
            ctx.beginPath();
            ctx.moveTo(s*0.1, 0);
            ctx.bezierCurveTo(s*0.5, -s*0.2, s*1.5, -s*1.2, s*1.8, -s*0.5);
            ctx.bezierCurveTo(s*2.0, 0, s*1.5, s*0.8, s*0.1, s*0.3);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Aile inférieure
            ctx.beginPath();
            ctx.moveTo(s*0.1, s*0.2);
            ctx.bezierCurveTo(s*0.8, s*0.5, s*1.4, s*1.6, s*0.8, s*1.9);
            ctx.bezierCurveTo(s*0.4, s*2.1, -s*0.2, s*1.5, s*0.05, s*0.4);
            ctx.closePath();
            ctx.fill(); ctx.stroke();

            // Nervures (Identique à votre code original)
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = s * 0.02;
            ctx.beginPath();
            ctx.moveTo(s*0.2, -s*0.1); ctx.lineTo(s*1.6, -s*0.5);
            ctx.moveTo(s*0.2, 0); ctx.lineTo(s*1.5, 0.2);
            ctx.moveTo(s*0.2, s*0.1); ctx.lineTo(s*1.3, s*0.6);
            ctx.stroke();

            // Bordure noire et points blancs
            if (widthFact > 0.5) {
                ctx.fillStyle = colorBlack;
                ctx.beginPath();
                ctx.moveTo(s*1.4, -s*0.8);
                ctx.bezierCurveTo(s*2.1, -s*0.5, s*1.7, s*1.0, s*1.0, s*1.8);
                ctx.lineTo(s*0.6, s*1.9);
                ctx.bezierCurveTo(s*1.5, s*1.2, s*1.9, s*0, s*1.4, -s*0.8);
                ctx.fill();

                ctx.fillStyle = colorWhite;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.arc(s*1.6 + i*s*0.05, -s*0.3 + i*s*0.3 + Math.sin(i)*0.2*s, s*0.04, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            ctx.restore();
        });
        ctx.restore();
    }

    _drawBody(ctx, s) {
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.ellipse(0, 0, s*0.15, s*0.3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, s*0.5, s*0.1, s*0.45, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -s*0.35, s*0.12, 0, Math.PI*2); ctx.fill();
    }

    _drawAntennae(ctx, s) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = s * 0.02;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(side * s*0.05, -s*0.4);
            ctx.bezierCurveTo(side * s*0.1, -s*0.6, side * s*0.3, -s*0.7, side * s*0.2, -s*0.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(side * s*0.2, -s*0.9, s*0.04, 0, Math.PI*2);
            ctx.fillStyle = '#000000'; ctx.fill();
        });
    }
}