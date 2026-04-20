const SCENE_ENABLED = true;

const BS_CSS = `
@keyframes bs-walkL   {0%{opacity:0;transform:translateX(-200px) scaleX(-1)}100%{opacity:1;transform:translateX(0) scaleX(-1)}}
@keyframes bs-walkR   {0%{opacity:0;transform:translateX(200px) scaleX(1)}100%{opacity:1;transform:translateX(0) scaleX(1)}}
@keyframes bs-rushL   {0%{transform:translateX(0) scaleX(-1)}40%{transform:translateX(55px) scaleX(-1)}100%{transform:translateX(0) scaleX(-1)}}
@keyframes bs-rushR   {0%{transform:translateX(0) scaleX(1)}40%{transform:translateX(-55px) scaleX(1)}100%{transform:translateX(0) scaleX(1)}}
@keyframes bs-idleL   {0%,100%{transform:translateY(0) scaleX(-1)}50%{transform:translateY(-5px) scaleX(-1)}}
@keyframes bs-idleR   {0%,100%{transform:translateY(0) scaleX(1)}50%{transform:translateY(-5px) scaleX(1)}}
@keyframes bs-knockL  {0%{transform:translateX(0) scaleX(-1) rotate(0) translateY(0);opacity:1}100%{transform:translateX(-20px) scaleX(-1) rotate(-25deg) translateY(12px);opacity:0.3}}
@keyframes bs-knockR  {0%{transform:translateX(0) scaleX(1) rotate(0) translateY(0);opacity:1}100%{transform:translateX(20px) scaleX(1) rotate(25deg) translateY(12px);opacity:0.3}}
@keyframes bs-winBobL {0%,100%{transform:translateY(0) scaleX(-1)}50%{transform:translateY(-12px) scaleX(-1)}}
@keyframes bs-winBobR {0%,100%{transform:translateY(0) scaleX(1)}50%{transform:translateY(-12px) scaleX(1)}}
@keyframes bs-shake   {0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}60%{transform:translateX(7px)}}
@keyframes bs-impact  {0%{opacity:0;transform:translateX(-50%) scale(.3)}35%{opacity:1;transform:translateX(-50%) scale(1.4)}100%{opacity:0;transform:translateX(-50%) scale(1.2)}}
@keyframes bs-popStar {0%{opacity:0;transform:scale(0) rotate(0)}45%{opacity:1;transform:scale(1.3) rotate(200deg)}100%{opacity:0;transform:scale(.8) rotate(400deg)}}
@keyframes bs-result  {0%{opacity:0;transform:translateX(-50%) translateY(-20px) scale(1.2)}60%{opacity:1;transform:translateX(-50%) translateY(3px) scale(.97)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes bs-confetti{from{transform:translateY(-8px) rotate(0);opacity:1}to{transform:translateY(100px) rotate(600deg);opacity:0}}
@keyframes bs-roundBadge{0%{opacity:0;transform:translateX(-50%) scale(.5)}40%{opacity:1;transform:translateX(-50%) scale(1.1)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes bs-intro   {0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes bs-steal-in{0%{opacity:0;transform:scale(0.3) rotate(-10deg)}50%{opacity:1;transform:scale(1.1) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes bs-steal-txt{0%{opacity:0;transform:translateY(-20px) scale(1.3)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes bs-ptFly   {0%{opacity:1;transform:translate(-50%,-50%) translate(0,0)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--tx),var(--ty))}}
`;

function injectBSCSS() {
  if (document.getElementById('bs-css')) return;
  const s = document.createElement('style');
  s.id = 'bs-css'; s.textContent = BS_CSS;
  document.head.appendChild(s);
}

