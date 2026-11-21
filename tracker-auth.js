'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const client=window.supabase.createClient('https://leswjledtrdxlntuccga.supabase.co','sb_publishable_EpL8VCWrh7FiXkIr4PCioQ_xJU7o4RB',{
    auth:{persistSession:false,detectSessionInUrl:false,autoRefreshToken:true}
  });
  const template=$('practice-room').innerHTML;
  let tracker=null,requestedEmail='',waitUntil=0,waitTimer=null;
  const note=text=>{$('auth-status').textContent=text;};
  function describe(error,fallback){
    const code=typeof error?.code==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(error.code)?error.code:'';
    const http=Number.isInteger(error?.status)&&error.status>0?`HTTP ${error.status}`:'';
    const suffix=[http,code].filter(Boolean).join(' / ');
    let text=fallback;
    if(error?.status===429||code==='over_email_send_rate_limit')text='요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.';
    else if(code==='otp_expired')text='인증번호가 맞지 않거나 만료됐습니다. 번호를 확인하거나 새로 받아 주세요.';
    else if(error?.status>=500)text='인증 요청 처리에 실패했습니다. 운영자에게 Authentication 로그와 Gmail SMTP 설정 확인을 요청해 주세요.';
    return suffix?`${text} [${suffix}]`:text;
  }
  function cooldown(){
    const seconds=Math.max(0,Math.ceil((waitUntil-Date.now())/1000));
    $('send').disabled=seconds>0;
    $('send').textContent=seconds?`${seconds}초 후 다시 받기`:'인증번호 받기';
    if(!seconds){clearInterval(waitTimer);waitTimer=null;}
  }
  function lock(){
    if(tracker)tracker.destroy();tracker=null;
    $('practice-room').hidden=true;
    $('user-controls').hidden=true;
    $('practice-room').innerHTML=template;
    $('auth').hidden=false;
    $('verify-form').hidden=true;
    $('token').value='';$('email').value='';$('consent').checked=false;
    $('account').textContent='';requestedEmail='';
  }
  lock();
  $('send-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(!$('send-form').reportValidity()||waitUntil>Date.now())return;
    $('send').disabled=true;$('email').readOnly=true;note('인증메일을 요청하고 있습니다.');
    try{
      requestedEmail=$('email').value.trim();
      const {error}=await client.auth.signInWithOtp({email:requestedEmail,options:{shouldCreateUser:true,data:{tracker_notice_version:'seoul-tracker-v1',tracker_consent_at:new Date().toISOString()}}});
      if(error)throw error;
      $('sent-to').textContent=`${requestedEmail}로 요청했습니다. 수신함과 스팸함을 확인해 주세요.`;
      $('verify-form').hidden=false;waitUntil=Date.now()+60000;cooldown();waitTimer=setInterval(cooldown,1000);
      note('메일에 표시된 인증번호를 입력해 주세요.');$('token').focus();
    }catch(error){note(describe(error,'메일 요청에 실패했습니다. 인터넷 연결과 인증 설정을 확인해 주세요.'));$('send').disabled=false;}
    finally{$('email').readOnly=false;}
  });
  $('verify-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!$('verify-form').reportValidity()||!requestedEmail)return;
    $('verify').disabled=true;$('email').disabled=true;$('send').disabled=true;note('인증번호를 확인하고 있습니다.');
    try{
      const {data,error}=await client.auth.verifyOtp({email:requestedEmail,token:$('token').value.trim(),type:'email'});
      if(error||!data?.session||!data.user?.email_confirmed_at)throw error||new Error('Unconfirmed');
      $('token').value='';$('auth').hidden=true;
      $('practice-room').innerHTML=template;
      tracker=window.createDMZTracker(data.user.id);
      $('account').textContent=data.user.email;$('user-controls').hidden=false;$('practice-room').hidden=false;note('');
    }catch(error){note(describe(error,'인증에 실패했습니다. 이메일과 인증번호를 확인해 주세요.'));}
    finally{$('verify').disabled=false;$('email').disabled=false;cooldown();}
  });
  $('email').addEventListener('input',()=>{$('verify-form').hidden=true;$('token').value='';});
  $('logout').addEventListener('click',async()=>{
    lock();note('로그아웃 중입니다.');
    try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;note('로그아웃했습니다. 실천 기록은 이 브라우저에 남아 있으며 같은 계정으로 인증하면 다시 볼 수 있습니다.');}
    catch{note('로그아웃 요청이 완료되지 않았습니다. 이 탭을 닫아 인증 세션을 종료해 주세요.');}
  });
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')lock();});
  window.addEventListener('pagehide',()=>{if(tracker)tracker.destroy();});
})();
