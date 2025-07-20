// Sayfalama için global değişkenler
let currentPage = 1;
const videosPerPage = 12; // Her sayfada 12 video
let allVideos = [];
let filteredVideos = [];

// Banner reklamları için diziler
const videoBanners = [
    {
        image: 'src/ayakkabi.jpg',
        link: 'https://lowest-prices.eu/a/2kkVji8J7DfB1En'
    },
    {
        image: 'src/game.jpg',
        link: 'https://lowest-prices.eu/a/mZZJKtjolyhBQJG'
    },
    {
        image: 'src/saat.jpg',
        link: 'https://lowest-prices.eu/a/rkkOPi8RZ9t4z2B'
    }
];

const downloadBanner = {
    image: 'src/video.jpg',
    link: 'https://wait-page.eu/a/rkkOPiANBC4j6N'
};

// Banner reklamı oluştur
function createBannerAd(banner, index = 0) {
    return `
        <div class="banner-ad-container mb-3">
            <a href="${banner.link}" target="_blank" rel="noopener noreferrer">
                <img src="${banner.image}" alt="Reklam" class="banner-ad" style="width: 100%; height: auto; max-width: 300px; display: block; margin: 0 auto;">
            </a>
        </div>
    `;
}


// Tüm videoları göster (sayfalama ile)
async function displayAllVideos(filter = 'all', selectedDate = null, searchTerm = '', category = 'all') {
    try {
        const videoList = document.getElementById('videoList');
        const pagination = document.getElementById('pagination');
        
        if (!videoList) {
            console.error('videoList elementi bulunamadı!');
            return;
        }

        // Videoları yükle (eğer henüz yüklenmemişse)
        if (allVideos.length === 0) {
            allVideos = await loadVideos();
        }
        
        console.log('Filtreleme öncesi videolar:', allVideos);
        
        if (!allVideos || allVideos.length === 0) {
            videoList.innerHTML = '<div class="alert alert-info">Henüz video eklenmemiş.</div>';
            pagination.innerHTML = '';
            return;
        }

        // Videoları filtrele
        filteredVideos = filterVideos(allVideos, filter, selectedDate, searchTerm, category);
        console.log('Filtrelenmiş videolar:', filteredVideos);
        
        if (filteredVideos.length === 0) {
            let message = 'Seçilen kriterlere uygun video bulunamadı.';
            if (searchTerm.trim()) {
                message = `"${searchTerm}" araması için sonuç bulunamadı.`;
            }
            videoList.innerHTML = `<div class="alert alert-info">${message}</div>`;
            pagination.innerHTML = '';
            return;
        }

        // Videoları tarihe göre sırala (en yeniden en eskiye)
        filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Sayfalama hesapla
        const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
        const startIndex = (currentPage - 1) * videosPerPage;
        const endIndex = startIndex + videosPerPage;
        const videosToShow = filteredVideos.slice(startIndex, endIndex);

        // Videoları ve reklamları birleştirerek HTML oluştur
        let html = '';
        videosToShow.forEach((video, idx) => {
            html += createVideoCard(video, searchTerm);
            
            // Her videonun altına banner reklamı ekle
            const bannerIndex = idx % videoBanners.length;
            html += createBannerAd(videoBanners[bannerIndex], bannerIndex);
        });

        videoList.innerHTML = html;
        
        // Sayfalama oluştur
        createPagination(totalPages, currentPage);
        
        // İndirme butonlarına event listener ekle
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', function() {
                const videoId = this.getAttribute('data-video-id');
                const video = allVideos.find(v => v.id === videoId);
                if (video) {
                    // Embed URL'den normal TikTok URL'sine çevir
                    const videoUrl = video.embedUrl.replace('https://www.tiktok.com/embed/v2/', 'https://www.tiktok.com/');
                    const redirectUrl = `https://tikmate.io?url=${encodeURIComponent(videoUrl)}`;
                    showDownloadModalAndRedirect(redirectUrl);
                }
            });
        });


    } catch (error) {
        console.error('Videoları gösterme hatası:', error);
        const videoList = document.getElementById('videoList');
        if (videoList) {
            videoList.innerHTML = '<div class="alert alert-danger">Videolar yüklenirken bir hata oluştu.</div>';
        }
    }
}

