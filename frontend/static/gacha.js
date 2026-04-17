const GRADE_COLOR = {
  '노말':   { bg:'#F1EFE8', border:'#B4B2A9', text:'#444441' },
  '레어':   { bg:'#E6F1FB', border:'#378ADD', text:'#0C447C' },
  '에픽':   { bg:'#EEEDFE', border:'#7F77DD', text:'#3C3489' },
  '레전드': { bg:'#FAEEDA', border:'#BA7517', text:'#412402' },
};

function cowImgEl(cardId, size=80) {
  const img = document.createElement('img');
  img.src   = `/images/cards/${String(cardId).padStart(3,'0')}.png`;
  img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;`;
  img.onerror = () => { img.style.display='none'; };
  return img;
}

class GachaScene {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    this.clicks = 0;
    this.maxClicks = 10;
    this.done = false;
    this.pendingCards = [];
    this.currentIdx = 0;
    this._build();
  }

  _build() {
    this.el.innerHTML = `
    <div id="gs-stage" style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:24px 16px;">
      <div id="gs-cow-wrap" style="position:relative;cursor:pointer;user-select:none;" onclick="gachaScene._squeeze(event)">
        <div id="gs-cow" style="font-size:80px;line-height:1;animation:cowBob 1.8s ease-in-out infinite;">🐄</div>
        <div style="font-size:12px;color:var(--text-sub);text-align:center;margin-top:4px;">젖을 눌러주세요!</div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div id="gs-bottle-wrap" style="position:relative;width:60px;height:100px;">
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:22px;height:10px;background:#378ADD;border-radius:3px 3px 0 0;"></div>
          <div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:18px;height:14px;border:2px solid #85B7EB;border-top:none;background:#fff;border-radius:0 0 3px 3px;"></div>
          <div id="gs-bottle" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:44px;height:72px;border:2px solid #85B7EB;border-radius:4px 4px 8px 8px;background:#fff;overflow:hidden;">
            <div id="gs-milk" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:#E6F1FB;transition:height .25s cubic-bezier(.34,1.56,.64,1);border-radius:0 0 6px 6px;">
              <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#B5D4F4;border-radius:2px;"></div>
            </div>
          </div>
        </div>
        <div id="gs-pct" style="font-size:12px;font-weight:500;color:#185FA5;">0%</div>
        <div id="gs-count" style="font-size:11px;color:var(--text-sub);">0 / 10</div>
      </div>

      <div id="gs-card-area" style="width:120px;height:160px;border-radius:12px;border:1.5px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;">
        <span style="font-size:36px;opacity:.3;">?</span>
      </div>
    </div>

    <!-- 10연속 결과 화면 (숨김) -->
    <div id="gs-multi" style="display:none;padding:16px;">
      <div style="text-align:center;font-size:16px;font-weight:600;margin-bottom:16px;">🎉 10연속 뽑기 결과!</div>
      <div id="gs-multi-grid" class="grid-3" style="gap:10px;"></div>
      <button class="btn btn-primary btn-full" style="margin-top:20px;" onclick="gachaScene.onDone()">농장으로 이동</button>
    </div>`;
  }

  _squeeze(e) {
    if (this.done) return;
    this.clicks = Math.min(this.clicks + 1, this.maxClicks);
    const pct = Math.round((this.clicks / this.maxClicks) * 100);
    document.getElementById('gs-milk').style.height = pct + '%';
    document.getElementById('gs-pct').textContent = pct + '%';
    document.getElementById('gs-count').textContent = `${this.clicks} / ${this.maxClicks}`;

    // 물방울 이펙트
    const drop = document.createElement('div');
    drop.textContent = '💧';
    drop.style.cssText = `position:absolute;font-size:14px;pointer-events:none;
      left:${30+Math.random()*40}%;top:${30+Math.random()*30}%;
      animation:squirt .5s ease forwards;`;
    document.getElementById('gs-cow-wrap').appendChild(drop);
    setTimeout(() => drop.remove(), 500);

    if (this.clicks >= this.maxClicks) this._reveal();
  }

  _reveal() {
    this.done = true;
    document.getElementById('gs-pct').textContent = '완료! 🎉';
    document.getElementById('gs-pct').style.color = '#27500A';

    setTimeout(() => {
      const card = this.pendingCards[this.currentIdx];
      if (!card) return;
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const area = document.getElementById('gs-card-area');
      area.style.cssText = `width:120px;height:160px;border-radius:12px;border:2px solid ${col.border};background:${col.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;animation:cardReveal .5s ease forwards;`;
      area.innerHTML = '';
      area.appendChild(cowImgEl(card.id, 72));
      const name = document.createElement('div');
      name.style.cssText = `font-size:11px;font-weight:500;color:${col.text};text-align:center;padding:0 6px;`;
      name.textContent = card.name;
      const badge = document.createElement('span');
      badge.style.cssText = `font-size:10px;padding:2px 8px;border-radius:20px;background:${col.bg};color:${col.text};border:1px solid ${col.border};`;
      badge.textContent = card.grade;
      area.appendChild(name);
      area.appendChild(badge);
    }, 300);
  }

  startSingle(card, onDone) {
    this.pendingCards = [card];
    this.currentIdx = 0;
    this.onDone = onDone;
    this.clicks = 0; this.done = false;
    this._build();
  }

  startMulti(cards, onDone) {
    // 10연속: 한 장씩 순서대로 짜기
    this.pendingCards = cards;
    this.currentIdx = 0;
    this.onDone = onDone;
    this.clicks = 0; this.done = false;
    this._build();
    this._setupNextBtn();
  }

  _setupNextBtn() {
    // 짜기 완료 후 다음 카드로 넘어가는 버튼 추가
    const stage = document.getElementById('gs-stage');
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary btn-full';
    nextBtn.style.marginTop = '8px';
    nextBtn.textContent = `다음 카드 (${this.currentIdx+1}/${this.pendingCards.length})`;
    nextBtn.style.display = 'none';
    nextBtn.id = 'gs-next';
    nextBtn.onclick = () => this._nextCard();
    stage.appendChild(nextBtn);
  }

  _revealAndNext() {
    this._reveal();
    const nextBtn = document.getElementById('gs-next');
    if (!nextBtn) return;
    setTimeout(() => {
      if (this.currentIdx < this.pendingCards.length - 1) {
        nextBtn.textContent = `다음 카드 (${this.currentIdx+2}/${this.pendingCards.length})`;
        nextBtn.style.display = 'block';
      } else {
        nextBtn.textContent = '전체 결과 보기';
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => this._showMultiResult();
      }
    }, 600);
  }

  _nextCard() {
    this.currentIdx++;
    this.clicks = 0; this.done = false;
    document.getElementById('gs-milk').style.height = '0%';
    document.getElementById('gs-pct').textContent = '0%';
    document.getElementById('gs-pct').style.color = '#185FA5';
    document.getElementById('gs-count').textContent = `0 / 10`;
    document.getElementById('gs-next').style.display = 'none';
    const area = document.getElementById('gs-card-area');
    area.style.cssText = `width:120px;height:160px;border-radius:12px;border:1.5px dashed var(--border);background:var(--gray-light);display:flex;align-items:center;justify-content:center;`;
    area.innerHTML = '<span style="font-size:36px;opacity:.3;">?</span>';
  }

  _showMultiResult() {
    document.getElementById('gs-stage').style.display = 'none';
    document.getElementById('gs-multi').style.display = 'block';
    const grid = document.getElementById('gs-multi-grid');
    grid.innerHTML = '';
    this.pendingCards.forEach(card => {
      const col = GRADE_COLOR[card.grade] || GRADE_COLOR['노말'];
      const item = document.createElement('div');
      item.style.cssText = `background:${col.bg};border:1.5px solid ${col.border};border-radius:10px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;`;
      item.appendChild(cowImgEl(card.id, 60));
      item.innerHTML += `<div style="font-size:10px;font-weight:500;color:${col.text};text-align:center;">${card.name}</div>
        <span style="font-size:9px;padding:1px 6px;border-radius:20px;background:${col.bg};color:${col.text};border:1px solid ${col.border};">${card.grade}</span>`;
      grid.appendChild(item);
    });
  }
}

// CSS keyframes 주입
const style = document.createElement('style');
style.textContent = `
@keyframes cowBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes squirt{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-130%) scale(.3)}}
@keyframes cardReveal{0%{opacity:0;transform:scale(.7) rotateY(90deg)}60%{transform:scale(1.06) rotateY(-4deg)}100%{opacity:1;transform:scale(1) rotateY(0)}}
`;
document.head.appendChild(style);

let gachaScene;
