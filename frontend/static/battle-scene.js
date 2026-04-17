const SCENE_ENABLED = true;

const BS_CSS = `
@keyframes bs-walkL  {0%{opacity:0;transform:translateX(-200px)}100%{opacity:1;transform:translateX(0)}}
@keyframes bs-walkR  {0%{opacity:0;transform:translateX(200px) scaleX(-1)}100%{opacity:1;transform:translateX(0) scaleX(-1)}}
@keyframes bs-rushL  {0%{transform:translateX(0)}40%{transform:translateX(55px)}100%{transform:translateX(0)}}
@keyframes bs-rushR  {0%{transform:translateX(0) scaleX(-1)}40%{transform:translateX(-55px) scaleX(-1)}100%{transform:translateX(0) scaleX(-1)}}
@keyframes bs-shake  {0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}60%{transform:translateX(7px)}}
@keyframes bs-impact {0%{opacity:0;transform:translateX(-50%) scale(.3)}35%{opacity:1;transform:translateX(-50%) scale(1.4)}100%{opacity:0;transform:translateX(-50%) scale(1.2)}}
@keyframes bs-popStar{0%{opacity:0;transform:scale(0) rotate(0)}45%{opacity:1;transform:scale(1.3) rotate(200deg)}100%{opacity:0;transform:scale(.8) rotate(400deg)}}
@keyframes bs-winBob {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes bs-winBobR{0%,100%{transform:translateY(0) scaleX(-1)}50%{transform:translateY(-10px) scaleX(-1)}}
@keyframes bs-result {0%{opacity:0;transform:translateX(-50%) translateY(-20px) scale(1.2)}60%{opacity:1;transform:translateX(-50%) translateY(3px) scale(.97)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes bs-confetti{from{transform:translateY(-8px) rotate(0);opacity:1}to{transform:translateY(100px) rotate(600deg);opacity:0}}
@keyframes bs-roundBadge{0%{opacity:0;transform:translateX(-50%) scale(.5)}40%{opacity:1;transform:translateX(-50%) scale(1.1)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes bs-intro{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
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
  }

  async play(result) {
    if (!SCENE_ENABLED) return this._showResultOnly(result);

    this._buildStage(result);
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // 1. 배틀 시작 문구
    await this._showIntro(result);
    await wait(2200);

    // 2. 양쪽 입장
    this._reAnim(this.cowL, `bs-walkL .5s ease forwards`);
    this._reAnim(this.cowR, `bs-walkR .5s ease forwards`);
    await wait(600);

    // 3. 5라운드 충돌
    const scores = result.round_scores || ['L','R','L','L','L'];
    for (let i = 0; i < 5; i++) {
      await this._clash(i + 1, scores[i], scores, result);
      await wait(800);
    }

    // 4. 패배 소 쓰러짐
    await wait(200);
    if (result.is_winner) {
      this.cowR.style.transition = 'transform .4s ease, opacity .4s ease';
      this.cowR.style.transform = 'rotate(20deg) translateY(10px) scaleX(-1)';
      this.cowR.style.opacity = '0.35';
      this._reAnim(this.cowL, `bs-winBob .5s ease infinite`);
    } else {
      this.cowL.style.transition = 'transform .4s ease, opacity .4s ease';
      this.cowL.style.transform = 'rotate(-20deg) translateY(10px)';
      this.cowL.style.opacity = '0.35';
      this._reAnim(this.cowR, `bs-winBobR .5s ease infinite`);
    }
    await wait(500);

    // 5. 결과 배너
    await this._showBanner(result);
    if (result.is_winner || result.is_upset) this._confetti();
    await wait(400);

    // 6. 텍스트 결과
    this._showResultText(result);
  }

  _buildStage(result) {
    this.el.innerHTML = `
    <div id="bs-intro-msg" style="text-align:center;padding:20px 16px;font-size:16px;font-weight:600;opacity:0;"></div>
    <div id="bs-stage" style="position:relative;height:200px;overflow:hidden;background:#d4edda;border-radius:12px;margin:0 12px;">
      <div style="position:absolute;bottom:0;left:0;right:0;height:35px;background:#87c49a;border-top:1px solid #6aab85;"></div>
      <div id="bs-confetti-layer" style="position:absolute;inset:0;pointer-events:none;"></div>
      <div id="bs-hp-L" style="position:absolute;top:8px;left:calc(50% - 130px);width:80px;height:6px;background:#e0ffe0;border-radius:3px;overflow:hidden;"><div id="bs-hpf-L" style="height:100%;width:100%;background:#1D9E75;border-radius:3px;transition:width .35s ease;"></div></div>
      <div id="bs-hp-R" style="position:absolute;top:8px;right:calc(50% - 130px);width:80px;height:6px;background:#e0ffe0;border-radius:3px;overflow:hidden;"><div id="bs-hpf-R" style="height:100%;width:100%;background:#1D9E75;border-radius:3px;transition:width .35s ease;"></div></div>
      <div id="bs-name-L" style="position:absolute;top:18px;left:calc(50% - 130px);font-size:9px;color:#2d6a4f;font-weight:500;white-space:nowrap;"></div>
      <div id="bs-name-R" style="position:absolute;top:18px;right:calc(50% - 50px);font-size:9px;color:#2d6a4f;font-weight:500;white-space:nowrap;text-align:right;"></div>
      <div id="bs-round-badge" style="position:absolute;top:8px;left:50%;opacity:0;white-space:nowrap;font-size:11px;font-weight:500;padding:2px 10px;border-radius:20px;background:#fff;border:0.5px solid #ccc;color:#555;"></div>
      <div id="bs-result-banner" style="position:absolute;top:12px;left:50%;opacity:0;white-space:nowrap;font-size:18px;font-weight:600;padding:5px 18px;border-radius:8px;"></div>
      <img id="bs-cow-L" style="position:absolute;bottom:35px;left:calc(50% - 120px);width:80px;height:80px;object-fit:contain;opacity:0;" src="/images/cards/${String(result.my_card.id).padStart(3,'0')}.png" onerror="this.style.fontSize='50px';this.src='';this.textContent='🐄';">
      <img id="bs-cow-R" style="position:absolute;bottom:35px;right:calc(50% - 120px);width:80px;height:80px;object-fit:contain;opacity:0;transform:scaleX(-1);" src="/images/cards/${String(result.opp_card.id).padStart(3,'0')}.png" onerror="this.style.fontSize='50px';this.src='';this.textContent='🐮';">
      <div id="bs-impact" style="position:absolute;bottom:80px;left:50%;font-size:32px;opacity:0;pointer-events:none;">💥</div>
      ${[43,53,48,39,57].map((l,i) => `<div class="bs-star" style="position:absolute;font-size:12px;opacity:0;left:${l}%;top:${[35,28,42,30,38][i]}%;">${i%2?'★':'✦'}</div>`).join('')}
    </div>

    <!-- 라운드 도트 -->
    <div style="display:flex;gap:6px;justify-content:center;margin:10px 0;">
      ${[1,2,3,4,5].map(i=>`<div id="bs-rd${i}" style="width:22px;height:22px;border-radius:50%;border:0.5px solid #ccc;background:#f5f3ee;font-size:10px;font-weight:500;display:flex;align-items:center;justify-content:center;color:#aaa;transition:all .2s;">${i}</div>`).join('')}
    </div>

    <div id="bs-result-text" style="display:none;margin:0 12px;"></div>`;

    this.cowL   = document.getElementById('bs-cow-L');
    this.cowR   = document.getElementById('bs-cow-R');
    this.stage  = document.getElementById('bs-stage');
    document.getElementById('bs-name-L').textContent = result.my_card.name;
    document.getElementById('bs-name-R').textContent = result.opp_card.name;
  }

  async _showIntro(result) {
    const msg = document.getElementById('bs-intro-msg');
    msg.textContent = `${result.opp_nickname}님의 ${result.opp_card.name}와 젖짜기 배틀!`;
    this._reAnim(msg, 'bs-intro .4s ease forwards');
    await new Promise(r => setTimeout(r, 400));
  }

  async _clash(round, winner, scores, result) {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const badge = document.getElementById('bs-round-badge');
    badge.textContent = `Round ${round}`;
    badge.style.opacity = '0';
    this._reAnim(badge, 'bs-roundBadge .3s ease forwards');
    await wait(300);

    this._reAnim(this.cowL, 'bs-rushL .45s ease forwards');
    this._reAnim(this.cowR, 'bs-rushR .45s ease forwards');
    await wait(250);

    this._reAnim(document.getElementById('bs-impact'), 'bs-impact .45s ease forwards');
    document.querySelectorAll('.bs-star').forEach((s,i) =>
      this._reAnim(s, `bs-popStar .45s ease ${i*50}ms forwards`));
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

    // 라운드 도트
    const dot = document.getElementById(`bs-rd${round}`);
    if (winner === 'L') {
      dot.style.background = '#EAF3DE'; dot.style.borderColor = '#3B6D11';
      dot.style.color = '#27500A'; dot.textContent = '✓';
    } else {
      dot.style.background = '#FCEBEB'; dot.style.borderColor = '#A32D2D';
      dot.style.color = '#791F1F'; dot.textContent = '✗';
    }
    await wait(450);
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
    this._reAnim(banner, 'bs-result .4s ease forwards');
    await new Promise(r => setTimeout(r, 400));
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

  _reAnim(el, anim) {
    if (!el) return;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = anim;
  }
}
