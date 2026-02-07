
(function(){
  const canvas = document.getElementById('conceptCanvas');
  if(!canvas) return;
  const links = JSON.parse(canvas.getAttribute('data-nodes') || '[]');

  const ctx = canvas.getContext('2d');
  function size(){
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {w: rect.width, h: rect.height};
  }

  function col(name){
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || '#fff';
  }

  let nodes = [];
  function layout(){
    const {w,h} = size();
    const cx = w/2, cy = h/2;
    const r = Math.min(w,h) * 0.34;
    nodes = links.map((n,i)=>{
      const a = (-Math.PI/2) + (i/links.length)*Math.PI*2;
      const jitter = (Math.sin(i*3.1)+Math.cos(i*1.7))*0.03;
      return {
        ...n,
        x: cx + Math.cos(a)*(r*(1+jitter)),
        y: cy + Math.sin(a)*(r*(1+jitter)),
        vx: 0, vy: 0
      };
    });

    // simple relaxation to avoid overlaps
    for(let iter=0; iter<90; iter++){
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a = nodes[i], b = nodes[j];
          const dx = a.x-b.x, dy = a.y-b.y;
          const dist = Math.sqrt(dx*dx+dy*dy) || 1;
          const min = 44;
          if(dist < min){
            const push = (min - dist) / dist * 0.5;
            a.x += dx*push; a.y += dy*push;
            b.x -= dx*push; b.y -= dy*push;
          }
        }
      }
    }
  }

  function draw(mouse){
    const {w,h} = size();
    ctx.clearRect(0,0,w,h);

    // glow
    ctx.save();
    const grad = ctx.createRadialGradient(w*0.25,h*0.25, 0, w*0.25,h*0.25, Math.min(w,h)*0.7);
    grad.addColorStop(0, 'rgba(124,92,255,.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    ctx.restore();

    // edges (a few thematic)
    const edges = [
      [1,5],[5,6],[6,7],[7,8],[8,9], // replication->partition->txn->trouble->consensus
      [3,4],[4,5], // storage->encoding->replication
      [10,11],[11,12], // batch->stream->future
      [2,3] // models->storage
    ].map(([a,b])=>[a-1,b-1]).filter(([a,b])=>nodes[a]&&nodes[b]);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    edges.forEach(([a,b],i)=>{
      const A = nodes[a], B = nodes[b];
      ctx.strokeStyle = (i%2===0) ? col('--accent2') : col('--accent');
      ctx.beginPath();
      ctx.moveTo(A.x,A.y);
      ctx.lineTo(B.x,B.y);
      ctx.stroke();
    });
    ctx.restore();

    // nodes
    let hover = null;
    nodes.forEach((n,i)=>{
      const dx = mouse ? n.x-mouse.x : 1e9;
      const dy = mouse ? n.y-mouse.y : 1e9;
      const d = Math.sqrt(dx*dx+dy*dy);
      const isHover = mouse && d < 18;
      if(isHover) hover = n;

      ctx.save();
      ctx.globalAlpha = 1;
      // halo
      ctx.fillStyle = isHover ? 'rgba(0,215,255,.35)' : 'rgba(124,92,255,.25)';
      ctx.beginPath();
      ctx.arc(n.x,n.y, isHover? 18:14, 0, Math.PI*2);
      ctx.fill();

      // core
      ctx.fillStyle = isHover ? col('--accent2') : col('--accent');
      ctx.beginPath();
      ctx.arc(n.x,n.y, 7, 0, Math.PI*2);
      ctx.fill();

      // label
      ctx.fillStyle = col('--text');
      ctx.globalAlpha = isHover ? 1 : 0.78;
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText(n.short, n.x+12, n.y+4);
      ctx.restore();
    });

    // tooltip
    const tip = document.getElementById('mapTip');
    if(tip){
      if(hover){
        tip.style.opacity = 1;
        tip.innerHTML = `<strong>${hover.title}</strong><br><span>${hover.hint}</span>`;
      }else{
        tip.style.opacity = 0;
      }
    }

    return hover;
  }

  let mouse = null;
  let lastHover = null;
  function loop(){
    lastHover = draw(mouse);
    requestAnimationFrame(loop);
  }

  function toLocal(e){
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('mousemove', (e)=>{ mouse = toLocal(e); });
  canvas.addEventListener('mouseleave', ()=>{ mouse = null; });
  canvas.addEventListener('click', ()=>{
    if(lastHover && lastHover.href){
      window.location.href = lastHover.href;
    }
  });

  window.addEventListener('resize', layout);

  layout();
  loop();
})();
