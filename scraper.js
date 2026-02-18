const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeHolidays() {
    try {
        console.log("Memulai scraping berdasarkan struktur HTML tanggalan.com...");
        
        const { data } = await axios.get('https://www.tanggalan.com/2026', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(data);
        const holidays = [];

        const monthMap = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
            'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
            'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
        };

        // Kita cari setiap blok bulan (tag <ul>)
        $('article ul').each((i, ul) => {
            // Ambil nama bulan dari <li> pertama
            const monthHeader = $(ul).find('li:first-child a').text().trim().toLowerCase();
            const monthName = monthHeader.replace(/[0-9]/g, '').trim(); // hapus angka tahun
            const monthCode = monthMap[monthName];

            if (monthCode) {
                // Cari tabel hari libur di <li> terakhir dalam <ul> tersebut
                $(ul).find('li table tr').each((j, tr) => {
                    const cols = $(tr).find('td');
                    if (cols.length >= 2) {
                        const dateRaw = $(cols[0]).text().trim(); // Contoh: "21-22" atau "1"
                        const name = $(cols[1]).text().trim();

                        // Pecah jika ada rentang tanggal (misal 21-22)
                        const days = dateRaw.split(/[-–]/);
                        const startDay = parseInt(days[0]);
                        const endDay = days[1] ? parseInt(days[1]) : startDay;

                        for (let d = startDay; d <= endDay; d++) {
                            const formattedDay = d.toString().padStart(2, '0');
                            holidays.push({
                                date: `2026-${monthCode}-${formattedDay}`,
                                holiday_name: name,
                                is_national_holiday: true
                            });
                        }
                    }
                });
            }
        });

        if (holidays.length > 0) {
            fs.writeFileSync('holidays.json', JSON.stringify(holidays, null, 2));
            console.log(`✅ BERHASIL! Ditemukan ${holidays.length} hari libur.`);
            console.table(holidays);
        } else {
            console.log("❌ Data tidak ditemukan. Cek kembali selector.");
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

scrapeHolidays();