// Sayfalama oluştur
function createPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = '';
    
    // Önceki sayfa butonu
    if (currentPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}">Önceki</a></li>`;
    }
    
    // Sayfa numaraları
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }
    
    // Sonraki sayfa butonu
    if (currentPage < totalPages) {
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}">Sonraki</a></li>`;
    }
    
    pagination.innerHTML = html;
    
    // Sayfalama linklerine event listener ekle
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (page && page !== currentPage) {
                currentPage = page;
                const filter = document.getElementById('dateFilter').value;
                const datePicker = document.getElementById('datePicker').value;
                const searchTerm = document.getElementById('searchInput').value;
                const category = document.getElementById('categoryFilter').value;
                displayAllVideos(filter, datePicker, searchTerm, category);
                

            }
        });
    });
}

// Arama fonksiyonu (tüm videolar için)
function performSearchAll() {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const datePicker = document.getElementById('datePicker');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const searchTerm = searchInput.value.trim();
    const filter = dateFilter.value;
    const selectedDate = dateFilter.value === 'custom' ? datePicker.value : null;
    const category = categoryFilter.value;
    
    // Arama yapıldığında ilk sayfaya dön
    currentPage = 1;
    
    console.log('Arama yapılıyor:', {
        searchTerm: searchTerm,
        filter: filter,
        selectedDate: selectedDate,
        category: category
    });
    
    displayAllVideos(filter, selectedDate, searchTerm, category);
    

}



// Arama kutusunu temizle (tüm videolar için)
function clearSearchAll() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    currentPage = 1;
    performSearchAll();
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tüm videolar sayfası yüklendi...');
    
    // İlk yükleme
    displayAllVideos();
    
    // Filtre değişikliklerini dinle
    document.getElementById('categoryFilter').addEventListener('change', function() {
        const category = this.value;
        const dateFilter = document.getElementById('dateFilter').value;
        const datePicker = document.getElementById('datePicker').value;
        const searchTerm = document.getElementById('searchInput').value;
        
        currentPage = 1; // Filtre değiştiğinde ilk sayfaya dön
        displayAllVideos(dateFilter, datePicker, searchTerm, category);
    });
    
    document.getElementById('dateFilter').addEventListener('change', function() {
        const filter = this.value;
        const category = document.getElementById('categoryFilter').value;
        const datePicker = document.getElementById('datePicker').value;
        const searchTerm = document.getElementById('searchInput').value;
        
        // Özel tarih seçildiğinde date picker'ı göster/gizle
        const datePickerElement = document.getElementById('datePicker');
        if (filter === 'custom') {
            datePickerElement.style.display = 'inline-block';
        } else {
            datePickerElement.style.display = 'none';
            datePickerElement.value = '';
        }
        
        currentPage = 1; // Filtre değiştiğinde ilk sayfaya dön
        displayAllVideos(filter, datePicker, searchTerm, category);
    });
    
    document.getElementById('datePicker').addEventListener('change', function() {
        const selectedDate = this.value;
        const filter = document.getElementById('dateFilter').value;
        const category = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('searchInput').value;
        
        currentPage = 1; // Tarih değiştiğinde ilk sayfaya dön
        displayAllVideos(filter, selectedDate, searchTerm, category);
    });
    
    // Arama işlevselliği
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            performSearchAll();
        }, 300);
    });
    
    document.getElementById('clearSearch').addEventListener('click', function() {
        clearSearchAll();
    });
    
    // Enter tuşu ile arama
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearchAll();
        }
    });
}); 