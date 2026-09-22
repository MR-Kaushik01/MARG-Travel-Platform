const API=localStorage.getItem("marg_api")||window.MARG_API_URL||"http://localhost:4000";
async function send(path,body){const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d}
function setMsg(t){const x=document.querySelector("#msg");if(x)x.textContent=t}
function setOtpMsg(t){const x=document.querySelector("#otpMsg");if(x)x.textContent=t}
function showOtp(challenge,mode){
 const box=document.querySelector("#otpStep"); if(!box)return;
 box.hidden=false; document.querySelector("#otpChallenge").value=challenge.id;
 const smsWrap=document.querySelector("#smsOtpWrap"); if(smsWrap)smsWrap.hidden=!challenge.smsRequired; const smsInput=document.querySelector("#smsOtp"); if(smsInput)smsInput.required=Boolean(challenge.smsRequired);
 const emailText=document.querySelector("#otpEmailText"); if(emailText)emailText.textContent=`Email OTP sent. ${challenge.smsRequired?"SMS OTP sent to your registered phone too.":""}`;
 const form=document.querySelector("#otpForm"); if(form)form.dataset.mode=mode;
 window.scrollTo({top:box.offsetTop-30,behavior:"smooth"});
}

const tl=document.querySelector("#travellerLogin");
if(tl)tl.onsubmit=async e=>{e.preventDefault();try{const d=await send("/api/auth/login/start",{email:document.querySelector("#email").value,password:document.querySelector("#password").value,role:"TRAVELER"});showOtp(d,"TRAVELER_LOGIN");setMsg("");setOtpMsg("Enter both codes to finish login.")}catch(x){setMsg(x.message)}};

const tr=document.querySelector("#travellerRegister");
if(tr)tr.onsubmit=async e=>{e.preventDefault();try{const d=await send("/api/auth/register/start",{name:document.querySelector("#name").value,email:document.querySelector("#email").value,password:document.querySelector("#password").value});showOtp(d,"TRAVELER_REGISTER");setMsg("");setOtpMsg("Enter both codes to verify your Traveller account.")}catch(x){setMsg(x.message)}};

const pl=document.querySelector("#providerLogin");
if(pl)pl.onsubmit=async e=>{e.preventDefault();try{const d=await send("/api/auth/login/start",{email:document.querySelector("#email").value,password:document.querySelector("#password").value,role:"VENDOR"});showOtp(d,"PROVIDER_LOGIN");setMsg("");setOtpMsg("Enter both codes to finish Service Provider login.")}catch(x){setMsg(x.message)}};

const pr=document.querySelector("#providerRegister");
if(pr)pr.onsubmit=async e=>{e.preventDefault();try{const d=await send("/api/auth/provider-register/start",{name:document.querySelector("#name").value,email:document.querySelector("#email").value,password:document.querySelector("#password").value,phone:document.querySelector("#phone").value});showOtp(d,"PROVIDER_REGISTER");setMsg("");setOtpMsg("Enter both codes to verify your Service Provider account.")}catch(x){setMsg(x.message)}};

const otpForm=document.querySelector("#otpForm");
if(otpForm)otpForm.onsubmit=async e=>{e.preventDefault();try{
 const mode=e.target.dataset.mode; const body={challengeId:document.querySelector("#otpChallenge").value,emailOtp:document.querySelector("#emailOtp").value,smsOtp:document.querySelector("#smsOtp").value};
 let d;
 if(mode.includes("REGISTER")) d=await send("/api/auth/register/verify",body); else d=await send("/api/auth/login/verify",body);
 if(d.user.role==="TRAVELER"){localStorage.setItem("marg_token",d.token);location.href="traveller-dashboard.html"}
 else if(d.user.role==="VENDOR"){localStorage.setItem("marg_provider_token",d.token);location.href="provider-dashboard.html"}
 else {setOtpMsg("Admin accounts use the Admin login.")}
}catch(x){setOtpMsg(x.message)}};

const back=document.querySelector("#backToCredentials");
if(back)back.onclick=()=>{const box=document.querySelector("#otpStep");if(box)box.hidden=true;setOtpMsg("")};

const resend=document.querySelector("#resendOtp");
if(resend)resend.onclick=async()=>{try{const d=await send("/api/auth/otp/resend",{challengeId:document.querySelector("#otpChallenge").value});showOtp(d,document.querySelector("#otpForm").dataset.mode);setOtpMsg("New OTPs sent. Please check your email and phone.")}catch(x){setOtpMsg(x.message)}};
