// ==========================================
// 1. UI 互動與參數讀取 (包含 Landing Page 控制)
// ==========================================
let params = {
    density: 300,
    attractionForce: 0.5,
    colorSpeed: 1.4,
    trailDuration: 0.85,
    theme: 'cosmic'
};

let isInteracting = false; 

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    const landingPage = document.getElementById("landing-page");

    startBtn.addEventListener("click", () => {
        landingPage.classList.add("fade-out"); 
        isInteracting = true;                  
    });

    const controllers = {
        density: { slider: document.getElementById('densitySlider'), val: document.getElementById('densityVal') },
        attraction: { slider: document.getElementById('attractionSlider'), val: document.getElementById('attractionVal') },
        colorSpeed: { slider: document.getElementById('colorSpeedSlider'), val: document.getElementById('colorSpeedVal') },
        trail: { slider: document.getElementById('trailSlider'), val: document.getElementById('trailVal') },
        theme: document.getElementById('themeSelect'),
        reset: document.getElementById('resetBtn')
    };

    for (const key in controllers) {
        const item = controllers[key];
        if (item.slider) {
            item.slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                item.val.innerText = val.toFixed(key === 'density' ? 0 : (key === 'trail' ? 2 : 1));
                params[key] = val;
                
                if (key === 'density') initParticles();
            });
        }
    }

    controllers.theme.addEventListener('change', (e) => params.theme = e.target.value);
    controllers.reset.addEventListener('click', resetGravity);
});

// ==========================================
// 🎨 2. 自訂顏色主題配置區 (可在這隨時更改 RGB 數值 [紅, 綠, 藍])
// ==========================================
const themes = {
    // 主題 A: Cyberpunk 賽博龐克 (螢光桃紅 / 薄荷青藍 / 幻彩迷幻紫)
    cosmic: { 
        c1: [255, 0, 128],   
        c2: [0, 242, 254],   
        c3: [140, 0, 255]    
    }, 
    // 主題 B: Neon Ocean 霓虹深海 (深邃海藍 / 極光冰藍 / 未來高亮白)
    solar: { 
        c1: [0, 50, 200],    
        c2: [0, 255, 200],   
        c3: [240, 245, 255]  
    },  
    // 主題 C: Acid Lime 酸性螢光 (毒物螢光綠 / 閃電鮮黃 / 陰鬱極光紫)
    aurora: { 
        c1: [175, 255, 0],   
        c2: [255, 220, 0],   
        c3: [90, 0, 155]     
    }  
};

// ==========================================
// 3. p5.js核心引擎
// ==========================================
let particles = [];
let gravityPoints = []; 

function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    initParticles();
    colorMode(RGB);
}

function initParticles() {
    particles = [];
    for (let i = 0; i < params.density; i++) {
        particles.push(new Particle());
    }
}

function resetGravity() {
    gravityPoints = [];
    document.getElementById('canvas-tip').style.display = 'flex';
}

function draw() {
    background(6, 9, 19, (1 - params.trailDuration) * 150);

    noFill();
    for (let i = gravityPoints.length - 1; i >= 0; i--) {
        const g = gravityPoints[i];
        let pulseSize = 40 + sin(frameCount * 3 + i * 50) * 15;
        
        stroke(g.color[0], g.color[1], g.color[2], 80);
        strokeWeight(2);
        ellipse(g.x, g.y, pulseSize, pulseSize);
        
        fill(g.color[0], g.color[1], g.color[2], 15);
        ellipse(g.x, g.y, pulseSize * 1.5, pulseSize * 1.5);
    }

    for (let p of particles) {
        p.update();
        p.show();
    }
}

function mousePressed() {
    if (mouseX < 320 || !isInteracting) return;

    document.getElementById('canvas-tip').style.display = 'none';

    let currentThemeColors = themes[params.theme];
    let ptColors = [currentThemeColors.c1, currentThemeColors.c2, currentThemeColors.c3];
    
    gravityPoints.push({
        x: mouseX,
        y: mouseY,
        color: random(ptColors)
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// ==========================================
// 4. Particle 類別
// ==========================================
class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0);
        this.size = random(1.5, 4.5); 
        this.baseHue = random(1);     
        this.noiseOffset = random(1000); 
    }

    update() {
        if (gravityPoints.length === 0) {
            let noiseVel = createVector(
                noise(this.noiseOffset + frameCount * 0.01) - 0.5,
                noise(this.noiseOffset + frameCount * 0.01 + 100) - 0.5
            );
            this.vel.add(noiseVel.mult(0.05));
        } else if (isInteracting) {
            for (let gPoint of gravityPoints) {
                let gPos = createVector(gPoint.x, gPoint.y);
                let forceDir = p5.Vector.sub(gPos, this.pos);
                let distance = forceDir.mag();
                
                distance = constrain(distance, 15, 600);
                let forceMagnitude = params.attractionForce / (distance * distance / 100);
                forceDir.setMag(forceMagnitude);
                
                this.acc.add(forceDir);
            }
        }

        this.vel.add(this.acc);
        this.vel.limit(5); 
        this.pos.add(this.vel);
        this.acc.mult(0); 

        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    show() {
        let themeColors = themes[params.theme];
        let col1 = color(themeColors.c1[0], themeColors.c1[1], themeColors.c1[2]);
        let col2 = color(themeColors.c2[0], themeColors.c2[1], themeColors.c2[2]);
        let col3 = color(themeColors.c3[0], themeColors.c3[1], themeColors.c3[2]);
        
        let finalCol;
        if (this.baseHue < 0.5) {
            finalCol = lerpColor(col1, col2, this.baseHue * 2);
        } else {
            finalCol = lerpColor(col2, col3, (this.baseHue - 0.5) * 2);
        }

        finalCol.setAlpha(150 + sin(frameCount * params.colorSpeed * 5) * 80);

        noStroke();
        fill(finalCol);
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
        
        if (this.size > 3) {
            fill(red(finalCol), green(finalCol), blue(finalCol), 25);
            ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
        }
    }
}