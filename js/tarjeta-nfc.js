/* =====================================================
   Tarjeta NFC 3D (giro, inclinación y reflejo).
   Independiente: solo necesita #qvCard, #qvFront, #qvBack,
   #qvShadow y #qvStage.
   ===================================================== */

(function(){
  var card=document.getElementById('qvCard'),
      front=document.getElementById('qvFront'),
      back=document.getElementById('qvBack'),
      shadow=document.getElementById('qvShadow'),
      stage=document.getElementById('qvStage');
  if(!card||!stage) return;

  for(var i=-5;i<=5;i++){
    var l=document.createElement('div');
    l.className='qv-layer';
    l.style.transform='translateZ('+i+'px)';
    if(i===0) l.style.boxShadow='0 0 14px rgba(109,255,122,.55)'; /* solo una capa brilla: 11 sombras era carísimo */
    card.insertBefore(l,card.firstChild);
  }

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASE=reduce?0.1:0.45;
  var rot=-25, vel=BASE, tiltX=0, tiltY=0, tx=0, ty=0;
  var drag=false, lastX=0, hover=false;

  stage.addEventListener('pointermove',function(e){
    var r=stage.getBoundingClientRect();
    ty=((e.clientX-r.left)/r.width-.5)*14;
    tx=-((e.clientY-r.top)/r.height-.5)*16;
    if(drag){ var dx=e.clientX-lastX; rot+=dx*.5; vel=dx*.5; lastX=e.clientX; }
  });
  stage.addEventListener('pointerdown',function(e){drag=true;lastX=e.clientX;card.classList.add('drag');});
  window.addEventListener('pointerup',function(){drag=false;card.classList.remove('drag');});
  stage.addEventListener('pointerleave',function(){tx=0;ty=0;hover=false;});
  stage.addEventListener('pointerenter',function(){hover=true;});

  var raf=0;
  function frame(){
    if(!drag){
      var target=hover?BASE*.35:BASE;
      vel+=(target-vel)*.04;
      rot+=vel;
    }
    tiltX+=(tx-tiltX)*.08; tiltY+=(ty-tiltY)*.08;
    card.style.transform='rotateX('+tiltX+'deg) rotateY('+(rot+tiltY)+'deg) rotateZ(-4deg)';
    var a=rot*Math.PI/180, s=Math.sin(a), c=Math.cos(a);
    if(c>=0) front.style.setProperty('--s',(50+80*s)+'%');
    else back.style.setProperty('--s',(50-80*s)+'%');
    shadow.style.transform='translateX(-50%) scaleX('+(.45+.55*Math.abs(c))+')';
    raf=requestAnimationFrame(frame);
  }
  function start(){ if(!raf) raf=requestAnimationFrame(frame); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ en[0].isIntersecting ? start() : stop(); }).observe(stage);
  } else start();
  document.addEventListener('visibilitychange',function(){ document.hidden ? stop() : start(); });
  frame();
})();
