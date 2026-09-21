(function(){
  const sessionKey='sbiPaySessionStartedAt';
  const sessionDuration=24*60*60*1000;
  const authKeys=['sbiPayUsername','sbiPayProfile','sbiPayUserId','sbiPayInviteCode','sbiPaySessionStartedAt'];
  const localUsersKey='sbiPayLocalUsers';
  const legacyUserScopedKeys=['sbiPayTransactions','sbiPayStartingBalance','sbiPayBuyerId','sbiPayOrderLocks','sbiPaySellerSales','sbiPaySellerPayments','sbiPayTradeSummary','sbiPayVerifiedUtrs','sbiPayReferralCredits','sbiPayWalletUpi','sbiPayWalletBanks'];
  const clearUserScopedStorage=()=>{
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key.startsWith('sbiPayUser:') || key.startsWith('sbiPayTransactions') || legacyUserScopedKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  };
  const readProfile=()=>{try{return JSON.parse(localStorage.getItem('sbiPayProfile')||'null')}catch(error){return null}};
  const readLocalUsers=()=>{try{const users=JSON.parse(localStorage.getItem(localUsersKey)||'[]');return Array.isArray(users)?users:[]}catch(error){return[]}};
  const normalize=({username='',phone='',upiId='',bankAccount=''}={})=>({username:String(username).trim().toLowerCase(),phone:String(phone).replace(/\D/g,''),upiId:String(upiId).trim().toLowerCase(),bankAccount:String(bankAccount).replace(/\D/g,'')});
  const digest=async value=>{const bytes=new TextEncoder().encode(String(value));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(byte=>byte.toString(16).padStart(2,'0')).join('')};
  const localProfile=user=>({username:user.displayUsername||user.username,id:user.userId,inviteCode:user.inviteCode,ownerCode:user.ownerCode,balance:399,depositBalance:399,packageName:'Free 399',packageAmount:399,signupBonusAmount:399,createdAt:user.createdAt});
  const localRegister=async ({username,phone,password,ownerCode='',upiId='',bankAccount=''})=>{
    const normalized=normalize({username,phone,upiId,bankAccount});
    const users=readLocalUsers();
    if(!normalized.username||normalized.phone.length<10||String(password).length<6)throw new Error('Invalid registration details');
    if(users.some(user=>normalize(user).username===normalized.username))throw new Error('This username is already registered.');
    if(users.some(user=>normalize(user).phone===normalized.phone))throw new Error('This number is already registered.');
    if(normalized.upiId&&users.some(user=>normalize(user).upiId===normalized.upiId))throw new Error('This UPI ID is already registered.');
    if(normalized.bankAccount&&users.some(user=>normalize(user).bankAccount===normalized.bankAccount))throw new Error('This bank account is already registered.');
    const userId=String(20040000+users.length+1);
    const user={...normalized,displayUsername:String(username).trim(),passwordHash:await digest(password),userId,inviteCode:`SBI${userId}`,ownerCode,createdAt:new Date().toISOString(),isActive:true};
    users.push(user);localStorage.setItem(localUsersKey,JSON.stringify(users));
    return {user:localProfile(user),userId:user.userId,inviteCode:user.inviteCode,ownerCode:user.ownerCode};
  };
  const localLogin=async (phone,password)=>{
    const normalized=normalize({phone});
    const user=readLocalUsers().find(entry=>normalize(entry).phone===normalized.phone);
    if(!user||user.isActive===false||user.passwordHash!==await digest(password))throw new Error('Invalid phone number or password.');
    return localProfile(user);
  };
  const startSession=profile=>{
    if(profile)localStorage.setItem('sbiPayProfile',JSON.stringify(profile));
    localStorage.setItem(sessionKey,String(Date.now()));
  };
  const clearSession=()=>{
    authKeys.forEach(key=>localStorage.removeItem(key));
    clearUserScopedStorage();
  };
  const hasValidSession=()=>{
    const profile=readProfile();
    const startedAt=Number(localStorage.getItem(sessionKey));
    if(!profile?.id){clearSession();return false}
    if(!Number.isFinite(startedAt)){localStorage.setItem(sessionKey,String(Date.now()));return true}
    if(Date.now()-startedAt>=sessionDuration){clearSession();return false}
    return true;
  };
  const requireSession=()=>{if(!hasValidSession())window.location.href='login.html';return hasValidSession()};
  window.sbiPayAuth={startSession,clearSession,hasValidSession,requireSession,readProfile,localRegister,localLogin};
})();
