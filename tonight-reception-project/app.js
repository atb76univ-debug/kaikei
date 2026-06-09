
document.getElementById('startBtn').addEventListener('click',()=>{
 const t=new Date().toLocaleString('ja-JP');
 document.getElementById('log').innerHTML='受付開始: '+t;
});
