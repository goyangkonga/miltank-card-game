const GRADE_COLOR = {
  '노말':   { bg:'#F1EFE8', border:'#B4B2A9', text:'#444441', glow:'rgba(180,178,169,0.5)', particle:['#B4B2A9','#D3D1C7','#888780'] },
  '레어':   { bg:'#E6F1FB', border:'#378ADD', text:'#0C447C', glow:'rgba(55,138,221,0.7)', particle:['#378ADD','#85B7EB','#B5D4F4','#fff'] },
  '에픽':   { bg:'#EEEDFE', border:'#7F77DD', text:'#3C3489', glow:'rgba(127,119,221,0.8)', particle:['#7F77DD','#AFA9EC','#CECBF6','#534AB7','#fff'] },
  '레전드': { bg:'#1a0a00', border:'#FFD700', text:'#FFD700', glow:'rgba(255,215,0,0.9)',  particle:['#FFD700','#EF9F27','#FAC775','#fff','#FFD700','#FFF176'] },
};

const gStyle = document.createElement('style');
gStyle.textContent = `
@keyframes cowBob    {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes squirt    {0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-180%) scale(.2)}}
@keyframes cowJump   {0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-24px) scale(1.07)}60%{transform:translateY(-8px) scale(0.95)}}
@keyframes popIn     {0%{opacity:0;transform:scale(0.2) rotateY(180deg)}50%{opacity:1;transform:scale(1.06) rotateY(-6deg)}75%{transform:scale(0.97) rotateY(2deg)}100%{opacity:1;transform:scale(1) rotateY(0)}}
@keyframes cowSpin   {0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes cowBounce {0%,100%{transform:translateY(0) scaleX(1)}20%{transform:translateY(-18px) scaleX(1.05) rotate(-2deg)}40%{transform:translateY(2px) scaleX(0.95)}60%{transform:translateY(-12px) scaleX(1.03) rotate(2deg)}80%{transform:translateY(1px) scaleX(0.97)}}
@keyframes glowPulse {0%,100%{box-shadow:0 0 30px var(--gc,transparent),0 0 60px var(--gc,transparent)}50%{box-shadow:0 0 70px var(--gc,transparent),0 0 140px var(--gc,transparent),0 0 200px var(--gc,transparent)}}
@keyframes legendShine{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes ptFly     {0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0) rotate(var(--rot,360deg))}}
@keyframes starPop   {0%{opacity:0;transform:scale(0) rotate(0)}40%{opacity:1;transform:scale(1.5) rotate(180deg)}100%{opacity:0;transform:scale(.5) rotate(400deg) translateY(-30px)}}
@keyframes descFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes overlayIn {from{opacity:0}to{opacity:1}}
@keyframes groundShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes gradeFlash{0%,100%{opacity:1}50%{opacity:0.4}}
`;
document.head.appendChild(gStyle);