class BattleScene {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    injectBSCSS();
    // 소 위치 상태 추적
    this._posL = 'scaleX(-1)'; // 왼쪽 소: 오른쪽 바라봄
    this._posR = 'scaleX(1)';  // 오른쪽 소: 왼쪽 바라봄
  }

  async play(result) {
    if (!SCENE_ENABLED) return this._showResultOnly(result);

    this._buildStage(result);
    const wait = ms => new Promise(r => setTimeout(r, ms));

    await this._showIntro(result);
    await wait(2200);

    // 입장
    this._setAnim(this.cowL, 'bs-walkL .5s ease forwards');
    this._setAnim(this.cowR, 'bs-walkR .5s ease forwards');
    await wait(600);

    // 입장 후 idle 애니메이션 (이미지 유지하면서 통통)
    this._setAnim(this.cowL, 'bs-idleL 1.5s ease-in-out infinite');
    this._setAnim(this.cowR, 'bs-idleR 1.5s ease-in-out infinite');
    await wait(400);

    // 5라운드
    const scores = result.round_scores || ['L','R','L','L','L'];
    for (let i = 0; i < 5; i++) {
      await this._clash(i + 1, scores[i], scores);
      await wait(700);
    }

    // 패배 소 쓰러짐
    await wait(200);
    if (result.is_winner) {
      this._setAnim(this.cowR, 'bs-knockR .5s ease forwards');
      this._setAnim(this.cowL, 'bs-winBobL .5s ease-in-out infinite');
    } else {
      this._setAnim(this.cowL, 'bs-knockL .5s ease forwards');
      this._setAnim(this.cowR, 'bs-winBobR .5s ease-in-out infinite');
    }
    await wait(500);

    await this._showBanner(result);
    if (result.is_winner || result.is_upset) this._confetti();
    await wait(600);

    // 승리 시 강탈 카드 전체화면 팝업
    if (result.is_winner && result.card_taken) {
      await this._showStealPopup(result);
    }

    this._showResultText(result);
  }

  _buildStage(result) {
    this.el.innerHTML = `
    <div id="bs-intro-msg" style="text-align:center;padding:20px 16px;font-size:16px;font-weight:600;opacity:0;"></div>
    <div id="bs-stage" style="position:relative;height:210px;overflow:hidden;background:#d4edda;border-radius:12px;margin:0 12px;">
      <div style="position:absolute;bottom:0;left:0;right:0;height:38px;background:#87c49a;border-top:1px solid #6aab85;"></div>
      <div id="bs-confetti-layer" style="position:absolute;inset:0;pointer-events:none;"></div>

      <div id="bs-hp-L" style="position:absolute;top:8px;left:calc(50% - 130px);width:80px;height:6px;background:#e0ffe0;border-radius:3px;overflow:hidden;">
        <div id="bs-hpf-L" style="height:100%;width:100%;background:#1D9E75;border-radius:3px;transition:width .35s ease;"></div>
      </div>
      <div id="bs-hp-R" style="position:absolute;top:8px;right:calc(50% - 130px);width:80px;height:6px;background:#e0ffe0;border-radius:3px;overflow:hidden;">
        <div id="bs-hpf-R" style="height:100%;width:100%;background:#1D9E75;border-radius:3px;transition:width .35s ease;"></div>
      </div>
      <div id="bs-name-L" style="position:absolute;top:18px;left:calc(50% - 130px);font-size:9px;color:#2d6a4f;font-weight:500;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;"></div>
      <div id="bs-name-R" style="position:absolute;top:18px;right:calc(50% - 50px);font-size:9px;color:#2d6a4f;font-weight:500;white-space:nowrap;text-align:right;max-width:90px;overflow:hidden;text-overflow:ellipsis;"></div>

      <div id="bs-round-badge" style="position:absolute;top:8px;left:50%;opacity:0;white-space:nowrap;font-size:11px;font-weight:500;padding:2px 10px;border-radius:20px;background:#fff;border:0.5px solid #ccc;color:#555;z-index:5;"></div>
      <div id="bs-result-banner" style="position:absolute;top:12px;left:50%;opacity:0;white-space:nowrap;font-size:18px;font-weight:600;padding:5px 18px;border-radius:8px;z-index:5;"></div>

      <!-- 왼쪽 소: 오른쪽 바라봄 (scaleX(-1)) -->
      <img id="bs-cow-L"
        style="position:absolute;bottom:38px;left:calc(50% - 120px);width:85px;height:85px;object-fit:contain;opacity:0;"
        src="/images/cards/${String(result.my_card.id).padStart(3,'0')}.png"
        onerror="this.style.fontSize='50px';this.src='';this.textContent='🐄';">

      <!-- 오른쪽 소: 왼쪽 바라봄 (scaleX(1) = 기본, 이미지 원본이 왼쪽 바라봄이면 OK, 아니면 아래서 처리) -->
      <img id="bs-cow-R"
        style="position:absolute;bottom:38px;right:calc(50% - 120px);width:85px;height:85px;object-fit:contain;opacity:0;"
        src="/images/cards/${String(result.opp_card.id).padStart(3,'0')}.png"
        onerror="this.style.fontSize='50px';this.src='';this.textContent='🐮';">

      <div id="bs-impact" style="position:absolute;bottom:85px;left:50%;font-size:36px;opacity:0;pointer-events:none;">💥</div>
      ${[43,53,48,39,57].map((l,i)=>`<div class="bs-star" style="position:absolute;font-size:13px;opacity:0;left:${l}%;top:${[35,28,42,30,38][i]}%;">${i%2?'★':'✦'}</div>`).join('')}
    </div>

    <div style="display:flex;gap:6px;justify-content:center;margin:10px 0;">
      ${[1,2,3,4,5].map(i=>`<div id="bs-rd${i}" style="width:22px;height:22px;border-radius:50%;border:0.5px solid #ccc;background:#f5f3ee;font-size:10px;font-weight:500;display:flex;align-items:center;justify-content:center;color:#aaa;transition:all .2s;">${i}</div>`).join('')}
    </div>

    <div id="bs-result-text" style="display:none;margin:0 12px;"></div>`;

    this.cowL  = document.getElementById('bs-cow-L');
    this.cowR  = document.getElementById('bs-cow-R');
    this.stage = document.getElementById('bs-stage');
    document.getElementById('bs-name-L').textContent = result.my_card.name;
    document.getElementById('bs-name-R').textContent = result.opp_card.name;
  }

  async _showIntro(result) {
    const msg = document.getElementById('bs-intro-msg');
    msg.textContent = `${result.opp_nickname}님의 ${result.opp_card.name}와 젖짜기 배틀!`;
    this._setAnim(msg, 'bs-intro .4s ease forwards');
    await new Promise(r => setTimeout(r, 400));
  }

  async _clash(round, winner, scores) {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const badge = document.getElementById('bs-round-badge');
    badge.textContent = `Round ${round}`;
    badge.style.opacity = '0';
    this._setAnim(badge, 'bs-roundBadge .3s ease forwards');
    await wait(300);

    // 충돌 — idle 멈추고 rush
    this._setAnim(this.cowL, 'bs-rushL .45s ease forwards');
    this._setAnim(this.cowR, 'bs-rushR .45s ease forwards');
    await wait(260);

    this._setAnim(document.getElementById('bs-impact'), 'bs-impact .45s ease forwards');
    document.querySelectorAll('.bs-star').forEach((s,i) =>
      this._setAnim(s, `bs-popStar .45s ease ${i*50}ms forwards`));
    this.stage.style.animation = 'none'; void this.stage.offsetWidth;
    this.stage.style.animation = 'bs-shake .35s ease';

    // HP 업데이트
    const lWins = scores.slice(0, round).filter(s => s==='L').length;
    const rWins = scores.slice(0, round).filter(s => s==='R').length;
    const hpL = Math.max(0, 100 - rWins * 20);
    const hpR = Math.max(0, 100 - lWins * 20);
    const barL = document.getElementById('bs-hpf-L');
    const barR = document.getElementById('bs-hpf-R');
    barL.style.width = hpL + '%';
    barR.style.width = hpR + '%';
    if (hpL < 40) barL.style.background = '#E24B4A';
    if (hpR < 40) barR.style.background = '#E24B4A';

    const dot = document.getElementById(`bs-rd${round}`);
    if (winner === 'L') {
      dot.style.cssText += ';background:#EAF3DE;border-color:#3B6D11;color:#27500A;';
      dot.textContent = '✓';
    } else {
      dot.style.cssText += ';background:#FCEBEB;border-color:#A32D2D;color:#791F1F;';
      dot.textContent = '✗';
    }
    await wait(460);

    // 충돌 후 다시 idle로 복귀 (이미지 유지)
    this._setAnim(this.cowL, 'bs-idleL 1.5s ease-in-out infinite');
    this._setAnim(this.cowR, 'bs-idleR 1.5s ease-in-out infinite');
    badge.style.opacity = '0';
  }

  async _showBanner(result) {
    const banner = document.getElementById('bs-result-banner');
    if (result.is_upset) {
      banner.textContent = '업셋!! 하극상!';
      banner.style.cssText += ';background:#FAEEDA;color:#412402;border:0.5px solid #854F0B;';
    } else if (result.is_winner) {
      banner.textContent = '승리!';
      banner.style.cssText += ';background:#EAF3DE;color:#173404;border:0.5px solid #3B6D11;';
    } else {
      banner.textContent = '패배...';
      banner.style.cssText += ';background:#FCEBEB;color:#501313;border:0.5px solid #A32D2D;';
    }
    this._setAnim(banner, 'bs-result .4s ease forwards');
    await new Promise(r => setTimeout(r, 400));
  }

  async _showStealPopup(result) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:600;
        background:rgba(0,0,0,0.92);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:20px;
      `;

      // 강탈! 텍스트
      const txt = document.createElement('div');
      txt.textContent = '⚔️ 강탈!';
      txt.style.cssText = `
        font-size:36px;font-weight:800;color:#E24B4A;
        margin-bottom:16px;
        animation:bs-steal-txt .5s ease forwards;
        text-shadow:0 0 20px rgba(226,75,74,0.8);
      `;
      overlay.appendChild(txt);

      // 강탈한 카드 이미지 (전체화면 꽉 차게)
      const img = document.createElement('img');
      img.src = `/images/cards/${String(result.opp_card.id).padStart(3,'0')}.png`;
      img.style.cssText = `
        width:min(80vw,320px);height:min(80vw,320px);
        object-fit:contain;
        animation:bs-steal-in .6s ease .1s both;
      `;
      img.onerror = ()=>{ img.style.display='none'; };
      overlay.appendChild(img);

      // 파티클
      const colors = ['#E24B4A','#EF9F27','#FFD700','#fff'];
      for (let i=0;i<40;i++) {
        const p = document.createElement('div');
        const sz = 5+Math.random()*10;
        const angle = Math.random()*360;
        const dist = 100+Math.random()*200;
        p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${colors[i%4]};border-radius:50%;left:50%;top:50%;pointer-events:none;animation:bs-ptFly ${.6+Math.random()*.8}s ease-out ${Math.random()*.4}s both;--tx:${Math.cos(angle*Math.PI/180)*dist}px;--ty:${Math.sin(angle*Math.PI/180)*dist}px;`;
        overlay.appendChild(p);
      }

      // 카드 이름
      const name = document.createElement('div');
      name.textContent = result.opp_card.name;
      name.style.cssText = `font-size:18px;font-weight:700;color:#fff;margin-top:12px;animation:bs-steal-txt .4s ease .4s both;`;
      overlay.appendChild(name);

      const sub = document.createElement('div');
      sub.textContent = '내 컬렉션에 추가됐습니다!';
      sub.style.cssText = `font-size:13px;color:rgba(255,255,255,.7);margin-top:6px;animation:bs-steal-txt .4s ease .5s both;`;
      overlay.appendChild(sub);

      const btn = document.createElement('button');
      btn.textContent = '확인';
      btn.style.cssText = `margin-top:24px;padding:12px 36px;border-radius:10px;border:none;background:#E24B4A;color:#fff;font-size:16px;font-weight:700;cursor:pointer;animation:bs-steal-txt .4s ease .6s both;`;
      btn.onclick = () => { overlay.remove(); resolve(); };
      overlay.appendChild(btn);

      document.body.appendChild(overlay);
    });
  }

  _confetti() {
    const layer = document.getElementById('bs-confetti-layer');
    const colors = ['#639922','#BA7517','#1D9E75','#D85A30','#D4537E'];
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('div');
      const sz = 4 + Math.random() * 6;
      d.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${colors[i%5]};border-radius:${Math.random()>.5?'50%':'2px'};left:${8+Math.random()*84}%;top:${Math.random()*10}%;animation:bs-confetti ${.7+Math.random()*.8}s ease ${Math.random()*.5}s both;`;
      layer.appendChild(d);
    }
  }

  _showResultText(result) {
    const el = document.getElementById('bs-result-text');
    const badges = [];
    if (result.is_upset)      badges.push(`<span style="background:#FAEEDA;color:#412402;padding:3px 10px;border-radius:20px;font-size:12px;border:1px solid #BA7517;">업셋!</span>`);
    if (result.card_taken)    badges.push(`<span style="background:#E6F1FB;color:#0C447C;padding:3px 10px;border-radius:20px;font-size:12px;border:1px solid #378ADD;">카드 강탈 발생</span>`);
    if (result.milk_taken > 0) badges.push(`<span style="background:#FAEEDA;color:#412402;padding:3px 10px;border-radius:20px;font-size:12px;border:1px solid #BA7517;">우유 ${result.milk_taken}개 ${result.is_winner?'획득':'손실'}</span>`);
    el.innerHTML = `
    <div style="background:var(--card-bg);border-radius:12px;border:0.5px solid var(--border);padding:14px;margin-top:8px;">
      <div style="font-size:13px;color:var(--text-sub);line-height:1.7;margin-bottom:10px;">${result.reason}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${badges.join('')}</div>
    </div>`;
    el.style.display = 'block';
  }

  _showResultOnly(result) {
    this.el.innerHTML = `<div style="padding:16px;"></div>`;
    this._showResultText(result);
  }

  // animation 덮어쓰기 없이 안전하게 적용
  _setAnim(el, anim) {
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = anim;
  }
}
