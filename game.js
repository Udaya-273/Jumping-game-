class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4; // Random horizontal velocity
        this.vy = 0; // Vertical velocity
        this.gravity = 0.5;
        this.bounce = 0.8;
        this.friction = 0.99;
        this.jumpPower = -12;
        this.isJumping = false;
    }
    
    update(canvas) {
        // Apply gravity
        this.vy += this.gravity;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply friction
        this.vx *= this.friction;
        
        // Bounce off walls
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.vx = -this.vx * this.bounce;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        
        // Bounce off floor
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy = -this.vy * this.bounce;
            this.isJumping = false;
            
            // Stop tiny bounces
            if (Math.abs(this.vy) < 1) {
                this.vy = 0;
            }
        }
        
        // Ceiling bounce
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * this.bounce;
        }
    }
    
    jump() {
        // Only jump if not already jumping high
        if (Math.abs(this.vy) < 5) {
            this.vy = this.jumpPower;
            this.isJumping = true;
        }
    }
    
    draw(ctx, canvas) {
        // Draw shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, canvas.height - 5, this.radius * 0.8, this.radius * 0.3, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        
        // Draw ball with gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.lightenColor(this.color, 40));
        gradient.addColorStop(1, this.color);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    distanceTo(otherBall) {
        const dx = this.x - otherBall.x;
        const dy = this.y - otherBall.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class SpikeDisk {
    constructor(canvas) {
        this.canvas = canvas;
        this.radius = 40;
        this.x = this.radius;
        this.y = canvas.height - this.radius - 10;
        this.speed = 2;
        this.direction = 1;
        this.rotation = 0;
        this.rotationSpeed = 0.1;
        this.spikes = 8;
        this.spikeLength = 15;
    }
    
    update() {
        // Move horizontally
        this.x += this.speed * this.direction;
        
        // Bounce off walls
        if (this.x + this.radius >= this.canvas.width || this.x - this.radius <= 0) {
            this.direction *= -1;
            this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        }
        
        // Rotate spikes
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw main disk (dark gray)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw spikes
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.spikes; i++) {
            const angle = (i / this.spikes) * 2 * Math.PI;
            const spikeX = Math.cos(angle) * this.radius;
            const spikeY = Math.sin(angle) * this.radius;
            const tipX = Math.cos(angle) * (this.radius + this.spikeLength);
            const tipY = Math.sin(angle) * (this.radius + this.spikeLength);
            
            // Draw spike triangle
            ctx.beginPath();
            ctx.moveTo(spikeX - 5, spikeY - 5);
            ctx.lineTo(spikeX + 5, spikeY + 5);
            ctx.lineTo(tipX, tipY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Add center highlight
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(ball) {
        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check collision with spikes (extended radius)
        return distance < (this.radius + this.spikeLength + ball.radius);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.jumpCount = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        this.spikeDisk = new SpikeDisk(this.canvas);
        this.ballsDestroyed = 0;
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    init() {
        // Create initial balls
        for (let i = 0; i < 3; i++) {
            this.addBall();
        }
        this.updateUI();
    }
    
    addBall() {
        const radius = 20 + Math.random() * 20;
        const x = radius + Math.random() * (this.canvas.width - 2 * radius);
        const y = radius + Math.random() * (this.canvas.height / 2);
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        const ball = new Ball(x, y, radius, color);
        this.balls.push(ball);
        this.updateUI();
    }
    
    setupEventListeners() {
        // Spacebar and click to make balls jump
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.makeAllBallsJump();
            }
        });
        
        this.canvas.addEventListener('click', () => {
            this.makeAllBallsJump();
        });
        
        // Mouse movement for interaction
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        // Click on balls to make them jump individually
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if click is on a ball
            for (let ball of this.balls) {
                const distance = Math.sqrt((clickX - ball.x) ** 2 + (clickY - ball.y) ** 2);
                if (distance <= ball.radius) {
                    ball.jump();
                    this.jumpCount++;
                    this.updateUI();
                    break;
                }
            }
        });
    }
    
    makeAllBallsJump() {
        this.balls.forEach(ball => ball.jump());
        this.jumpCount += this.balls.length;
        this.updateUI();
    }
    
    handleBallCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];
                const distance = ball1.distanceTo(ball2);
                const minDistance = ball1.radius + ball2.radius;
                
                if (distance < minDistance) {
                    // Calculate collision response
                    const dx = ball2.x - ball1.x;
                    const dy = ball2.y - ball1.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Separate balls
                    const overlap = minDistance - distance;
                    const separateX = Math.cos(angle) * overlap * 0.5;
                    const separateY = Math.sin(angle) * overlap * 0.5;
                    
                    ball1.x -= separateX;
                    ball1.y -= separateY;
                    ball2.x += separateX;
                    ball2.y += separateY;
                    
                    // Exchange velocities (simplified)
                    const tempVx = ball1.vx;
                    const tempVy = ball1.vy;
                    ball1.vx = ball2.vx * 0.8;
                    ball1.vy = ball2.vy * 0.8;
                    ball2.vx = tempVx * 0.8;
                    ball2.vy = tempVy * 0.8;
                }
            }
        }
    }
    
    handleSpikeCollisions() {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            if (this.spikeDisk.checkCollision(ball)) {
                // Create explosion effect
                this.createExplosion(ball.x, ball.y, ball.color);
                
                // Remove the ball
                this.balls.splice(i, 1);
                this.ballsDestroyed++;
                
                // Add a new ball after a short delay if there are still balls left
                if (this.balls.length === 0) {
                    setTimeout(() => {
                        this.addBall();
                        this.addBall();
                        this.addBall();
                    }, 1000);
                }
                
                this.updateUI();
            }
        }
    }
    
    createExplosion(x, y, color) {
        // Create explosion particles (simple implementation)
        for (let i = 0; i < 8; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                color: color
            };
            
            // Add particle animation (simplified)
            this.animateParticle(particle);
        }
    }
    
    animateParticle(particle) {
        const animate = () => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life > 0) {
                // Draw particle
                this.ctx.save();
                this.ctx.globalAlpha = particle.life / 30;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.restore();
                
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    update() {
        // Update all balls
        this.balls.forEach(ball => ball.update(this.canvas));
        
        // Update spike disk
        this.spikeDisk.update();
        
        // Handle ball-to-ball collisions
        this.handleBallCollisions();
        
        // Handle spike disk collisions
        this.handleSpikeCollisions();
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground line
        this.ctx.strokeStyle = '#4682B4';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 1);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 1);
        this.ctx.stroke();
        
        // Draw all balls
        this.balls.forEach(ball => ball.draw(this.ctx, this.canvas));
        
        // Draw spike disk
        this.spikeDisk.draw(this.ctx);
        
        // Draw mouse cursor effect
        if (this.mouseX > 0 && this.mouseY > 0) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 30, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    reset() {
        this.balls = [];
        this.jumpCount = 0;
        this.ballsDestroyed = 0;
        this.init();
    }
    
    updateUI() {
        document.getElementById('ballCount').textContent = this.balls.length;
        document.getElementById('jumpCount').textContent = this.jumpCount;
        document.getElementById('destroyedCount').textContent = this.ballsDestroyed;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
