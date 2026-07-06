(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'constellation-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let bursts = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let lastTime = 0;
  let rafId = null;
  let resizeTimer = null;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initParticles();
  }

  function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }

  function initParticles() {
    const isMobile = width < 768;
    const count = isMobile ? 35 : 70;
    particles = [];

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(true));
    }
  }

  function createParticle(randomY = false) {
    const speed = random(0.2, 0.5);
    const angle = random(-Math.PI / 2 - 0.35, -Math.PI / 2 + 0.35);

    return {
      x: random(0, width),
      y: randomY ? random(0, height) : height + 10,
      baseVX: Math.cos(angle) * speed,
      baseVY: Math.sin(angle) * speed,
      repelVX: 0,
      repelVY: 0,
      size: random(1, 3),
      opacity: random(0.2, 0.6),
    };
  }

  function spawnBurst(x, y) {
    const count = Math.floor(random(5, 9));
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1.2, 2.4);
      bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: random(1.5, 2.5),
      });
    }
  }

  function updateParticle(p, dt) {
    // Idle drift
    p.x += p.baseVX * dt;
    p.y += p.baseVY * dt;

    // Mouse repulsion
    if (mouse.active) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const radius = 120;

      if (dist < radius && dist > 0) {
        const force = ((radius - dist) / radius) * 0.9;
        p.repelVX += (dx / dist) * force;
        p.repelVY += (dy / dist) * force;
      }
    }

    // Apply repulsion velocity and dampen it back toward zero
    p.x += p.repelVX * dt;
    p.y += p.repelVY * dt;
    p.repelVX *= 0.94;
    p.repelVY *= 0.94;

    // Wrap around edges
    if (p.y < -10) {
      p.y = height + 10;
      p.x = random(0, width);
    } else if (p.y > height + 10) {
      p.y = -10;
      p.x = random(0, width);
    }

    if (p.x < -10) {
      p.x = width + 10;
    } else if (p.x > width + 10) {
      p.x = -10;
    }
  }

  function updateBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt / 60; // 1 second at ~60fps
      if (b.life <= 0) {
        bursts.splice(i, 1);
      }
    }
  }

  function getParticleColor() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    return isDark ? '255, 255, 255' : '18, 18, 18';
  }

  function drawParticles() {
    const color = getParticleColor();
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
      ctx.fill();
    }
  }

  function drawConnections() {
    const maxDist = 100;
    const color = getParticleColor();
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${color}, ${alpha})`;
          ctx.stroke();
        }
      }
    }
  }

  function drawBursts() {
    const color = getParticleColor();
    for (const b of bursts) {
      const alpha = Math.max(0, b.life);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.fill();
    }
  }

  function loop(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
      rafId = requestAnimationFrame(loop);
      return;
    }
    const dt = (timestamp - lastTime) / 16.667;
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      updateParticle(p, dt);
    }

    updateBursts(dt);
    drawConnections();
    drawParticles();
    drawBursts();

    rafId = requestAnimationFrame(loop);
  }

  // Mouse tracking
  hero.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  hero.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button, [role="button"]')) return;
    const rect = canvas.getBoundingClientRect();
    spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
  });

  window.addEventListener('resize', debouncedResize);

  resize();
  rafId = requestAnimationFrame(loop);
})();
