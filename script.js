// ==========================================
// 1. 原生 JavaScript: 控制 Landing Page 的互動
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    const landingPage = document.getElementById("landing-page");

    startBtn.addEventListener("click", () => {
        // 加上淡出樣式
        landingPage.classList.add("fade-out");
        // 當按鈕被點擊後，我們也可以在 p5 中觸發某些特效
        isInteracting = true;
    });
});

// ==========================================
// 2. p5.js: 互動粒子藝術畫布
// ==========================================
let particles = [];
let isInteracting = false;
let colorTheme = 0; // 0: 科技藍青, 1: 迷幻紫粉, 2: 溫暖金橙

function setup() {
    // 建立滿版畫布
    createCanvas(windowWidth, windowHeight);
    
    // 初始化產生 150 個粒子
    for (let i = 0; i < 150; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
}

function draw() {
    // 透過帶有透明度的背景，創造粒子移動時的「殘影/尾巴」效果
    background(11, 11, 26, 30);

    // 更新並繪製所有粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].show();
        
        // 如果粒子壽命結束（在滑鼠點擊爆炸時有用），就將其移除
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // 當互動開始後，在滑鼠周圍畫一個微弱的引力圈提示
    if (isInteracting) {
        noFill();
        stroke(255, 255, 255, 15);
        ellipse(mouseX, mouseY, 200, 200);
    }
}

// 互動事件 A：點擊滑鼠 -> 在滑鼠位置爆發 30 個新粒子
function mousePressed() {
    if (!isInteracting) return; // 如果還沒開始就先不觸發
    for (let i = 0; i < 30; i++) {
        let p = new Particle(mouseX, mouseY, true);
        particles.push(p);
    }
}

// 互動事件 B：按下任意鍵 -> 切換顏色主題
function keyPressed() {
    if (!isInteracting) return;
    colorTheme = (colorTheme + 1) % 3;
}

// 視窗大小改變時，自動重新調整畫布大小
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// ==========================================
// 3. 粒子類別 (Particle Class)
// ==========================================
class Particle {
    constructor(x, y, isExplosion = false) {
        this.pos = createVector(x, y);
        
        if (isExplosion) {
            // 點擊爆炸的粒子：速度較快、向四面八方擴散
            this.vel = p5.Vector.random2D().mult(random(2, 6));
            this.lifespan = 255; // 有壽命限制
        } else {
            // 背景常駐粒子：微弱的隨機漂移
            this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
            this.lifespan = Infinity;
        }
        
        this.acc = createVector(0, 0);
        this.size = random(2, 6);
        this.color = this.getColor();
    }

    // 根據目前的主題決定粒子顏色
    getColor() {
        let c;
        if (colorTheme === 0) {
            c = color(random(0, 100), random(200, 255), 255); // 藍青
        } else if (colorTheme === 1) {
            c = color(random(200, 255), random(50, 150), random(200, 255)); // 紫粉
        } else {
            c = color(255, random(150, 220), random(0, 100)); // 金橙
        }
        return c;
    }

    update() {
        // 如果 Landing page 消失了，啟動滑鼠引力
        if (isInteracting) {
            let mouse = createVector(mouseX, mouseY);
            let dir = p5.Vector.sub(mouse, this.pos);
            let d = dir.mag();
            
            // 如果粒子距離滑鼠小於 300 像素，產生微弱引力
            if (d < 300) {
                dir.normalize();
                let force = (300 - d) / 3000; // 越近引力稍強
                this.acc.add(dir.mult(force));
            }
        }

        this.vel.add(this.acc);
        // 限制最大速度，避免粒子噴走
        this.vel.limit(4);
        this.pos.add(this.vel);
        this.acc.mult(0); // 每幀重置加速度

        // 如果是爆炸粒子，慢慢扣壽命
        if (this.lifespan !== Infinity) {
            this.lifespan -= 4;
        }

        // 常駐粒子的邊界碰撞檢查（從另一邊出來）
        if (this.lifespan === Infinity) {
            if (this.pos.x > width) this.pos.x = 0;
            if (this.pos.x < 0) this.pos.x = width;
            if (this.pos.y > height) this.pos.y = 0;
            if (this.pos.y < 0) this.pos.y = height;
        }
    }

    show() {
        noStroke();
        // 重新動態抓取主題色，這樣換主題時舊粒子也會變色
        let baseColor = this.getColor();
        
        if (this.lifespan !== Infinity) {
            fill(red(baseColor), green(baseColor), blue(baseColor), this.lifespan);
        } else {
            fill(baseColor);
        }
        
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    isDead() {
        return this.lifespan <= 0;
    }
}