import axios from 'axios';

async function diagnose() {
  console.log('🔍 诊断QQ音乐Cookie状态\n');
  
  // 读取.env中的Cookie
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const cookieMatch = envContent.match(/QQ_COOKIE=(.+)/);
  
  if (!cookieMatch) {
    console.log('❌ .env中没有配置QQ_COOKIE');
    return;
  }
  
  const cookie = cookieMatch[1];
  console.log(`✅ Cookie长度: ${cookie.length} 字符`);
  console.log(`   前50字符: ${cookie.substring(0, 50)}...`);
  
  // 检查关键参数
  const hasUin = cookie.includes('uin=');
  const hasKey = cookie.includes('qqmusic_key=');
  const hasKeyst = cookie.includes('qm_keyst=');
  
  console.log(`\n关键参数检查:`);
  console.log(`  uin: ${hasUin ? '✅' : '❌'}`);
  console.log(`  qqmusic_key: ${hasKey ? '✅' : '❌'}`);
  console.log(`  qm_keyst: ${hasKeyst ? '✅' : '❌'}`);
  
  // 尝试使用Cookie访问QQ音乐API
  console.log(`\n测试Cookie有效性...`);
  
  try {
    const res = await axios.get('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      params: {
        '-': 'getplaysongvkey',
        g_tk: 5381,
        loginUin: '0',
        hostUin: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf-8',
        notice: 0,
        platform: 'yqq.json',
        needNewCode: 0,
        data: JSON.stringify({
          req_0: {
            module: 'vkey.GetVkeyServer',
            method: 'CgiGetVkey',
            param: {
              filename: ['M5000039MnYb0qxYhV.mp3'],  // 晴天
              guid: '1234567890',
              songmid: ['0039MnYb0qxYhV'],
              songtype: [0],
              uin: '0',
              loginflag: 1,
              platform: '20',
            },
          },
          comm: {
            uin: 0,
            format: 'json',
            ct: 19,
            cv: 0,
          },
        }),
      },
      headers: {
        'Cookie': cookie,
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const midurlinfo = res?.data?.req_0?.data?.midurlinfo?.[0];
    
    if (midurlinfo?.purl) {
      console.log('✅ Cookie有效！获取到播放链接');
      console.log(`   链接: ${midurlinfo.purl.substring(0, 50)}...`);
    } else {
      console.log('❌ Cookie无效或已过期');
      console.log(`   响应:`, JSON.stringify(res?.data?.req_0?.data, null, 2));
    }
    
  } catch (e: any) {
    console.log(`❌ 测试失败: ${e.message}`);
  }
}

diagnose();
