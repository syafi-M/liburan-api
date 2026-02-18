const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeByYear(year) {
    try {
        console.log(`🚀 Scraping tahun: ${year}...`);
        const { data } = await axios.get(`https://www.tanggalan.com/${year}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(data);
        const holidays = [];
        const monthlyData = {}; // Tempat simpan data per bulan

        const monthMap = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
            'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
            'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
        };

        $('article ul').each((i, ul) => {
            const monthHeader = $(ul).find('li:first-child a').text().trim().toLowerCase();
            const monthName = monthHeader.replace(/[0-9]/g, '').trim();
            const monthCode = monthMap[monthName];

            if (monthCode) {
                if (!monthlyData[monthCode]) monthlyData[monthCode] = [];

                $(ul).find('li table tr').each((j, tr) => {
                    const cols = $(tr).find('td');
                    if (cols.length >= 2) {
                        const dateRaw = $(cols[0]).text().trim();
                        const name = $(cols[1]).text().trim();

                        const days = dateRaw.split(/[-–]/);
                        const startDay = parseInt(days[0]);
                        const endDay = days[1] ? parseInt(days[1]) : startDay;

                        for (let d = startDay; d <= endDay; d++) {
                            const formattedDay = d.toString().padStart(2, '0');
                            const holidayObj = {
                                date: `${year}-${monthCode}-${formattedDay}`,
                                holiday_name: name,
                                is_national_holiday: true
                            };
                            holidays.push(holidayObj);
                            monthlyData[monthCode].push(holidayObj);
                        }
                    }
                });
            }
        });

        // 1. Simpan file Tahunan (root)
        fs.writeFileSync(`${year}.json`, JSON.stringify(holidays, null, 2));

        // 2. Simpan file Bulanan (di dalam folder api/tahun/bulan.json)
        const dir = path.join('api', year);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        Object.keys(monthlyData).forEach(month => {
            fs.writeFileSync(path.join(dir, `${month}.json`), JSON.stringify(monthlyData[month], null, 2));
        });

        console.log(`✅ Selesai untuk tahun ${year}. File tahunan & folder /api/${year}/ dibuat.`);
    } catch (error) {
        console.error(`❌ Gagal:`, error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const years = args.length > 0 ? args : [new Date().getFullYear().toString()];
    for (const year of years) { await scrapeByYear(year); }
}
main();