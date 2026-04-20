const GRADE_COLOR = {
  '노말':   { bg:'#F1EFE8', border:'#B4B2A9', text:'#444441', glow:'rgba(180,178,169,0.4)' },
  '레어':   { bg:'#E6F1FB', border:'#378ADD', text:'#0C447C', glow:'rgba(55,138,221,0.5)' },
  '에픽':   { bg:'#EEEDFE', border:'#7F77DD', text:'#3C3489', glow:'rgba(127,119,221,0.6)' },
  '레전드': { bg:'#FAEEDA', border:'#BA7517', text:'#412402', glow:'rgba(186,117,23,0.7)' },
};

const GRADE_PARTICLES = {
  '노말':   ['#B4B2A9','#D3D1C7','#888780'],
  '레어':   ['#378ADD','#85B7EB','#B5D4F4'],
  '에픽':   ['#7F77DD','#AFA9EC','#CECBF6'],
  '레전드': ['#BA7517','#EF9F27','#FAC775','#FFD700'],
};

function cowImgEl(cardId, size=80) {
  const img = document.createElement('img');
  img.src = `/images/cards/${String(cardId).padStart(3,'0')}.png`;
  img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;`;
  img.onerror = () => { img.style.display='none'; };
  return img;
}

function spawnParticles(container, grade) {
  const colors = GRADE_PARTICLES[grade] || GRADE_PARTICLES['노말'];
  const count = grade === '레전드' ? 40 : grade === '에픽' ? 28 : grade === '레어' ? 20 : 12;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = 4 + Math.random() * 8;
    const angle = Math.random() * 360;
    const dist = 60 + Math.random() * 120;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isCircle = Math.random() > 0.5;
    p.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      background:${color};border-radius:${isCircle?'50%':'2px'};
      left:50%;top:50%;transform:translate(-50%,-50%);
      pointer-events:none;z-index:20;
      animation:particle-fly ${0.6+Math.random()*0.6}s ease-out ${Math.random()*0.2}s forwards;
      --tx:${Math.cos(angle*Math.PI/180)*dist}px;
      --ty:${Math.sin(angle*Math.PI/180)*dist}px;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

function spawnStars(container, grade) {
  if (grade !== '레전드' && grade !== '에픽') return;
  const count = grade === '레전드' ? 8 : 4;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.textContent = '★';
    s.style.cssText = `
      position:absolute;font-size:${14+Math.random()*12}px;
      color:${grade==='레전드'?'#FFD700':'#7F77DD'};
      left:${10+Math.random()*80}%;top:${5+Math.random()*60}%;
      pointer-events:none;z-index:20;
      animation:star-pop ${0.5+Math.random()*0.5}s ease-out ${Math.random()*0.4}s both;
    `;
    container.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
}

const gachaStyle = document.createElement('style');
gachaStyle.textContent = `
@keyframes cowBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes squirt{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-150%) scale(.3)}}
@keyframes cardReveal{
  0%{opacity:0;transform:scale(0.3) rotateY(180deg)}
  50%{opacity:1;transform:scale(1.15) rotateY(-8deg)}
  75%{transform:scale(0.95) rotateY(3deg)}
  100%{opacity:1;transform:scale(1) rotateY(0)}
}
@keyframes glowPulse{
  0%,100%{box-shadow:0 0 20px var(--glow-color,transparent)}
  50%{box-shadow:0 0 45px var(--glow-color,transparent),0 0 80px var(--glow-color,transparent)}
}
@keyframes particle-fly{
  0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}
  100%{opacity:0;transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0)}
}
@keyframes star-pop{
  0%{opacity:0;transform:scale(0) rotate(0deg)}
  50%{opacity:1;transform:scale(1.4) rotate(180deg)}
  100%{opacity:0;transform:scale(0.8) rotate(360deg)}
}
@keyframes legendShine{
  0%{background-position:200% center}
  100%{background-position:-200% center}
}
@keyframes bottleFill{from{height:0%}to{height:100%}}
@keyframes cowJump{
  0%,100%{transform:translateY(0) scale(1)}
  30%{transform:translateY(-20px) scale(1.05)}
  60%{transform:translateY(-8px) scale(0.97)}
}
@keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
`;
document.head.appendChild(gachaStyle);

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
      <div style="width:100%;display:flex;justify-content:flex-end;">
        <button id="gs-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-sub);padding:0;line-height:1;" onclick="if(gachaScene&&gachaScene.onDone)gachaScene.onDone();">✕</button>
      </div>
      <div id="gs-progress" style="font-size:13px;color:var(--text-sub);font-weight:500;"></div>

      <!-- 젖소 (클릭 영역) -->
      <div id="gs-cow-wrap" style="position:relative;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;gap:6px;" onclick="gachaScene._squeeze(event)">
        <div id="gs-cow-emoji" style="font-size:120px;line-height:1;animation:cowBob 1.8s ease-in-out infinite;transition:transform .1s;">🐄</div>
        <div style="font-size:13px;color:var(--text-sub);font-weight:500;">꾹 눌러서 젖을 짜세요!</div>
      </div>

      <!-- 우유통 (더 크게) -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div id="gs-bottle-wrap" style="position:relative;width:80px;height:130px;">
          <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);width:30px;height:14px;background:#378ADD;border-radius:4px 4px 0 0;"></div>
          <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);width:24px;height:16px;border:2.5px solid #85B7EB;border-top:none;background:#fff;border-radius:0 0 4px 4px;"></div>
          <div id="gs-bottle" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:60px;height:100px;border:2.5px solid #85B7EB;border-radius:6px 6px 12px 12px;background:#fff;overflow:hidden;">
            <div id="gs-milk" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:#E6F1FB;transition:height .25s cubic-bezier(.34,1.56,.64,1);border-radius:0 0 9px 9px;">
              <div style="position:absolute;top:0;left:0;right:0;height:4px;background:#B5D4F4;border-radius:2px;"></div>
            </div>
          </div>
        </div>
        <div id="gs-pct" style="font-size:15px;font-weight:600;color:#185FA5;">0%</div>
        <div id="gs-count" style="font-size:12px;color:var(--text-sub);">0 / 10</div>
      </div>

      <!-- 카드 공개 영역 (더 크게) -->
      <div id="gs-card-area" style="position:relative;width:260px;height:340px;border-radius:20px;border:2px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;">
        <span style="font-size:80px;opacity:.2;">?</span>
      </div>

      <button id="gs-next" class="btn btn-primary btn-full" style="display:none;font-size:15px;padding:12px;"></button>
    </div>

    <!-- 10연속 결과 -->
    <div id="gs-multi" style="display:none;padding:16px;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
        <button style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-sub);padding:0;line-height:1;" onclick="if(gachaScene&&gachaScene.onDone)gachaScene.onDone();">✕</button>
      </div>
      <div style="text-align:center;font-size:17px;font-weight:700;margin-bottom:16px;">🎉 10연속 뽑기 결과!</div>
      <div id="gs-multi-grid" class="grid-3" style="gap:10px;"></div>
      <button class="btn btn-primary btn-full" style="margin-top:20px;padding:12px;" onclick="gachaScene.onDone && gachaScene.onDone()">농장으로 이동</button>
    </div>`;
  }

  _squeeze(e) {
    if (this.done) return;
    this.clicks = Math.min(this.clicks + 1, this.maxClicks);
    const pct = Math.round((this.clicks / this.maxClicks) * 100);
    document.getElementById('gs-milk').style.height = pct + '%';
    document.getElementById('gs-pct').textContent = pct + '%';
    document.getElementById('gs-count').textContent = `${this.clicks} / ${this.maxClicks}`;

    // 젖소 눌리는 이펙트
    const cow = document.getElementById('gs-cow-emoji');
    cow.style.transform = 'scale(0.88)';
    setTimeout(() => cow.style.transform = '', 120);

    // 물방울
    const drop = document.createElement('div');
    drop.textContent = '💧';
    drop.style.cssText = `position:absolute;font-size:18px;pointer-events:none;left:${25+Math.random()*50}%;top:${40+Math.random()*20}%;animation:squirt .5s ease forwards;`;
    document.getElementById('gs-cow-wrap').appendChild(drop);
    setTimeout(() => drop.remove(), 500);

    if (this.clicks >= this.maxClicks) this._reveal();
  }

  _reveal() {
    this.done = true;
    document.getElementById('gs-pct').textContent = '완료! 🎉';
    document.getElementById('gs-pct').style.color = '#27500A';

    // 젖소 점프
    const cow = document.getElementById('gs-cow-emoji');
    cow.style.animation = 'cowJump 0.6s ease forwards';

    setTimeout(() => {
      const card = this.pendingCards[this.currentIdx];
      if (!card) return;
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const area = document.getElementById('gs-card-area');

      // 카드 공개 애니메이션
      area.style.cssText = `
        position:relative;width:160px;height:210px;border-radius:16px;
        border:3px solid ${col.border};background:${col.bg};
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        animation:cardReveal .6s ease forwards;
        --glow-color:${col.glow};
      `;

      // 레전드는 반짝이는 테두리
      if (card.grade === '레전드') {
        area.style.border = '3px solid transparent';
        area.style.backgroundImage = `linear-gradient(${col.bg},${col.bg}),linear-gradient(135deg,#FFD700,#EF9F27,#FFD700,#BA7517,#FFD700)`;
        area.style.backgroundOrigin = 'border-box';
        area.style.backgroundClip = 'padding-box,border-box';
        area.style.animation = `cardReveal .6s ease forwards, glowPulse 1.5s ease-in-out 0.6s infinite`;
      } else {
        area.style.animation = `cardReveal .6s ease forwards, glowPulse 2s ease-in-out 0.6s infinite`;
      }

      area.innerHTML = '';

      // 이미지 (크게)
      const imgWrap = document.createElement('div');
      imgWrap.style.cssText = `position:relative;`;
      const cowImg = cowImgEl(card.id, 200);
      imgWrap.appendChild(cowImg);
      area.appendChild(imgWrap);

      const name = document.createElement('div');
      name.style.cssText = `font-size:16px;font-weight:700;color:${col.text};text-align:center;padding:0 8px;line-height:1.3;`;
      name.textContent = card.name;

      const badge = document.createElement('span');
      badge.style.cssText = `font-size:13px;padding:4px 14px;border-radius:20px;background:${col.bg};color:${col.text};border:1.5px solid ${col.border};font-weight:600;`;
      badge.textContent = card.grade;

      area.appendChild(name);
      area.appendChild(badge);

      // 파티클 + 별 이펙트
      spawnParticles(area, card.grade);
      spawnStars(document.getElementById('gs-stage'), card.grade);

      // 다음 버튼
      const nextBtn = document.getElementById('gs-next');
      if (!nextBtn) return;
      const isLast = this.currentIdx >= this.pendingCards.length - 1;
      if (this.pendingCards.length === 1) {
        nextBtn.textContent = '확인 →';
        nextBtn.style.display = 'block';
        nextBtn.style.animation = 'fadeInUp .4s ease .5s both';
        const _cb = this.onDone;
        nextBtn.onclick = () => { if(_cb) _cb(); };
      } else {
        nextBtn.textContent = isLast ? '✨ 전체 결과 보기' : `다음 카드 (${this.currentIdx+2}/${this.pendingCards.length}) →`;
        nextBtn.style.display = 'block';
        nextBtn.style.animation = 'fadeInUp .4s ease .5s both';
        nextBtn.onclick = () => isLast ? this._showMultiResult() : this._nextCard();
      }
    }, 400);
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
    area.style.cssText = `position:relative;width:260px;height:340px;border-radius:20px;border:2px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;`;
    area.innerHTML = '<span style="font-size:80px;opacity:.2;">?</span>';
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
      item.appendChild(cowImgEl(card.id, 90));
      item.innerHTML += `<div style="font-size:10px;font-weight:600;color:${col.text};text-align:center;">${card.name}</div><span style="font-size:9px;padding:2px 6px;border-radius:20px;background:${col.bg};color:${col.text};border:1px solid ${col.border};font-weight:600;">${card.grade}</span>`;
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
    // 단일 뽑기: gs-next "확인" 버튼 → onDone 직접 호출
    // _reveal() 내부에서 pendingCards.length===1 이면 onDone 연결됨
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
