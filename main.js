const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(f,t,d,v=0.1){if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.stop(audioCtx.currentTime+d);}
function playClick(){playTone(1000,'square',0.03,0.05);}
function playCorrect(){playTone(880,'square',0.05,0.08);setTimeout(()=>playTone(1100,'square',0.05,0.08),60);setTimeout(()=>playTone(1320,'square',0.1,0.1),120);}
function playWrong(){playTone(200,'sawtooth',0.2,0.15);setTimeout(()=>playTone(100,'sawtooth',0.3,0.2),100);}
function playClear(){[523,659,784,1047,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>playTone(f,'square',0.08,0.08),i*80));}

const screens={title:document.getElementById('screen-title'),stage1:document.getElementById('screen-stage1'),stage2:document.getElementById('screen-stage2'),stage3:document.getElementById('screen-stage3'),gameover:document.getElementById('screen-gameover'),clear:document.getElementById('screen-clear')};
function hideAllScreens(){Object.values(screens).forEach(s=>s.classList.remove('active'));}

let s1patterns=new Set();
let s3patterns=new Set();
let selectedSum='';
let selectedCarry='';

function startGame(){
    playClick();hideAllScreens();
    s1patterns=new Set();s3patterns=new Set();
    selectedSum='';selectedCarry='';
    ['s1-a','s1-b'].forEach(id=>{const el=document.getElementById(id);el.textContent='0';el.classList.remove('on');});
    document.getElementById('s1-next').disabled=true;
    updateGateOutputs();
    screens.stage1.classList.add('active');
}

function toggleSwitch(id){
    playClick();
    const el=document.getElementById(id);
    if(el.textContent==='0'){el.textContent='1';el.classList.add('on');}
    else{el.textContent='0';el.classList.remove('on');}
    if(id.startsWith('s1'))updateGateOutputs();
}

// ===== STAGE 1 =====
function updateGateOutputs(){
    const a=parseInt(document.getElementById('s1-a').textContent);
    const b=parseInt(document.getElementById('s1-b').textContent);
    const results={
        's1-and':a&b,
        's1-or':a|b,
        's1-nota':a?0:1
    };
    Object.entries(results).forEach(([id,val])=>{
        const el=document.getElementById(id);
        el.textContent=val;
        el.classList.toggle('on',val===1);
    });
    s1patterns.add(`${a}${b}`);
    if(s1patterns.size>=4){
        document.getElementById('s1-next').disabled=false;
    }
}

function checkStage1(){
    if(s1patterns.size<4){
        alert('4パターン全て試してください！\n(00, 01, 10, 11)');
        return;
    }
    playCorrect();
    alert('🎉 全パターンの動作を確認した！\n\n💡 気づいた？(A OR B) AND (NOT (A AND B)) の出力は「足し算の1の位」と同じ！\nANDの出力は「繰り上がり」と同じ！\n\nこれが半加算器の正体だ！');
    hideAllScreens();
    // reset stage 2
    document.querySelectorAll('.gate-choice').forEach(b=>b.classList.remove('selected'));
    document.getElementById('sum-selected').textContent='未選択';
    document.getElementById('carry-selected').textContent='未選択';
    screens.stage2.classList.add('active');
}

// ===== STAGE 2 =====
function selectGate(slot,gate){
    playClick();
    if(slot==='sum'){
        selectedSum=gate;
        document.getElementById('sum-selected').textContent='選択: '+gate;
    }else{
        selectedCarry=gate;
        document.getElementById('carry-selected').textContent='選択: '+gate;
    }
    // highlight
    const parent=slot==='sum'?0:1;
    const slots=document.querySelectorAll('.build-slot');
    slots[parent].querySelectorAll('.gate-choice').forEach(b=>{
        b.classList.toggle('selected',b.textContent===gate);
    });
}

function checkStage2(){
    if(!selectedSum||!selectedCarry){
        alert('両方のゲートを選択してください！');return;
    }
    if(selectedSum==='(A OR B) AND (NOT (A AND B))'&&selectedCarry==='A AND B'){
        playCorrect();
        alert('🎉 完璧だ！回路が正しく組み上がった！\n\n✅ 和(S) = (A OR B) AND (NOT (A AND B)) → 片方だけ1のとき1\n✅ 桁上げ(C) = A AND B → 両方1のとき1\n\nこれが半加算器だ！');
        hideAllScreens();
        // reset stage 3
        ['s3-a','s3-b'].forEach(id=>{const el=document.getElementById(id);el.textContent='0';el.classList.remove('on');});
        s3patterns=new Set();
        document.getElementById('s3-next').disabled=true;
        document.querySelectorAll('.truth-table tr').forEach(tr=>tr.classList.remove('checked'));
        document.querySelectorAll('.tt-check').forEach(td=>td.textContent='⬜');
        updateHalfAdder();
        screens.stage3.classList.add('active');
    }else{
        playWrong();
        let hint='';
        if(selectedSum!=='(A OR B) AND (NOT (A AND B))')hint+='和(S): 足し算の1の位と一致する論理式を選んで！\n';
        if(selectedCarry!=='A AND B')hint+='桁上げ(C): 1+1のときだけ桁上がりする。両方1のとき1の回路は？\n';
        alert('❌ ショート！\n\n'+hint);
    }
}

// ===== STAGE 3 =====
function updateHalfAdder(){
    const a=parseInt(document.getElementById('s3-a').textContent);
    const b=parseInt(document.getElementById('s3-b').textContent);
    const s=a^b;
    const c=a&b;
    const sEl=document.getElementById('ha-s');
    const cEl=document.getElementById('ha-c');
    sEl.textContent=s;sEl.classList.toggle('on',s===1);
    cEl.textContent=c;cEl.classList.toggle('on',c===1);
    document.getElementById('calc-a').textContent=a;
    document.getElementById('calc-b').textContent=b;
    const result=a+b;
    document.getElementById('calc-result').textContent=result;
    document.getElementById('calc-binary').textContent=`(2進: ${c}${s})`;
    
    const key=`${a}${b}`;
    s3patterns.add(key);
    const row=document.getElementById(`tt-${key}`);
    if(row){row.classList.add('checked');row.querySelector('.tt-check').textContent='✅';}
    if(s3patterns.size>=4)document.getElementById('s3-next').disabled=false;
}

function checkStage3(){
    if(s3patterns.size<4){alert('4パターン全て試してください！');return;}
    playCorrect();
    setTimeout(()=>{playClear();hideAllScreens();screens.clear.classList.add('active');},500);
}
