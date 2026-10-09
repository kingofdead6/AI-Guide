// @ts-nocheck
/* Interactive teaching widgets (vanilla DOM + canvas). Each widget renders into a container element.
   Mount them with mountWidget(el, name); they read theme colours from CSS variables. */

  // ---------- helpers ----------
  function cssv(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function hexToRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(function(c){return c+c;}).join(''); var n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgba(h,a){ var c=hexToRgb(h); return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
  function pal(){ return {c1:cssv('--c1'),c2:cssv('--c2'),c3:cssv('--c3'),c4:cssv('--c4'),c5:cssv('--c5'),text:cssv('--text'),muted:cssv('--muted'),border:cssv('--border'),surface:cssv('--surface'),bg:cssv('--bg')}; }
  function rng(seed){ var s=seed>>>0; return function(){ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }
  function randn(r){ var u=0; while(u===0) u=r(); var v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  function canvasSetup(c, aspect){
    var w=c.parentElement.clientWidth-2; if(w<200) w=200;
    var h=Math.round(w*aspect); var dpr=window.devicePixelRatio||1;
    c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); c.style.height=h+'px';
    var ctx=c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx:ctx,w:w,h:h};
  }
  function heat(ctx,w,h,G,Gy,fn){
    var off=document.createElement('canvas'); off.width=G; off.height=Gy;
    var o=off.getContext('2d'), im=o.createImageData(G,Gy);
    for(var j=0;j<Gy;j++) for(var i=0;i<G;i++){ var c=fn(i,j), k=(j*G+i)*4; im.data[k]=c[0]; im.data[k+1]=c[1]; im.data[k+2]=c[2]; im.data[k+3]=Math.round(Math.max(0,Math.min(1,c[3]))*255); }
    o.putImageData(im,0,0); ctx.imageSmoothingEnabled=true; ctx.drawImage(off,0,0,w,h);
  }
  function head(el,title,note){
    return '<div class="w-head"><span class="w-badge">Try it</span><span class="w-title">'+title+'</span></div>';
  }
  function q(el,sel){ return el.querySelector(sel); }
  var W={};

  // ---------- 1. Neural network playground ----------
  W.nn=function(el){
    el.innerHTML=head(el,'Neural network playground')+
      '<div class="w-controls">'+
      '<label>Data <select data-k="ds"><option value="circle">Circle</option><option value="xor">XOR</option><option value="spiral">Spiral</option><option value="moons">Two moons</option></select></label>'+
      '<label>Hidden layers <select data-k="layers"><option>1</option><option selected>2</option><option>3</option></select></label>'+
      '<label>Neurons <input type="range" min="1" max="16" value="6" data-k="units"><span class="val" data-v="units">6</span></label>'+
      '<label>Activation <select data-k="act"><option value="tanh">tanh</option><option value="relu">ReLU</option><option value="sigmoid">sigmoid</option><option value="linear">linear (none)</option></select></label>'+
      '<label>Learning rate <select data-k="lr"><option>0.001</option><option>0.003</option><option>0.01</option><option selected>0.03</option><option>0.1</option><option>0.3</option></select></label>'+
      '<label>L2 <select data-k="l2"><option value="0" selected>0</option><option>0.0001</option><option>0.001</option><option>0.01</option></select></label>'+
      '</div>'+
      '<div class="w-controls"><button class="w-btn primary" data-a="play">▶ Train</button><button class="w-btn" data-a="step">Step</button><button class="w-btn" data-a="reset">Reset</button><span class="w-stat" data-s="stat"></span></div>'+
      '<canvas class="w-canvas"></canvas>'+
      '<div class="w-note">Each dot is a training example (blue = class 1, orange = class 0). The background shows the network\'s predicted probability. Try: <b>linear</b> activation on Circle (it can\'t bend the boundary), 1 neuron vs 8, or Spiral with 1 layer vs 3. Trained with Adam on full batches of 200 points.</div>';
    var cv=q(el,'canvas'), st=q(el,'[data-s=stat]'), playBtn=q(el,'[data-a=play]');
    var S={}, data=[], net=null, epoch=0, running=false, t=0;
    function opts(){ var o={}; el.querySelectorAll('[data-k]').forEach(function(i){o[i.dataset.k]=i.value;}); return o; }
    function gen(kind){
      var r=rng(42), pts=[], n=200, i;
      for(i=0;i<n;i++){
        var x,y,l;
        if(kind==='circle'){ x=r()*2-1; y=r()*2-1; l=(x*x+y*y<0.42)?1:0; x+=randn(r)*0.03; y+=randn(r)*0.03; }
        else if(kind==='xor'){ x=r()*2-1; y=r()*2-1; l=(x*y>0)?1:0; if(Math.abs(x)<0.06||Math.abs(y)<0.06){i--;continue;} }
        else if(kind==='spiral'){ l=i%2; var tt=(i>>1)/(n/2)*3.4+0.3; var rad=tt/3.9; x=rad*Math.cos(tt*1.75+l*Math.PI)+randn(r)*0.03; y=rad*Math.sin(tt*1.75+l*Math.PI)+randn(r)*0.03; }
        else { l=i%2; var a=r()*Math.PI; if(l){ x=Math.cos(a)*0.62-0.3; y=Math.sin(a)*0.62-0.18; } else { x=0.3-Math.cos(a)*0.62; y=0.18-Math.sin(a)*0.62; } x+=randn(r)*0.06; y+=randn(r)*0.06; }
        pts.push([x,y,l]);
      }
      return pts;
    }
    function act(v,k){ if(k==='tanh') return Math.tanh(v); if(k==='relu') return v>0?v:0; if(k==='sigmoid') return 1/(1+Math.exp(-v)); return v; }
    function dact(a,z,k){ if(k==='tanh') return 1-a*a; if(k==='relu') return z>0?1:0; if(k==='sigmoid') return a*(1-a); return 1; }
    function build(){
      var o=opts(); S=o; var L=+o.layers, U=+o.units, sizes=[2]; for(var i=0;i<L;i++) sizes.push(U); sizes.push(1);
      var r=rng(7); net=[];
      for(var l=0;l<sizes.length-1;l++){
        var nin=sizes[l], nout=sizes[l+1], std=Math.sqrt((o.act==='relu'?2:1)/nin), Wt=new Float64Array(nin*nout);
        for(var k=0;k<Wt.length;k++) Wt[k]=randn(r)*std;
        net.push({nin:nin,nout:nout,W:Wt,b:new Float64Array(nout),gW:new Float64Array(nin*nout),gb:new Float64Array(nout),mW:new Float64Array(nin*nout),vW:new Float64Array(nin*nout),mb:new Float64Array(nout),vb:new Float64Array(nout)});
      }
      epoch=0; t=0;
    }
    function forward(x){
      var a=x, as=[a], zs=[];
      for(var l=0;l<net.length;l++){
        var Ly=net[l], z=new Float64Array(Ly.nout), out=new Float64Array(Ly.nout);
        for(var j=0;j<Ly.nout;j++){ var s=Ly.b[j]; for(var i=0;i<Ly.nin;i++) s+=Ly.W[j*Ly.nin+i]*a[i]; z[j]=s;
          out[j]= (l===net.length-1)? 1/(1+Math.exp(-s)) : act(s,S.act); }
        zs.push(z); as.push(out); a=out;
      }
      return {as:as,zs:zs};
    }
    function trainEpoch(){
      var lr=+S.lr, l2=+S.l2, loss=0, correct=0, l, j, i;
      net.forEach(function(Ly){ Ly.gW.fill(0); Ly.gb.fill(0); });
      data.forEach(function(p){
        var f=forward([p[0],p[1]]), y=p[2], out=f.as[f.as.length-1][0];
        loss+= -(y*Math.log(out+1e-9)+(1-y)*Math.log(1-out+1e-9)); if((out>0.5?1:0)===y) correct++;
        var delta=new Float64Array([out-y]);
        for(l=net.length-1;l>=0;l--){
          var Ly=net[l], ain=f.as[l], prev=new Float64Array(Ly.nin);
          for(j=0;j<Ly.nout;j++){ Ly.gb[j]+=delta[j]; for(i=0;i<Ly.nin;i++){ Ly.gW[j*Ly.nin+i]+=delta[j]*ain[i]; prev[i]+=Ly.W[j*Ly.nin+i]*delta[j]; } }
          if(l>0){ for(i=0;i<Ly.nin;i++) prev[i]*=dact(f.as[l][i],f.zs[l-1][i],S.act); }
          delta=prev;
        }
      });
      t++; var n=data.length, b1=0.9, b2=0.999;
      net.forEach(function(Ly){
        function upd(P,G,M,V,reg){ for(var k=0;k<P.length;k++){ var g=G[k]/n+(reg?l2*P[k]:0); M[k]=b1*M[k]+(1-b1)*g; V[k]=b2*V[k]+(1-b2)*g*g; var mh=M[k]/(1-Math.pow(b1,t)), vh=V[k]/(1-Math.pow(b2,t)); P[k]-=lr*mh/(Math.sqrt(vh)+1e-8); } }
        upd(Ly.W,Ly.gW,Ly.mW,Ly.vW,true); upd(Ly.b,Ly.gb,Ly.mb,Ly.vb,false);
      });
      epoch++; return {loss:loss/n, acc:correct/n};
    }
    var last={loss:0,acc:0};
    function draw(){
      var P=pal(), d=canvasSetup(cv,0.62), ctx=d.ctx, w=d.w, h=d.h, G=48, cw=w/G, ch=h/G;
      var c1=hexToRgb(P.c1), c2=hexToRgb(P.c2);
      heat(ctx,w,h,G,G,function(gi,gj){
        var x=-1.25+2.5*(gi+0.5)/G, y=1.0-2.0*(gj+0.5)/G, p=forward([x,y*1.25]).as[net.length][0];
        var c=p>0.5?c1:c2; return [c[0],c[1],c[2],Math.min(1,Math.abs(p-0.5)*2)*0.45+0.04];
      });
      data.forEach(function(p){
        var px=(p[0]+1.25)/2.5*w, py=(1.0-p[1]/1.25)/2.0*h;
        ctx.beginPath(); ctx.arc(px,py,3.6,0,7); ctx.fillStyle=p[2]?P.c1:P.c2; ctx.fill(); ctx.lineWidth=1.2; ctx.strokeStyle='#fff'; ctx.stroke();
      });
      st.textContent='epoch '+epoch+' · loss '+last.loss.toFixed(3)+' · accuracy '+(last.acc*100).toFixed(1)+'%';
    }
    function loop(){ if(!running||!el.isConnected) return; for(var k=0;k<4;k++) last=trainEpoch(); draw(); if(epoch>=3000){ running=false; playBtn.textContent='▶ Train'; return; } requestAnimationFrame(loop); }
    function reset(){ running=false; playBtn.textContent='▶ Train'; data=gen(opts().ds); build(); last={loss:0,acc:0}; var f=0; data.forEach(function(){}); draw(); }
    el.querySelectorAll('[data-k]').forEach(function(i){ i.addEventListener('input',function(){ var v=q(el,'[data-v='+i.dataset.k+']'); if(v) v.textContent=i.value; reset(); }); });
    playBtn.addEventListener('click',function(){ running=!running; playBtn.textContent=running?'❚❚ Pause':'▶ Train'; if(running) loop(); });
    q(el,'[data-a=step]').addEventListener('click',function(){ running=false; playBtn.textContent='▶ Train'; for(var k=0;k<10;k++) last=trainEpoch(); draw(); });
    q(el,'[data-a=reset]').addEventListener('click',reset);
    reset(); el._redraw=draw;
  };

  // ---------- 2. Optimizer race ----------
  W.opt=function(el){
    el.innerHTML=head(el,'Optimizer race: GD vs momentum vs Adam')+
      '<div class="w-controls"><label>Surface <select data-k="fn"><option value="bowl">Ill-conditioned bowl</option><option value="rosen">Rosenbrock valley</option></select></label>'+
      '<label>Learning rate <input type="range" min="-4" max="0" step="0.1" value="-1.6" data-k="lr"><span class="val" data-v="lr"></span></label>'+
      '<button class="w-btn primary" data-a="run">▶ Run</button></div>'+
      '<canvas class="w-canvas"></canvas>'+
      '<div class="w-legend"><span><i style="background:var(--c5)"></i>Gradient descent</span><span><i style="background:var(--c2)"></i>Momentum (β = 0.9)</span><span><i style="background:var(--c3)"></i>Adam</span><span class="w-stat" data-s="stat"></span></div>'+
      '<div class="w-note">Tap the surface to pick a new starting point. Darker = lower loss; ★ = minimum. Push the learning rate up until gradient descent starts to oscillate, then compare how momentum and Adam behave.</div>';
    var cv=q(el,'canvas'), st=q(el,'[data-s=stat]'), start=null, paths=null, k=0, anim=null;
    function F(){ var fn=q(el,'[data-k=fn]').value;
      if(fn==='bowl'){ var c=Math.cos(0.5),s=Math.sin(0.5);
        return {xr:[-3,3],yr:[-2,2],min:[0,0],s0:[-2.6,1.5],
          f:function(x,y){ var u=c*x+s*y, v=-s*x+c*y; return 0.5*(u*u+20*v*v); },
          g:function(x,y){ var u=c*x+s*y, v=-s*x+c*y, gu=u, gv=20*v; return [c*gu-s*gv, s*gu+c*gv]; }}; }
      return {xr:[-2,2],yr:[-1,3],min:[1,1],s0:[-1.5,2.5],
        f:function(x,y){ return (1-x)*(1-x)+100*(y-x*x)*(y-x*x); },
        g:function(x,y){ return [-2*(1-x)-400*x*(y-x*x), 200*(y-x*x)]; }}; }
    function run(){
      var P=F(), lr=Math.pow(10,+q(el,'[data-k=lr]').value), s=start||P.s0, out=[];
      ['gd','mom','adam'].forEach(function(kind){
        var x=s[0],y=s[1],vx=0,vy=0,mx=0,my=0,sx=0,sy=0,pts=[[x,y]];
        for(var t=1;t<=300;t++){
          var g=P.g(x,y);
          if(kind==='gd'){ x-=lr*g[0]; y-=lr*g[1]; }
          else if(kind==='mom'){ vx=0.9*vx+g[0]; vy=0.9*vy+g[1]; x-=lr*vx; y-=lr*vy; }
          else { var a=Math.min(1,lr*10); mx=0.9*mx+0.1*g[0]; my=0.9*my+0.1*g[1]; sx=0.999*sx+0.001*g[0]*g[0]; sy=0.999*sy+0.001*g[1]*g[1];
                 var mhx=mx/(1-Math.pow(0.9,t)), mhy=my/(1-Math.pow(0.9,t)), shx=sx/(1-Math.pow(0.999,t)), shy=sy/(1-Math.pow(0.999,t));
                 x-=a*mhx/(Math.sqrt(shx)+1e-8); y-=a*mhy/(Math.sqrt(shy)+1e-8); }
          if(!isFinite(x)||!isFinite(y)||Math.abs(x)>1e3||Math.abs(y)>1e3){ pts.push([x>0?1e3:-1e3,y>0?1e3:-1e3]); break; }
          pts.push([x,y]);
        }
        out.push(pts);
      });
      paths=out; k=1; if(anim) cancelAnimationFrame(anim); step();
    }
    function step(){ if(!el.isConnected) return; draw(); if(k<301){ k+=3; anim=requestAnimationFrame(step); } }
    function draw(){
      var P=pal(), Fn=F(), d=canvasSetup(cv,0.6), ctx=d.ctx, w=d.w, h=d.h, G=60;
      q(el,'[data-v=lr]').textContent=Math.pow(10,+q(el,'[data-k=lr]').value).toPrecision(2);
      function X(x){ return (x-Fn.xr[0])/(Fn.xr[1]-Fn.xr[0])*w; } function Y(y){ return h-(y-Fn.yr[0])/(Fn.yr[1]-Fn.yr[0])*h; }
      var vals=[], mx=-1e9, mn=1e9;
      for(var i=0;i<G;i++) for(var j=0;j<G;j++){ var x=Fn.xr[0]+(i+0.5)/G*(Fn.xr[1]-Fn.xr[0]), y=Fn.yr[1]-(j+0.5)/G*(Fn.yr[1]-Fn.yr[0]), v=Math.log(1+Fn.f(x,y)); vals.push(v); if(v>mx)mx=v; if(v<mn)mn=v; }
      var c=hexToRgb(P.c1);
      heat(ctx,w,h,G,G,function(i,j){ var v2=(vals[i*G+j]-mn)/(mx-mn); return [c[0],c[1],c[2],0.55*(1-v2)+0.03]; });
      ctx.fillStyle=P.text; ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('★',X(Fn.min[0]),Y(Fn.min[1]));
      if(paths){
        var cols=[P.c5,P.c2,P.c3], txt=[];
        paths.forEach(function(p,ix){
          ctx.strokeStyle=cols[ix]; ctx.lineWidth=2.2; ctx.beginPath();
          var n=Math.min(k,p.length); for(var t=0;t<n;t++){ var px=X(p[t][0]),py=Y(p[t][1]); if(t===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();
          var e=p[n-1]; ctx.beginPath(); ctx.arc(X(e[0]),Y(e[1]),4.5,0,7); ctx.fillStyle=cols[ix]; ctx.fill();
          var fv=Fn.f(e[0],e[1]); txt.push(['GD','Mom','Adam'][ix]+' '+(isFinite(fv)&&Math.abs(e[0])<1e3?fv.toExponential(1):'diverged'));
        });
        st.textContent='loss after '+Math.min(k-1,300)+' steps — '+txt.join(' · ');
      }
    }
    cv.addEventListener('click',function(ev){ var r=cv.getBoundingClientRect(), Fn=F(); start=[Fn.xr[0]+(ev.clientX-r.left)/r.width*(Fn.xr[1]-Fn.xr[0]), Fn.yr[1]-(ev.clientY-r.top)/r.height*(Fn.yr[1]-Fn.yr[0])]; run(); });
    q(el,'[data-a=run]').addEventListener('click',run);
    q(el,'[data-k=fn]').addEventListener('change',function(){ var fn=this.value; q(el,'[data-k=lr]').value=fn==='bowl'?-1.6:-3.0; start=null; run(); });
    q(el,'[data-k=lr]').addEventListener('input',run);
    run(); el._redraw=draw;
  };

  // ---------- 3. Polynomial overfitting ----------
  W.poly=function(el){
    el.innerHTML=head(el,'Underfitting vs overfitting')+
      '<div class="w-controls"><label>Polynomial degree <input type="range" min="0" max="13" value="3" data-k="deg"><span class="val" data-v="deg">3</span></label>'+
      '<label>Ridge λ <input type="range" min="-8" max="1" step="0.5" value="-8" data-k="lam"><span class="val" data-v="lam"></span></label>'+
      '<button class="w-btn" data-a="new">New data</button></div>'+
      '<canvas class="w-canvas"></canvas>'+
      '<div class="w-legend"><span><i style="background:var(--c1)"></i>fitted model</span><span><i style="background:var(--muted)"></i>true function</span><span><i style="background:var(--c2)"></i>training points</span><span class="w-stat" data-s="stat"></span></div>'+
      '<div class="w-note">14 noisy training points from sin(πx). Low degree: high bias (underfits). High degree with λ ≈ 0: the curve threads every point and test error explodes (high variance). Then raise λ and watch ridge regularization tame it.</div>';
    var cv=q(el,'canvas'), st=q(el,'[data-s=stat]'), seed=3, tr=[], te=[];
    function truef(x){ return Math.sin(Math.PI*x); }
    function genData(){ var r=rng(seed); tr=[]; te=[]; for(var i=0;i<14;i++){ var x=r()*2-1; tr.push([x,truef(x)+randn(r)*0.25]); } for(i=0;i<200;i++){ x=r()*2-1; te.push([x,truef(x)+randn(r)*0.25]); } }
    function feats(x,d){ var P=[1,x]; for(var n=1;n<d;n++) P.push(((2*n+1)*x*P[n]-n*P[n-1])/(n+1)); return P.slice(0,d+1); }
    function solve(A,b){ var n=b.length,i,j,k; for(i=0;i<n;i++){ var m=i; for(k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[m][i])) m=k; var t=A[i];A[i]=A[m];A[m]=t; t=b[i];b[i]=b[m];b[m]=t;
      for(k=i+1;k<n;k++){ var f=A[k][i]/A[i][i]; for(j=i;j<n;j++) A[k][j]-=f*A[i][j]; b[k]-=f*b[i]; } } var x=new Array(n); for(i=n-1;i>=0;i--){ var s=b[i]; for(j=i+1;j<n;j++) s-=A[i][j]*x[j]; x[i]=s/A[i][i]; } return x; }
    function fit(d,lam){ var m=d+1, A=[], b=[], i, j; for(i=0;i<m;i++){ A.push(new Array(m).fill(0)); b.push(0); }
      tr.forEach(function(p){ var f=feats(p[0],d); for(i=0;i<m;i++){ b[i]+=f[i]*p[1]; for(j=0;j<m;j++) A[i][j]+=f[i]*f[j]; } });
      for(i=0;i<m;i++) A[i][i]+=lam+1e-10; return solve(A,b); }
    function pred(w,x){ var f=feats(x,w.length-1), s=0; for(var i=0;i<w.length;i++) s+=w[i]*f[i]; return s; }
    function draw(){
      var P=pal(), d=+q(el,'[data-k=deg]').value, le=+q(el,'[data-k=lam]').value, lam=le<=-8?0:Math.pow(10,le);
      q(el,'[data-v=deg]').textContent=d; q(el,'[data-v=lam]').textContent=lam===0?'0':lam.toExponential(0);
      var w=fit(d,lam), D=canvasSetup(cv,0.55), ctx=D.ctx, W_=D.w, H=D.h;
      function X(x){ return (x+1.05)/2.1*W_; } function Y(y){ return H/2-y*H/5; }
      ctx.strokeStyle=P.border; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,Y(0)); ctx.lineTo(W_,Y(0)); ctx.stroke();
      ctx.strokeStyle=P.muted; ctx.setLineDash([5,4]); ctx.lineWidth=1.6; ctx.beginPath(); for(var i=0;i<=200;i++){ var x=-1.05+2.1*i/200; i?ctx.lineTo(X(x),Y(truef(x))):ctx.moveTo(X(x),Y(truef(x))); } ctx.stroke(); ctx.setLineDash([]);
      te.forEach(function(p){ ctx.beginPath(); ctx.arc(X(p[0]),Y(p[1]),1.8,0,7); ctx.fillStyle=rgba(P.muted,0.35); ctx.fill(); });
      ctx.strokeStyle=P.c1; ctx.lineWidth=2.6; ctx.beginPath(); for(i=0;i<=400;i++){ x=-1+2*i/400; var y=Math.max(-3,Math.min(3,pred(w,x))); i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)); } ctx.stroke();
      tr.forEach(function(p){ ctx.beginPath(); ctx.arc(X(p[0]),Y(p[1]),5,0,7); ctx.fillStyle=P.c2; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.3; ctx.stroke(); });
      function mse(S){ var s=0; S.forEach(function(p){ var e=pred(w,p[0])-p[1]; s+=e*e; }); return s/S.length; }
      var a=mse(tr), b=mse(te); st.textContent='train MSE '+a.toFixed(3)+' · test MSE '+(b>99?b.toExponential(1):b.toFixed(3));
    }
    el.querySelectorAll('[data-k]').forEach(function(i){ i.addEventListener('input',draw); });
    q(el,'[data-a=new]').addEventListener('click',function(){ seed++; genData(); draw(); });
    genData(); draw(); el._redraw=draw;
  };

  // ---------- 4. k-means ----------
  W.kmeans=function(el){
    el.innerHTML=head(el,'k-means, one step at a time')+
      '<div class="w-controls"><label>k <input type="range" min="2" max="6" value="3" data-k="k"><span class="val" data-v="k">3</span></label>'+
      '<button class="w-btn primary" data-a="step">Step</button><button class="w-btn" data-a="run">Run to convergence</button><button class="w-btn" data-a="init">Re-initialize</button><button class="w-btn" data-a="new">New data</button></div>'+
      '<canvas class="w-canvas"></canvas><div class="w-stat" data-s="stat" style="margin-top:6px"></div>'+
      '<div class="w-note">Each step alternates the two halves of Lloyd\'s algorithm: <b>assign</b> each point to its nearest centroid (✕), then <b>move</b> each centroid to the mean of its points. Inertia (sum of squared distances) can only go down. Re-initialize a few times: different starts can land in different local optima.</div>';
    var cv=q(el,'canvas'), st=q(el,'[data-s=stat]'), pts=[], C=[], A=[], it=0, phase=0, seed=1, iseed=100;
    function gen(){ var r=rng(seed), centers=[[-0.5,0.4],[0.5,0.5],[0.0,-0.5],[0.7,-0.3]]; pts=[]; for(var i=0;i<180;i++){ var c=centers[i%4]; pts.push([c[0]+randn(r)*0.15,c[1]+randn(r)*0.15]); } }
    function init(){ var r=rng(iseed++), k=+q(el,'[data-k=k]').value; C=[]; for(var i=0;i<k;i++){ var p=pts[Math.floor(r()*pts.length)]; C.push([p[0],p[1]]); } A=pts.map(function(){return -1;}); it=0; phase=0; draw(); }
    function assign(){ var ch=0; pts.forEach(function(p,i){ var b=0,bd=1e9; C.forEach(function(c,j){ var d=(p[0]-c[0])*(p[0]-c[0])+(p[1]-c[1])*(p[1]-c[1]); if(d<bd){bd=d;b=j;} }); if(A[i]!==b) ch++; A[i]=b; }); return ch; }
    function move(){ C=C.map(function(c,j){ var sx=0,sy=0,n=0; pts.forEach(function(p,i){ if(A[i]===j){sx+=p[0];sy+=p[1];n++;} }); return n?[sx/n,sy/n]:c; }); }
    function inertia(){ var s=0; pts.forEach(function(p,i){ if(A[i]<0) return; var c=C[A[i]]; s+=(p[0]-c[0])*(p[0]-c[0])+(p[1]-c[1])*(p[1]-c[1]); }); return s; }
    function step(){ var ch=0; if(phase===0){ ch=assign(); phase=1; } else { move(); phase=0; it++; } draw(); return ch; }
    function draw(){
      var P=pal(), cols=[P.c1,P.c2,P.c3,P.c4,P.c5,P.muted], d=canvasSetup(cv,0.6), ctx=d.ctx, w=d.w, h=d.h;
      function X(x){ return (x+1.1)/2.2*w; } function Y(y){ return (1.0-y)/2.0*h; }
      pts.forEach(function(p,i){ ctx.beginPath(); ctx.arc(X(p[0]),Y(p[1]),3.6,0,7); ctx.fillStyle=A[i]<0?rgba(P.muted,0.5):rgba(cols[A[i]],0.8); ctx.fill(); });
      C.forEach(function(c,j){ var x=X(c[0]), y=Y(c[1]); ctx.lineWidth=5; ctx.strokeStyle=P.surface; ctx.beginPath(); ctx.moveTo(x-8,y-8); ctx.lineTo(x+8,y+8); ctx.moveTo(x+8,y-8); ctx.lineTo(x-8,y+8); ctx.stroke(); ctx.lineWidth=3; ctx.strokeStyle=cols[j]; ctx.stroke(); });
      st.textContent='iteration '+it+' · next: '+(phase===0?'assign points':'move centroids')+(A[0]>=0?' · inertia '+inertia().toFixed(2):'');
    }
    q(el,'[data-a=step]').addEventListener('click',step);
    q(el,'[data-a=run]').addEventListener('click',function(){ var n=0; (function go(){ if(!el.isConnected) return; var ch=step(); n++; if(n<60 && !(phase===1 && ch===0 && it>0)) setTimeout(go,220); })(); });
    q(el,'[data-a=init]').addEventListener('click',init);
    q(el,'[data-a=new]').addEventListener('click',function(){ seed++; gen(); init(); });
    q(el,'[data-k=k]').addEventListener('input',function(){ q(el,'[data-v=k]').textContent=this.value; init(); });
    gen(); init(); el._redraw=draw;
  };

  // ---------- 5. Convolution explorer ----------
  W.conv=function(el){
    var K={ 'Vertical edge':[[1,0,-1],[2,0,-2],[1,0,-1]], 'Horizontal edge':[[1,2,1],[0,0,0],[-1,-2,-1]], 'Blur (box)':[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]], 'Sharpen':[[0,-1,0],[-1,5,-1],[0,-1,0]], 'Identity':[[0,0,0],[0,1,0],[0,0,0]] };
    var opt=Object.keys(K).map(function(k){return '<option>'+k+'</option>';}).join('');
    el.innerHTML=head(el,'Convolution explorer')+
      '<div class="w-controls"><label>Kernel <select data-k="ker">'+opt+'</select></label><span class="w-stat" data-s="stat"></span></div>'+
      '<div class="w-grids"><div><div class="w-grid" data-g="in"></div><div class="w-cap">input 8×8 (tap to toggle pixels)</div></div><div><div class="w-grid" data-g="k"></div><div class="w-cap">kernel 3×3</div></div><div><div class="w-grid" data-g="out"></div><div class="w-cap">output 6×6 (tap a cell)</div></div></div>'+
      '<div class="w-note">The output cell you select is the sum of the highlighted 3×3 input patch multiplied element-wise by the kernel. Blue = positive, orange = negative. Edge kernels light up where brightness changes; the blur kernel averages.</div>';
    var img=[], sel=[2,2];
    for(var i=0;i<8;i++){ img.push([]); for(var j=0;j<8;j++) img[i].push((i>=2&&i<=5&&j>=2&&j<=5)?1:0); }
    img[1][4]=1; img[6][3]=1;
    function color(v,m){ var P=pal(), a=Math.min(1,Math.abs(v)/(m||1)); return v>=0?rgba(P.c1,0.08+0.82*a):rgba(P.c2,0.08+0.82*a); }
    function render(){
      var k=K[q(el,'[data-k=ker]').value], out=[], mx=0;
      for(var i=0;i<6;i++){ out.push([]); for(var j=0;j<6;j++){ var s=0; for(var m=0;m<3;m++) for(var n=0;n<3;n++) s+=img[i+m][j+n]*k[m][n]; out[i].push(s); mx=Math.max(mx,Math.abs(s)); } }
      var g=q(el,'[data-g=in]'); g.style.gridTemplateColumns='repeat(8,auto)'; g.innerHTML='';
      for(i=0;i<8;i++) for(j=0;j<8;j++){ var d=document.createElement('div'); d.style.background=img[i][j]?pal().text:pal().bg; d.style.borderColor=pal().border;
        if(i>=sel[0]&&i<sel[0]+3&&j>=sel[1]&&j<sel[1]+3){ d.style.outline='2.5px solid '+pal().c2; d.style.outlineOffset='-2px'; }
        (function(a,b){ d.onclick=function(){ img[a][b]=1-img[a][b]; render(); }; })(i,j); g.appendChild(d); }
      var gk=q(el,'[data-g=k]'); gk.style.gridTemplateColumns='repeat(3,auto)'; gk.innerHTML='';
      k.forEach(function(r){ r.forEach(function(v){ var d=document.createElement('div'); d.style.background=color(v,2); d.textContent=Math.abs(v-Math.round(v))<1e-9?v:v.toFixed(2); gk.appendChild(d); }); });
      var go=q(el,'[data-g=out]'); go.style.gridTemplateColumns='repeat(6,auto)'; go.innerHTML='';
      for(i=0;i<6;i++) for(j=0;j<6;j++){ var dd=document.createElement('div'); var v=out[i][j]; dd.style.background=color(v,mx||1); dd.textContent=(Math.abs(v-Math.round(v))<1e-9?v:v.toFixed(1)); if(i===sel[0]&&j===sel[1]) dd.className='sel';
        (function(a,b){ dd.onclick=function(){ sel=[a,b]; render(); }; })(i,j); go.appendChild(dd); }
      var parts=[]; for(var m2=0;m2<3;m2++) for(var n2=0;n2<3;n2++) if(k[m2][n2]!==0 && img[sel[0]+m2][sel[1]+n2]) parts.push(+k[m2][n2].toFixed(2));
      q(el,'[data-s=stat]').textContent='out['+sel[0]+','+sel[1]+'] = '+(parts.length?parts.join(' + ').replace(/\+ -/g,'− '):'0')+' = '+(+out[sel[0]][sel[1]].toFixed(2));
    }
    q(el,'[data-k=ker]').addEventListener('change',render); render(); el._redraw=render;
  };

  // ---------- 6. Attention explorer ----------
  W.attn=function(el){
    var toks=['The','animal','didn\'t','cross','the','street','because','it','was','too','tired'];
    var heads={
      'Previous token':function(i,j){ return j===i-1?3:(j===i?1.2:0); },
      'Coreference ("it")':function(i,j){ if(i===7) return j===1?3.2:(j===5?1.6:(j===7?0.8:0)); return j===i?2:(Math.abs(i-j)===1?0.8:0); },
      'Subject → verb':function(i,j){ var m={2:1,3:1,8:7,10:7,9:8}; if(m[i]!==undefined) return j===m[i]?3:(j===i?1:0); return j===i?1.5:0; },
      'Uniform (no learning)':function(){ return 0; }
    };
    var opt=Object.keys(heads).map(function(k){return '<option>'+k+'</option>';}).join('');
    el.innerHTML=head(el,'Attention explorer')+
      '<div class="w-controls"><label>Head <select data-k="h">'+opt+'</select></label><label><input type="checkbox" data-k="causal" checked> causal mask</label></div>'+
      '<div class="w-tokens" data-t="t"></div><div class="w-bars" data-b="b"></div>'+
      '<div class="w-note">Tap a word to make it the <b>query</b>; shading shows where it attends (softmax over scores). These heads are hand-built illustrations of patterns found in real models, not weights from a trained network. Note how the causal mask stops "it" from looking ahead.</div>';
    var qi=7;
    function render(){
      var P=pal(), h=heads[q(el,'[data-k=h]').value], causal=q(el,'[data-k=causal]').checked, sc=[], mx=-1e9;
      toks.forEach(function(_,j){ var s=(causal&&j>qi)?-Infinity:h(qi,j); sc.push(s); if(s>mx) mx=s; });
      var e=sc.map(function(s){ return isFinite(s)?Math.exp(s-mx):0; }), Z=e.reduce(function(a,b){return a+b;},0), w=e.map(function(v){return v/Z;});
      var T=q(el,'[data-t=t]'); T.innerHTML='';
      toks.forEach(function(t,j){ var d=document.createElement('span'); d.className='w-tok'+(j===qi?' q':''); d.textContent=t; d.style.background=rgba(P.c1,(0.05+0.9*w[j]).toFixed(3)); d.style.color=w[j]>0.45?'#fff':''; if(causal&&j>qi) d.style.opacity='0.35';
        d.onclick=function(){ qi=j; render(); }; T.appendChild(d); });
      var B=q(el,'[data-b=b]'); B.innerHTML='';
      w.map(function(v,j){return [v,j];}).sort(function(a,b){return b[0]-a[0];}).slice(0,4).forEach(function(p){
        B.insertAdjacentHTML('beforeend','<div class="w-bar"><span>'+toks[p[1]]+'</span><div class="track"><div class="fill" style="width:'+(p[0]*100).toFixed(1)+'%"></div></div><span class="p">'+p[0].toFixed(2)+'</span></div>'); });
    }
    el.querySelectorAll('[data-k]').forEach(function(i){ i.addEventListener('change',render); }); render(); el._redraw=render;
  };

  // ---------- 7. Sampling: temperature, top-k, top-p ----------
  W.sampling=function(el){
    var toks=['mat','floor','sofa','bed','roof','table','moon','banana'], logits=[3.2,2.6,2.3,1.8,1.0,0.9,-0.5,-1.5];
    el.innerHTML=head(el,'Next-token sampling: temperature, top-k, top-p')+
      '<div class="w-controls" style="font-size:15px;color:var(--text)">"The cat sat on the ___"</div>'+
      '<div class="w-controls"><label>Temperature <input type="range" min="0.05" max="2.5" step="0.05" value="1" data-k="T"><span class="val" data-v="T"></span></label>'+
      '<label>Top-k <input type="range" min="1" max="8" value="8" data-k="k"><span class="val" data-v="k"></span></label>'+
      '<label>Top-p <input type="range" min="0.1" max="1" step="0.05" value="1" data-k="p"><span class="val" data-v="p"></span></label>'+
      '<button class="w-btn primary" data-a="s">Sample 20</button></div>'+
      '<div class="w-bars" data-b="b"></div><div class="w-stat" data-s="s" style="margin-top:8px"></div>'+
      '<div class="w-note">Bars show the final sampling distribution after temperature scaling, then top-k, then top-p filtering and renormalization. Grey tokens can never be sampled. Low temperature → near-greedy and repetitive; high temperature → diverse but sometimes nonsensical ("banana").</div>';
    var last='';
    function probs(){
      var T=+q(el,'[data-k=T]').value, K=+q(el,'[data-k=k]').value, Pp=+q(el,'[data-k=p]').value;
      q(el,'[data-v=T]').textContent=T.toFixed(2); q(el,'[data-v=k]').textContent=K; q(el,'[data-v=p]').textContent=Pp.toFixed(2);
      var z=logits.map(function(l){return l/T;}), m=Math.max.apply(null,z), e=z.map(function(v){return Math.exp(v-m);}), Z=e.reduce(function(a,b){return a+b;},0), p=e.map(function(v){return v/Z;});
      var order=p.map(function(v,i){return i;}).sort(function(a,b){return p[b]-p[a];}), keep={}, cum=0;
      order.forEach(function(i,r){ if(r<K && cum<Pp){ keep[i]=1; cum+=p[i]; } });
      var Zk=0; order.forEach(function(i){ if(keep[i]) Zk+=p[i]; });
      var H=0; p.forEach(function(v){ if(v>0) H-=v*Math.log2(v); });
      return {p:p.map(function(v,i){return keep[i]?v/Zk:0;}), keep:keep, H:H};
    }
    function render(){
      var r=probs(), B=q(el,'[data-b=b]'); B.innerHTML='';
      toks.forEach(function(t,i){ B.insertAdjacentHTML('beforeend','<div class="w-bar'+(r.keep[i]?'':' off')+'"><span>'+t+'</span><div class="track"><div class="fill" style="width:'+(r.p[i]*100).toFixed(1)+'%"></div></div><span class="p">'+r.p[i].toFixed(3)+'</span></div>'); });
      q(el,'[data-s=s]').textContent='entropy before filtering: '+r.H.toFixed(2)+' bits'+(last?' · samples: '+last:'');
    }
    q(el,'[data-a=s]').addEventListener('click',function(){ var r=probs(), out=[]; for(var n=0;n<20;n++){ var u=Math.random(), c=0; for(var i=0;i<toks.length;i++){ c+=r.p[i]; if(u<=c){ out.push(toks[i]); break; } } } last=out.join(' '); render(); });
    el.querySelectorAll('[data-k]').forEach(function(i){ i.addEventListener('input',function(){ last=''; render(); }); }); render(); el._redraw=render;
  };

  // ---------- 8. Single neuron ----------
  W.neuron=function(el){
    el.innerHTML=head(el,'One neuron, two inputs')+
      '<div class="w-controls"><label>w₁ <input type="range" min="-4" max="4" step="0.1" value="1.5" data-k="w1"><span class="val" data-v="w1"></span></label>'+
      '<label>w₂ <input type="range" min="-4" max="4" step="0.1" value="-1" data-k="w2"><span class="val" data-v="w2"></span></label>'+
      '<label>b <input type="range" min="-3" max="3" step="0.1" value="0" data-k="b"><span class="val" data-v="b"></span></label>'+
      '<label>φ <select data-k="act"><option value="sigmoid">sigmoid</option><option value="relu">ReLU</option><option value="tanh">tanh</option><option value="step">step</option></select></label></div>'+
      '<canvas class="w-canvas"></canvas>'+
      '<div class="w-note">Shading is the neuron\'s output ŷ = φ(w₁x₁ + w₂x₂ + b) over the input plane. The weights set the <b>direction</b> of the boundary (the dashed line where wᵀx + b = 0), their size sets how <b>sharp</b> it is, and the bias <b>shifts</b> it. One neuron can only draw a straight line, which is why we need layers.</div>';
    var cv=q(el,'canvas');
    function draw(){
      var P=pal(), v={}; el.querySelectorAll('[data-k]').forEach(function(i){ v[i.dataset.k]=i.value; var s=q(el,'[data-v='+i.dataset.k+']'); if(s) s.textContent=(+i.value).toFixed(1); });
      var d=canvasSetup(cv,0.55), ctx=d.ctx, w=d.w, h=d.h, G=60, c=hexToRgb(P.c1);
      function f(z){ if(v.act==='sigmoid') return 1/(1+Math.exp(-z)); if(v.act==='relu') return Math.min(1,Math.max(0,z)/3); if(v.act==='tanh') return (Math.tanh(z)+1)/2; return z>0?1:0; }
      heat(ctx,w,h,G,G,function(i,j){ var x1=-3+6*(i+0.5)/G, x2=3*(1-2*(j+0.5)/G)*h/w, z=+v.w1*x1+(+v.w2)*x2+(+v.b); return [c[0],c[1],c[2],0.04+0.7*f(z)]; });
      var sy=w/6; function X(x){ return (x+3)/6*w; } function Y(y){ return h/2-y*sy; }
      ctx.strokeStyle=P.text; ctx.setLineDash([6,4]); ctx.lineWidth=2; ctx.beginPath();
      if(Math.abs(+v.w2)>1e-6){ ctx.moveTo(X(-3),Y((-(+v.w1)*-3-(+v.b))/(+v.w2))); ctx.lineTo(X(3),Y((-(+v.w1)*3-(+v.b))/(+v.w2))); } else if(Math.abs(+v.w1)>1e-6){ var xx=-(+v.b)/(+v.w1); ctx.moveTo(X(xx),0); ctx.lineTo(X(xx),h); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=P.c2; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(X(0),Y(0)); ctx.lineTo(X(+v.w1*0.5),Y(+v.w2*0.5)); ctx.stroke();
      ctx.fillStyle=P.c2; ctx.font='600 13px sans-serif'; ctx.fillText('w',X(+v.w1*0.5)+6,Y(+v.w2*0.5)-6);
    }
    el.querySelectorAll('[data-k]').forEach(function(i){ i.addEventListener('input',draw); }); draw(); el._redraw=draw;
  };

const mounted = new Set();
let listening = false;
function redrawAll() { mounted.forEach(function (el) { if (el._redraw) el._redraw(); }); }

export const widgetNames = Object.keys(W);

export function mountWidget(el, name) {
  const f = W[name];
  if (!f) { el.textContent = 'Unknown widget: ' + name; return function () {}; }
  try { f(el); } catch (e) { el.innerHTML = '<div class="w-note">This interactive demo could not start in this browser.</div>'; }
  mounted.add(el);
  if (!listening) {
    listening = true;
    let t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(redrawAll, 200); });
    window.addEventListener('themechange', function () { setTimeout(redrawAll, 30); });
  }
  return function () { mounted.delete(el); el.innerHTML = ''; };
}
