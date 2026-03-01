import * as fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const cookieMatch = envContent.match(/QQ_COOKIE=(.+)/);

if (cookieMatch) {
  const cookie = cookieMatch[1];
  console.log(`Cookie长度: ${cookie.length} 字符\n`);
  
  // 解析Cookie
  const cookies = cookie.split(';').map(c => c.trim());
  
  console.log('Cookie列表:');
  cookies.forEach(c => {
    const [name] = c.split('=');
    const keyCookies = ['uin', 'o_cookie', 'qqmusic_key', 'qm_keyst', 'psrf_qqopenid'];
    if (keyCookies.some(k => name.includes(k))) {
      console.log(`  ✅ ${name}`);
    }
  });
  
  console.log('\n关键Cookie检查:');
  console.log(`  uin: ${cookie.includes('uin=') ? '✅' : '❌'}`);
  console.log(`  qqmusic_key: ${cookie.includes('qqmusic_key=') ? '✅' : '❌'}`);
  console.log(`  qm_keyst: ${cookie.includes('qm_keyst=') ? '✅' : '❌'}`);
  console.log(`  psrf_qqopenid: ${cookie.includes('psrf_qqopenid=') ? '✅' : '❌'}`);
  
} else {
  console.log('❌ 未找到QQ_COOKIE');
}
