const GRADE_COLOR = {
  '노말':   { bg:'#F1EFE8', border:'#B4B2A9', text:'#444441', glow:'rgba(180,178,169,0.4)', particle:['#B4B2A9','#D3D1C7','#888780'] },
  '레어':   { bg:'#E6F1FB', border:'#378ADD', text:'#0C447C', glow:'rgba(55,138,221,0.6)', particle:['#378ADD','#85B7EB','#B5D4F4'] },
  '에픽':   { bg:'#EEEDFE', border:'#7F77DD', text:'#3C3489', glow:'rgba(127,119,221,0.7)', particle:['#7F77DD','#AFA9EC','#CECBF6','#534AB7'] },
  '레전드': { bg:'#FAEEDA', border:'#BA7517', text:'#412402', glow:'rgba(186,117,23,0.8)', particle:['#BA7517','#EF9F27','#FAC775','#FFD700','#fff'] },
};

function cowImgEl(cardId, size=80) {
  const img = document.createElement('img');
  img.src = `/images/cards/${String(cardId).padStart(3,'0')}.png`;
  img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;`;
  img.onerror = () => { img.style.display='none'; };
  return img;
}

// CSS 주입
const gStyle = document.createElement('style');
gStyle.textContent = `
@keyframes cowBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes squirt{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-160%) scale(.2)}}
@keyframes cardReveal{0%{opacity:0;transform:scale(0.2) rotateY(180deg)}50%{opacity:1;transform:scale(1.1) rotateY(-8deg)}75%{transform:scale(0.96) rotateY(3deg)}100%{opacity:1;transform:scale(1) rotateY(0)}}
@keyframes cowSpin{0%{transform:rotate(0deg) scale(1)}25%{transform:rotate(90deg) scale(1.1)}50%{transform:rotate(180deg) scale(0.9)}75%{transform:rotate(270deg) scale(1.1)}100%{transform:rotate(360deg) scale(1)}}
@keyframes cowWiggle{0%,100%{transform:rotate(0deg) scale(1)}15%{transform:rotate(-8deg) scale(1.05)}30%{transform:rotate(8deg) scale(1.05)}45%{transform:rotate(-5deg) scale(1.02)}60%{transform:rotate(5deg) scale(1.02)}75%{transform:rotate(-2deg)}85%{transform:rotate(2deg)}}
@keyframes cowFloat{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-14px) rotate(-3deg)}75%{transform:translateY(-7px) rotate(3deg)}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px var(--gc,transparent)}50%{box-shadow:0 0 60px var(--gc,transparent),0 0 100px var(--gc,transparent)}}
@keyframes ptFly{0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0)}}
@keyframes starPop{0%{opacity:0;transform:scale(0) rotate(0)}40%{opacity:1;transform:scale(1.4) rotate(180deg)}100%{opacity:0;transform:scale(.7) rotate(400deg) translateY(-20px)}}
@keyframes descFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes legendShine{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes cowJump{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-22px) scale(1.06)}60%{transform:translateY(-8px) scale(0.96)}}
`;
document.head.appendChild(gStyle);

function spawnParticles(container, grade) {
  const col = GRADE_COLOR[grade] || GRADE_COLOR['노말'];
  const count = grade==='레전드'?60:grade==='에픽'?42:grade==='레어'?28:14;
  for (let i=0;i<count;i++) {
    const p = document.createElement('div');
    const sz = 4+Math.random()*10;
    const angle = Math.random()*360;
    const dist = 80+Math.random()*200;
    const color = col.particle[Math.floor(Math.random()*col.particle.length)];
    p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${color};border-radius:${Math.random()>.5?'50%':'3px'};left:50%;top:40%;pointer-events:none;z-index:20;animation:ptFly ${.5+Math.random()*.8}s ease-out ${Math.random()*.3}s forwards;--tx:${Math.cos(angle*Math.PI/180)*dist}px;--ty:${Math.sin(angle*Math.PI/180)*dist}px;`;
    container.appendChild(p);
    setTimeout(()=>p.remove(), 1400);
  }
  if (grade==='레전드'||grade==='에픽') {
    const cnt = grade==='레전드'?14:7;
    for (let i=0;i<cnt;i++) {
      const s = document.createElement('div');
      s.textContent = grade==='레전드'?'★':'✦';
      s.style.cssText = `position:absolute;font-size:${12+Math.random()*18}px;color:${grade==='레전드'?'#FFD700':'#AFA9EC'};left:${5+Math.random()*90}%;top:${5+Math.random()*70}%;pointer-events:none;z-index:21;animation:starPop ${.6+Math.random()*.7}s ease-out ${Math.random()*.5}s both;`;
      container.appendChild(s);
      setTimeout(()=>s.remove(), 1600);
    }
  }
}