// ── 파티클 ──
function spawnParticles(container, grade) {
  const col = GRADE_COLOR[grade] || GRADE_COLOR['노말'];
  const count = grade==='레전드'?90:grade==='에픽'?60:grade==='레어'?38:16;
  for (let i=0;i<count;i++) {
    const p = document.createElement('div');
    const sz = 5+Math.random()*14;
    const angle = Math.random()*360;
    const dist = 120+Math.random()*280;
    const color = col.particle[Math.floor(Math.random()*col.particle.length)];
    const rot = (Math.random()-0.5)*900;
    p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${color};
      border-radius:${Math.random()>.4?'50%':'3px'};left:50%;top:45%;pointer-events:none;z-index:10;
      animation:ptFly ${.5+Math.random()*1.1}s ease-out ${Math.random()*.45}s forwards;
      --tx:${Math.cos(angle*Math.PI/180)*dist}px;
      --ty:${Math.sin(angle*Math.PI/180)*dist}px;
      --rot:${rot}deg;`;
    container.appendChild(p);
    setTimeout(()=>p.remove(), 2000);
  }
  const starCnt = grade==='레전드'?24:grade==='에픽'?14:grade==='레어'?7:0;
  for (let i=0;i<starCnt;i++) {
    const s = document.createElement('div');
    s.textContent = grade==='레전드'?'★':'✦';
    s.style.cssText = `position:absolute;font-size:${14+Math.random()*24}px;
      color:${grade==='레전드'?'#FFD700':'#AFA9EC'};
      left:${5+Math.random()*90}%;top:${5+Math.random()*80}%;
      pointer-events:none;z-index:11;
      animation:starPop ${.7+Math.random()*.9}s ease-out ${Math.random()*.6}s both;`;
    container.appendChild(s);
    setTimeout(()=>s.remove(), 2200);
  }
}

// ── 전체화면 카드 공개 팝업 (단일 책임) ──
function showCardPopup(card, btnText, onNext) {
  // 기존 팝업 제거
  document.getElementById('card-popup-overlay')?.remove();

  const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
  const overlay = document.createElement('div');
  overlay.id = 'card-popup-overlay';

  const bgColor = card.grade==='레전드'?'rgba(10,6,0,0.97)':
                  card.grade==='에픽'  ?'rgba(8,5,24,0.96)':
                  card.grade==='레어'  ?'rgba(3,10,24,0.96)':'rgba(12,12,12,0.94)';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:500;
    background:${bgColor};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:16px;animation:overlayIn .3s ease;overflow:hidden;
  `;

  // 파티클 레이어
  const ptLayer = document.createElement('div');
  ptLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  overlay.appendChild(ptLayer);

  // 닫기
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;background:none;border:none;font-size:28px;color:rgba(255,255,255,.5);cursor:pointer;z-index:20;';
  closeBtn.onclick = () => { overlay.remove(); if(onNext) onNext(); };
  overlay.appendChild(closeBtn);

  // 이미지 — 화면 꽉 차게
  const imgEl = document.createElement('img');
  imgEl.src = `/images/cards/${String(card.id).padStart(3,'0')}.png`;
  imgEl.style.cssText = `
    width:min(88vw,420px);height:min(88vw,420px);
    object-fit:contain;
    animation:popIn .7s ease forwards;
    --gc:${col.glow};
    filter:drop-shadow(0 0 20px ${col.glow});
  `;
  imgEl.onerror = ()=>{ imgEl.textContent='🐄'; imgEl.style.fontSize='180px'; };
  // 팝업 후 빙글+쿵쿵
  setTimeout(()=>{
    imgEl.style.animation = `cowSpin .9s ease, cowBounce 1.3s ease-in-out .9s infinite`;
  }, 700);
  overlay.appendChild(imgEl);

  // 등급 뱃지
  const badge = document.createElement('div');
  badge.textContent = card.grade;
  badge.style.cssText = `
    font-size:15px;font-weight:800;padding:5px 20px;border-radius:20px;
    background:${col.border};color:${card.grade==='레전드'?'#1a0a00':'#fff'};
    margin-top:12px;
    animation:descFadeIn .4s ease .5s both;
    ${card.grade==='레전드'?`animation:gradeFlash 1s ease-in-out .5s infinite;`:''}
  `;
  overlay.appendChild(badge);

  // 이름
  const nameEl = document.createElement('div');
  nameEl.textContent = card.name;
  nameEl.style.cssText = `
    font-size:20px;font-weight:700;
    color:${card.grade==='레전드'?'#FFD700':'#fff'};
    text-align:center;margin-top:8px;
    animation:descFadeIn .4s ease .6s both;
  `;
  overlay.appendChild(nameEl);

  // 설명
  if (card.description) {
    const desc = document.createElement('div');
    desc.textContent = card.description;
    desc.style.cssText = `
      font-size:12px;color:rgba(255,255,255,.75);
      text-align:center;line-height:1.65;
      max-width:min(85vw,380px);margin-top:8px;
      animation:descFadeIn .4s ease .7s both;
    `;
    overlay.appendChild(desc);
  }

  // 다음 버튼
  const nextBtn = document.createElement('button');
  nextBtn.textContent = btnText;
  nextBtn.style.cssText = `
    margin-top:20px;padding:13px 36px;
    border-radius:12px;border:none;
    background:${col.border};
    color:${card.grade==='레전드'?'#1a0a00':'#fff'};
    font-size:16px;font-weight:700;cursor:pointer;
    animation:fadeInUp .4s ease .85s both;
    min-width:200px;
  `;
  nextBtn.onclick = () => { overlay.remove(); if(onNext) onNext(); };
  overlay.appendChild(nextBtn);

  document.body.appendChild(overlay);

  // 파티클 + 화면흔들기
  setTimeout(()=>{
    spawnParticles(ptLayer, card.grade);
    if (card.grade==='레전드'||card.grade==='에픽') {
      document.body.style.animation = 'groundShake .45s ease';
      setTimeout(()=>document.body.style.animation='', 450);
    }
  }, 150);

  // 레전드 glow 팝업 이후
  if (card.grade==='레전드') {
    setTimeout(()=>{
      overlay.style.cssText += `--gc:${col.glow};animation:overlayIn .3s ease, glowPulse 2s ease-in-out .7s infinite;`;
    }, 700);
  }
}

// ── GachaScene: 짜기만 담당, 완료 시 onDone(card) 호출 ──
class GachaScene {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    this.clicks = 0;
    this.maxClicks = 10;
    this.done = false;
    this.card = null;
    this.onDone = null;
    this._build();
  }

  _build() {
    this.el.innerHTML = `
    <div id="gs-stage" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;">
      <div id="gs-progress" style="font-size:13px;color:var(--text-sub);font-weight:500;min-height:20px;"></div>

      <div id="gs-cow-wrap" style="position:relative;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;gap:6px;" onclick="gachaScene._squeeze(event)">
        <div id="gs-cow-emoji" style="font-size:130px;line-height:1;animation:cowBob 1.8s ease-in-out infinite;transition:transform .12s;">🐄</div>
        <div style="font-size:13px;color:var(--text-sub);font-weight:500;">꾹 눌러서 젖을 짜세요!</div>
      </div>

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
    </div>`;
  }

  setCard(card, progressText) {
    this.card = card;
    this.clicks = 0;
    this.done = false;
    const milk = document.getElementById('gs-milk');
    if (milk) { milk.style.transition='none'; milk.style.height='0%'; setTimeout(()=>milk.style.transition='height .25s cubic-bezier(.34,1.56,.64,1)',50); }
    const pct = document.getElementById('gs-pct');
    if (pct) { pct.textContent='0%'; pct.style.color='#185FA5'; }
    const cnt = document.getElementById('gs-count');
    if (cnt) cnt.textContent = '0 / 10';
    const cow = document.getElementById('gs-cow-emoji');
    if (cow) cow.style.animation = 'cowBob 1.8s ease-in-out infinite';
    const prog = document.getElementById('gs-progress');
    if (prog) prog.textContent = progressText || '';
  }

  _squeeze(e) {
    if (this.done || !this.card) return;
    this.clicks = Math.min(this.clicks+1, this.maxClicks);
    const pct = Math.round((this.clicks/this.maxClicks)*100);
    document.getElementById('gs-milk').style.height = pct+'%';
    document.getElementById('gs-pct').textContent = pct+'%';
    document.getElementById('gs-count').textContent = `${this.clicks} / ${this.maxClicks}`;

    const cow = document.getElementById('gs-cow-emoji');
    cow.style.transform = 'scale(0.85)';
    setTimeout(()=>cow.style.transform='', 130);

    const drop = document.createElement('div');
    drop.textContent = '💧';
    drop.style.cssText = `position:absolute;font-size:20px;pointer-events:none;left:${20+Math.random()*60}%;top:${30+Math.random()*30}%;animation:squirt .5s ease forwards;`;
    document.getElementById('gs-cow-wrap').appendChild(drop);
    setTimeout(()=>drop.remove(), 500);

    if (this.clicks >= this.maxClicks) this._complete();
  }

  _complete() {
    this.done = true;
    document.getElementById('gs-pct').textContent = '완료! 🎉';
    document.getElementById('gs-pct').style.color = '#27500A';
    const cow = document.getElementById('gs-cow-emoji');
    if (cow) { cow.style.animation = 'cowJump .6s ease forwards'; }
    setTimeout(()=>{ if(this.onDone) this.onDone(this.card); }, 400);
  }

  // 구버전 호환용
  startSingle(card, onDone) {
    this.card = card;
    this.onDone = onDone;
    this.clicks = 0;
    this.done = false;
    this._build();
    this.card = card;
  }
}

