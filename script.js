// ==========================================
// 1. UI 互動與參數讀取
// ==========================================
let params = {
    density: 300,
    attractionForce: 0.5,
    colorSpeed: 1.4,
    trailDuration: 0.85,
    theme: 'cosmic'
};

document.addEventListener("DOMContentLoaded", () => {
    // 獲取所有控制項
    const controllers = {
        density: { slider: document.getElementById('densitySlider'), val: document.getElementById('densityVal') },
        attraction: { slider: document.getElementById('attractionSlider'), val: document.getElementById('attractionVal') },
        colorSpeed: { slider: document.getElementById('colorSpeedSlider'), val: document.getElementById('colorSpeedVal') },
        trail: { slider: document.getElementById('trailSlider'), val: document.getElementById('trailVal') },
        theme: document.getElementById('themeSelect'),
        reset: document.getElementById('resetBtn')
    };

    // 參數 Slider 綁定
    for (const key in controllers) {
        const item = controllers[key];
        if (item.slider) {
            item.slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                item.val.innerText = val.toFixed(key === 'density' ? 0 : (key === 'trail' ? 2 : 1));
                params[key] = val;
                
                // 特定處理：改變 Density 時重新初始化粒子
                if (key === 'density') initParticles();
            });
        }
    }

    // 主題與重置按鈕綁定
    controllers.theme.addEventListener('change', (e) => params.theme = e.target.value);
    controllers.reset.addEventListener('click', resetGravity);
});

// ==========================================
// 2. p5.js: Cosmic Drift 系統
// ==========================================
let particles = [];
let gravityPoints = []; // 儲存點擊建立的引力點

// 各主題的配色方案 (Primary, Secondary, Accent)
const themes = {
    cosmic: { c1: [79, 172, 254], c2: [0, 242, 254], c3: [255, 100, 255] }, // 藍青紫
    solar: { c1: [255, 60, 30], c2: [255, 200, 0], c3: [255, 150, 255] },  // 紅黃紫
    aurora: { c1: [30, 255, 100], c2: [150, 50, 255], c3: [50, 150, 255] }  // 綠紫藍
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    initParticles();
    colorMode(RGB);
}

// 初始化粒子系統
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
    // 使用透明度背景創造 Trail Duration
    background(6, 9, 19, (1 - params.trailDuration) * 150);

    // 更新並繪製所有引力點 (Image 1 中央的行星/漩渦點)
    noFill();
    for (let i = gravityPoints.length - 1; i >= 0; i--) {
        const g = gravityPoints[i];
        
        // 用脈衝光圈表示重力點
        let pulseSize = 40 + sin(frameCount * 3 + i * 50) * 15;
        let c = color(g.color[0], g.color[1], g.color[2]);
        
        stroke(g.color[0], g.color[1], g.color[2], 50);
        strokeWeight(2);
        ellipse(g.x, g.y, pulseSize, pulseSize);
        
        fill(g.color[0], g.color[1], g.color[2], 10);
        ellipse(g.x, g.y, pulseSize * 1.5, pulseSize * 1.5);
    }

    // 更新並繪製所有粒子 (核心視覺)
    for (let p of particles) {
        p.update();
        p.show();
    }
}

// 互動事件：點擊畫布
function mousePressed() {
    // 如果點擊是在 UI 面板內，則忽略
    if (mouseX < 320) return;

    // 隱藏提示
    document.getElementById('canvas-tip').style.display = 'none';

    // 從當前主題中隨機抓取Accent顏色
    let currentThemeColors = themes[params.theme];
    let ptColors = [currentThemeColors.c1, currentThemeColors.c2, currentThemeColors.c3];
    
    // 建立新引力點
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
// 3. 粒子類別 (Particle Class)
// ==========================================
class Particle {
    constructor() {
        // 在畫面隨機位置開始，或依橢圓隨機位置開始
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-1, 1), random(-1, 1)); // 初始隨機速度
        this.acc = createVector(0, 0);
        
        this.size = random(1.5, 4.5); // 粒子的亮點大小
        this.baseHue = random(1);     // 用於顏色漸變
        this.noiseOffset = random(1000); // 用於隨機漂移
    }

    update() {
        // 如果沒有引力點，粒子會緩慢漂移
        if (gravityPoints.length === 0) {
            // 加入些微噪點隨機運動
            let noiseVel = createVector(
                noise(this.noiseOffset + frameCount * 0.01) - 0.5,
                noise(this.noiseOffset + frameCount * 0.01 + 100) - 0.5
            );
            this.vel.add(noiseVel.mult(0.05));
        } else {
            // 計算所有引力點對該粒子的引力場
            for (let gPoint of gravityPoints) {
                let gPos = createVector(gPoint.x, gPoint.y);
                let forceDir = p5.Vector.sub(gPos, this.pos); // 指向引力點的方向
                let distance = forceDir.mag();
                
                // 將距離限制，防止過近導致無限速度，過遠則引力過小
                distance = constrain(distance, 15, 600);
                
                // 標準古典力學引力公式: G * (m1*m2) / d^2
                // 我們這裡簡化公式，直接將 Attraction Force 與距離平方成反比
                // forceDir.normalize();
                let forceMagnitude = params.attractionForce / (distance * distance / 100);
                forceDir.setMag(forceMagnitude);
                
                this.acc.add(forceDir); // 加上重力加速度
            }
        }

        this.vel.add(this.acc); // 加速度與速度相加
        
        // 限制最大速度，創造優雅的繞行軌道，防止被射飛
        this.vel.limit(5);
        
        this.pos.add(this.vel); // 速度與位置相加
        this.acc.mult(0); // 每幀重置加速度

        // 如果超出畫面，則邊界碰撞（從另一側出來）
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    show() {
        // 根據主題和滑鼠位置在顏色之間進行動態混合
        let themeColors = themes[params.theme];
        
        // 抓取配色方案
        let col1 = color(themeColors.c1[0], themeColors.c1[1], themeColors.c1[2]);
        let col2 = color(themeColors.c2[0], themeColors.c2[1], themeColors.c2[2]);
        let col3 = color(themeColors.c3[0], themeColors.c3[1], themeColors.c3[2]);
        
        // 使用 LerpColor，根據 baseHue 在 col1, col2, col3 之間做出平滑過渡
        let finalCol;
        if (this.baseHue < 0.5) {
            // 如果 baseHue 在 0-0.5，混合 Col1 和 Col2
            finalCol = lerpColor(col1, col2, this.baseHue * 2);
        } else {
            // 如果 baseHue 在 0.5-1，混合 Col2 和 Col3
            finalCol = lerpColor(col2, col3, (this.baseHue - 0.5) * 2);
        }

        // 根據顏色切換速度，讓顏色產生脈衝或緩慢移動
        finalCol.setAlpha(150 + sin(frameCount * params.colorSpeed * 5) * 80); // 透明度也隨之脈衝

        // 繪製粒子亮點 (Ellipse)
        noStroke();
        fill(finalCol);
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
        
        // 如果是較大的粒子，加入一點發光 (Glow) 效果 (Image 1 風格)
        if (this.size > 3) {
            fill(red(finalCol), green(finalCol), blue(finalCol), 20);
            ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
        }
    }
}