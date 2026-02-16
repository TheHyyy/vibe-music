const axios = require('axios');

async function testBilibili() {
    try {
        const query = '周杰伦';
        const searchUrl = "https://api.bilibili.com/x/web-interface/search/type";
        const headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com/",
            "Cookie": "buvid3=test" // sometimes needed
        };

        console.log("Searching Bilibili...");
        const res = await axios.get(searchUrl, {
            params: {
                search_type: "video",
                keyword: query,
                page: 1,
            },
            headers
        });

        const list = res.data?.data?.result || [];
        console.log(`Found ${list.length} results`);
        if (list.length > 0) {
            console.log("First result:", JSON.stringify(list[0], null, 2));
        } else {
            console.log("Full response:", JSON.stringify(res.data, null, 2));
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testBilibili();