// ── 멀티 짜기 매니저 (gacha.html 의존 없이 독립 실행) ──
class SqueezeManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.cards = [];
    this.idx = 0;
    this.onAllDone = null;
    this.scene = null;
  }

  start(cards, onAllDone) {
    this.cards = cards;
    this.idx = 0;
    this.onAllDone = onAllDone;
    this._next();
  }

  _next() {
    if (this.idx >= this.cards.length) {
      if (this.onAllDone) this.onAllDone();
      return;
    }
    const card = this.cards[this.idx];
    const total = this.cards.length;
    const idx = this.idx;

    // 씬 초기화
    if (!this.scene) {
      this.scene = new GachaScene(this.containerId);
    }
    this.scene.setCard(card, total > 1 ? `${idx+1} / ${total}장 뽑기` : '');
    this.scene.done = false;

    this.scene.onDone = async (doneCard) => {
      // 카드 저장
      try {
        await fetch('/cards/draw/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ card_id: doneCard.id })
        });
      } catch(e) { console.error('confirm 실패', e); }

      // 팝업
      const isLast = idx >= total - 1;
      const btnText = isLast
        ? (total > 1 ? '✨ 전체 결과 확인' : '확인')
        : `다음 카드 짜기 (${idx+2}/${total}) →`;

      showCardPopup(doneCard, btnText, () => {
        this.idx++;
        if (isLast && total > 1) {
          this._showSummary();
        } else if (isLast) {
          if (this.onAllDone) this.onAllDone();
        } else {
          this._next();
        }
      });
    };
  }

  _showSummary() {
    const el = document.getElementById(this.containerId);
    el.innerHTML = `
      <div style="padding:16px;">
        <div style="text-align:center;font-size:17px;font-weight:700;margin-bottom:16px;">🎉 전체 결과!</div>
        <div id="gs-summary-grid" class="grid-3" style="gap:10px;"></div>
        <button class="btn btn-primary btn-full" style="margin-top:20px;padding:13px;" id="gs-summary-done">농장으로 이동 🏠</button>
      </div>`;
    document.getElementById('gs-summary-done').onclick = ()=>{ if(this.onAllDone) this.onAllDone(); };
    const grid = document.getElementById('gs-summary-grid');
    this.cards.forEach(card => {
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const item = document.createElement('div');
      item.style.cssText = `background:${col.bg};border:2px solid ${col.border};border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;`;
      const img = document.createElement('img');
      img.src = `/images/cards/${String(card.id).padStart(3,'0')}.png`;
      img.style.cssText = 'width:72px;height:72px;object-fit:contain;';
      img.onerror=()=>img.style.display='none';
      const n = document.createElement('div');
      n.style.cssText = `font-size:10px;font-weight:600;color:${col.text};text-align:center;`;
      n.textContent = card.name;
      const b = document.createElement('span');
      b.style.cssText = `font-size:9px;padding:2px 8px;border-radius:20px;background:${col.border};color:${col.bg};font-weight:700;`;
      b.textContent = card.grade;
      item.appendChild(img); item.appendChild(n); item.appendChild(b);
      grid.appendChild(item);
    });
  }
}

let gachaScene;
let squeezeManager;