class GachaScene {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    this.clicks = 0;
    this.maxClicks = 10;
    this.done = false;
    this.pendingCards = [];
    this.currentIdx = 0;
    this.onDone = null;
    this._build();
  }

  _build() {
    this.el.innerHTML = `
    <div id="gs-stage" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;">
      <div id="gs-progress" style="font-size:13px;color:var(--text-sub);font-weight:500;"></div>

      <!-- 젖소 클릭 영역 -->
      <div id="gs-cow-wrap" style="position:relative;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;gap:6px;" onclick="gachaScene._squeeze(event)">
        <div id="gs-cow-emoji" style="font-size:130px;line-height:1;animation:cowBob 1.8s ease-in-out infinite;transition:transform .1s;display:block;">🐄</div>
        <div style="font-size:13px;color:var(--text-sub);font-weight:500;">꾹 눌러서 젖을 짜세요!</div>
      </div>

      <!-- 우유통 -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="position:relative;width:80px;height:130px;">
          <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:30px;height:14px;background:#378ADD;border-radius:4px 4px 0 0;"></div>
          <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);width:24px;height:16px;border:2.5px solid #85B7EB;border-top:none;background:#fff;border-radius:0 0 4px 4px;"></div>
          <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:60px;height:100px;border:2.5px solid #85B7EB;border-radius:6px 6px 12px 12px;background:#fff;overflow:hidden;">
            <div id="gs-milk" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:#E6F1FB;transition:height .25s cubic-bezier(.34,1.56,.64,1);border-radius:0 0 9px 9px;">
              <div style="position:absolute;top:0;left:0;right:0;height:4px;background:#B5D4F4;border-radius:2px;"></div>
            </div>
          </div>
        </div>
        <div id="gs-pct" style="font-size:15px;font-weight:600;color:#185FA5;">0%</div>
        <div id="gs-count" style="font-size:12px;color:var(--text-sub);">0 / 10</div>
      </div>

      <!-- 카드 공개 영역 -->
      <div id="gs-card-area" style="position:relative;width:220px;height:290px;border-radius:20px;border:2px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <span style="font-size:64px;opacity:.15;">?</span>
      </div>

      <button id="gs-next" class="btn btn-primary btn-full" style="display:none;font-size:15px;padding:13px;"></button>
    </div>

    <!-- 10연속 결과 -->
    <div id="gs-multi" style="display:none;padding:16px;">
      <div style="text-align:center;font-size:17px;font-weight:700;margin-bottom:16px;">🎉 10연속 뽑기 결과!</div>
      <div id="gs-multi-grid" class="grid-3" style="gap:10px;"></div>
      <button class="btn btn-primary btn-full" style="margin-top:20px;padding:13px;" onclick="gachaScene.onDone && gachaScene.onDone()">농장으로 이동 🏠</button>
    </div>`;
  }

  _squeeze(e) {
    if (this.done) return;
    this.clicks = Math.min(this.clicks+1, this.maxClicks);
    const pct = Math.round((this.clicks/this.maxClicks)*100);
    document.getElementById('gs-milk').style.height = pct+'%';
    document.getElementById('gs-pct').textContent = pct+'%';
    document.getElementById('gs-count').textContent = `${this.clicks} / ${this.maxClicks}`;

    const cow = document.getElementById('gs-cow-emoji');
    cow.style.transform = 'scale(0.86)';
    setTimeout(()=>{ cow.style.transform=''; }, 130);

    const drop = document.createElement('div');
    drop.textContent = '💧';
    drop.style.cssText = `position:absolute;font-size:20px;pointer-events:none;left:${20+Math.random()*60}%;top:${35+Math.random()*25}%;animation:squirt .5s ease forwards;`;
    document.getElementById('gs-cow-wrap').appendChild(drop);
    setTimeout(()=>drop.remove(), 500);

    if (this.clicks >= this.maxClicks) this._reveal();
  }

  _reveal() {
    this.done = true;
    document.getElementById('gs-pct').textContent = '완료! 🎉';
    document.getElementById('gs-pct').style.color = '#27500A';

    // 젖소 점프
    const cow = document.getElementById('gs-cow-emoji');
    cow.style.animation = 'cowJump 0.6s ease forwards';

    setTimeout(()=>{
      const card = this.pendingCards[this.currentIdx];
      if (!card) return;
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const area = document.getElementById('gs-card-area');

      // 카드 영역 꽉 차게
      area.style.cssText = `position:relative;width:220px;height:290px;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;--gc:${col.glow};animation:cardReveal .7s ease forwards, glowPulse 2s ease-in-out .7s infinite;`;

      if (card.grade === '레전드') {
        area.style.background = `${col.bg}`;
        area.style.border = '3px solid transparent';
        area.style.backgroundImage = `linear-gradient(${col.bg},${col.bg}),linear-gradient(135deg,#FFD700 0%,#EF9F27 25%,#FFD700 50%,#BA7517 75%,#FFD700 100%)`;
        area.style.backgroundOrigin = 'border-box';
        area.style.backgroundClip = 'padding-box,border-box';
        area.style.backgroundSize = 'auto,300% auto';
        area.style.animation = `cardReveal .7s ease forwards, glowPulse 1.2s ease-in-out .7s infinite, legendShine 2s linear .7s infinite`;
      } else {
        area.style.background = col.bg;
        area.style.border = `3px solid ${col.border}`;
      }

      area.innerHTML = '';

      // 파티클
      spawnParticles(area, card.grade);

      // 젖소 이미지 — 크게 (카드 거의 꽉 차게)
      const imgWrap = document.createElement('div');
      imgWrap.style.cssText = `position:relative;animation:cowSpin .8s ease .7s, cowFloat 3s ease-in-out 1.5s infinite;`;
      const cowImg = document.createElement('img');
      cowImg.src = `/images/cards/${String(card.id).padStart(3,'0')}.png`;
      cowImg.style.cssText = `width:180px;height:180px;object-fit:contain;`;
      cowImg.onerror = ()=>{ cowImg.style.display='none'; };
      imgWrap.appendChild(cowImg);
      area.appendChild(imgWrap);

      // 이름
      const nameEl = document.createElement('div');
      nameEl.style.cssText = `font-size:14px;font-weight:700;color:${col.text};text-align:center;padding:0 10px;line-height:1.3;animation:descFadeIn .4s ease .6s both;`;
      nameEl.textContent = card.name;
      area.appendChild(nameEl);

      // 등급 뱃지
      const badge = document.createElement('span');
      badge.style.cssText = `font-size:12px;padding:3px 12px;border-radius:20px;background:${col.border};color:#fff;font-weight:700;animation:descFadeIn .4s ease .7s both;`;
      badge.textContent = card.grade;
      area.appendChild(badge);

      // 다음 버튼
      const nextBtn = document.getElementById('gs-next');
      if (!nextBtn) return;
      const isLast = this.currentIdx >= this.pendingCards.length-1;
      if (this.pendingCards.length === 1) {
        nextBtn.textContent = '확인 →';
        nextBtn.style.display = 'block';
        nextBtn.style.animation = 'fadeInUp .4s ease .6s both';
        const _cb = this.onDone;
        nextBtn.onclick = ()=>{ if(_cb) _cb(); };
      } else {
        nextBtn.textContent = isLast ? '✨ 전체 결과 보기' : `다음 카드 (${this.currentIdx+2}/${this.pendingCards.length}) →`;
        nextBtn.style.display = 'block';
        nextBtn.style.animation = 'fadeInUp .4s ease .6s both';
        nextBtn.onclick = ()=> isLast ? this._showMultiResult() : this._nextCard();
      }
    }, 350);
  }

  _nextCard() {
    this.currentIdx++;
    this.clicks = 0;
    this.done = false;
    const milk = document.getElementById('gs-milk');
    if (milk) { milk.style.transition='none'; milk.style.height='0%'; setTimeout(()=>{ milk.style.transition='height .25s cubic-bezier(.34,1.56,.64,1)'; },50); }
    document.getElementById('gs-pct').textContent = '0%';
    document.getElementById('gs-pct').style.color = '#185FA5';
    document.getElementById('gs-count').textContent = `0 / 10`;
    document.getElementById('gs-next').style.display = 'none';
    const cow = document.getElementById('gs-cow-emoji');
    if (cow) cow.style.animation = 'cowBob 1.8s ease-in-out infinite';
    const area = document.getElementById('gs-card-area');
    area.style.cssText = `position:relative;width:220px;height:290px;border-radius:20px;border:2px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;overflow:hidden;`;
    area.innerHTML = '<span style="font-size:64px;opacity:.15;">?</span>';
    const prog = document.getElementById('gs-progress');
    if (prog) prog.textContent = `${this.currentIdx+1} / ${this.pendingCards.length}`;
  }

  _showMultiResult() {
    document.getElementById('gs-stage').style.display = 'none';
    document.getElementById('gs-multi').style.display = 'block';
    const grid = document.getElementById('gs-multi-grid');
    grid.innerHTML = '';
    this.pendingCards.forEach(card => {
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const item = document.createElement('div');
      item.style.cssText = `background:${col.bg};border:2px solid ${col.border};border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;`;
      const img = document.createElement('img');
      img.src = `/images/cards/${String(card.id).padStart(3,'0')}.png`;
      img.style.cssText = 'width:70px;height:70px;object-fit:contain;';
      img.onerror = ()=>img.style.display='none';
      item.appendChild(img);
      const n = document.createElement('div');
      n.style.cssText = `font-size:10px;font-weight:600;color:${col.text};text-align:center;`;
      n.textContent = card.name;
      const b = document.createElement('span');
      b.style.cssText = `font-size:9px;padding:2px 7px;border-radius:20px;background:${col.border};color:#fff;font-weight:600;`;
      b.textContent = card.grade;
      item.appendChild(n);
      item.appendChild(b);
      grid.appendChild(item);
    });
  }

  startSingle(card, onDone) {
    this.pendingCards = [card];
    this.currentIdx = 0;
    this.onDone = onDone;
    this.clicks = 0;
    this.done = false;
    this._build();
  }

  startMulti(cards, onDone) {
    this.pendingCards = cards;
    this.currentIdx = 0;
    this.onDone = onDone;
    this.clicks = 0;
    this.done = false;
    this._build();
    const prog = document.getElementById('gs-progress');
    if (prog) prog.textContent = `1 / ${cards.length}`;
  }
}

let gachaScene;
