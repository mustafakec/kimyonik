// Anasayfa için sayfalama değişkenleri
let homeCurrentPage = 1;
const homeVideosPerPage = 8;
let homeFilteredVideos = [];

// Video verilerini yükle
async function loadVideos() {
    try {
        console.log('Videolar yükleniyor...');
        const response = await fetch('videos.json');
        console.log('Fetch response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Yüklenen video verisi:', data);
        console.log('Toplam video sayısı:', data.videos.length);
        console.log('Video kategorileri:', [...new Set(data.videos.map(v => v.category))]);
        
        return data.videos;
    } catch (error) {
        console.error('Videolar yüklenirken hata oluştu:', error);
        return [];
    }
}

// Tarih formatını düzenle
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Tarih formatı hatası:', error);
        return dateString;
    }
}

// Metni highlight et (arama sonuçları için)
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Videoları filtrele
function filterVideos(videos, filter, selectedDate = null, searchTerm = '', category = 'all') {
    console.log('Filtreleme başlıyor:', {
        totalVideos: videos.length,
        filter: filter,
        selectedDate: selectedDate,
        searchTerm: searchTerm,
        category: category
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filteredVideos = videos.filter(video => {
        const videoDate = new Date(video.date);
        videoDate.setHours(0, 0, 0, 0);

        // Kategori filtresi
        let categoryMatch = true;
        if (category !== 'all') {
            categoryMatch = video.category === category;
            console.log(`Video "${video.title}" kategori kontrolü:`, {
                videoCategory: video.category,
                selectedCategory: category,
                match: categoryMatch
            });
        }

        // Tarih filtresi
        let dateMatch = true;
        if (filter === 'custom' && selectedDate) {
            const selDate = new Date(selectedDate);
            selDate.setHours(0, 0, 0, 0);
            dateMatch = videoDate.getTime() === selDate.getTime();
        } else {
            switch (filter) {
                case 'today':
                    dateMatch = videoDate.getTime() === today.getTime();
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    dateMatch = videoDate.getTime() === yesterday.getTime();
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    dateMatch = videoDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    dateMatch = videoDate >= monthAgo;
                    break;
                default:
                    dateMatch = true;
            }
        }

        // Arama filtresi
        let searchMatch = true;
        if (searchTerm.trim()) {
            searchMatch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
            console.log(`Video "${video.title}" arama kontrolü:`, {
                title: video.title,
                searchTerm: searchTerm,
                match: searchMatch
            });
        }

        const finalMatch = categoryMatch && dateMatch && searchMatch;
        console.log(`Video "${video.title}" final sonuç:`, {
            categoryMatch,
            dateMatch,
            searchMatch,
            finalMatch
        });

        return finalMatch;
    });

    console.log('Filtreleme sonucu:', {
        filteredCount: filteredVideos.length,
        videos: filteredVideos.map(v => ({title: v.title, category: v.category}))
    });

    return filteredVideos;
}

// Video kartı oluştur
function createVideoCard(video, searchTerm = '') {
    try {
        console.log('Video kartı oluşturuluyor:', video);
        const highlightedTitle = highlightText(video.title, searchTerm);
        const categoryLabel = video.category === 'hikaye' ? 'Hikaye' : 'Reels';
        const categoryClass = video.category === 'hikaye' ? 'badge bg-primary' : 'badge bg-success';
        
        return `
            <div class="video-item">
                <div class="video-date">${formatDate(video.date)}</div>
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h3 class="video-title">${highlightedTitle}</h3>
                    <span class="${categoryClass}">${categoryLabel}</span>
                </div>
                <div class="video-frame-container">
                    <iframe src="${video.embedUrl}" 
                            allowfullscreen 
                            loading="lazy"
                            title="${video.title}">
                    </iframe>
                </div>
                <div class="video-actions mt-3">
                    <button class="btn btn-primary download-btn w-100" data-video-id="${video.id}">
                        <i class="fas fa-download me-2"></i>İndir
                    </button>
                    <div class="download-notice mt-2">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            İndir butonuna tıklayarak üçüncü parti siteye yönlendirileceksiniz
                        </small>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Video kartı oluşturma hatası:', error);
        return '';
    }
}

// Videoları göster
async function displayVideos(filter = 'all', selectedDate = null, searchTerm = '', category = 'all', page = 1) {
    try {
        const videoList = document.getElementById('videoList');
        const pagination = document.getElementById('pagination');
        if (!videoList) {
            console.error('videoList elementi bulunamadı!');
            return;
        }

        const videos = await loadVideos();
        console.log('Filtreleme öncesi videolar:', videos);
        
        if (!videos || videos.length === 0) {
            videoList.innerHTML = '<div class="alert alert-info">Henüz video eklenmemiş.</div>';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        homeFilteredVideos = filterVideos(videos, filter, selectedDate, searchTerm, category);
        console.log('Filtrelenmiş videolar:', homeFilteredVideos);
        
        if (homeFilteredVideos.length === 0) {
            let message = 'Seçilen kriterlere uygun video bulunamadı.';
            if (searchTerm.trim()) {
                message = `"${searchTerm}" araması için sonuç bulunamadı.`;
            }
            videoList.innerHTML = `<div class="alert alert-info">${message}</div>`;
            if (pagination) pagination.innerHTML = '';
            return;
        }

        // Videoları tarihe göre sırala (en yeniden en eskiye)
        homeFilteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Sayfalama hesapla
        const totalPages = Math.ceil(homeFilteredVideos.length / homeVideosPerPage);
        const startIndex = (page - 1) * homeVideosPerPage;
        const endIndex = startIndex + homeVideosPerPage;
        const videosToShow = homeFilteredVideos.slice(startIndex, endIndex);
        homeCurrentPage = page;

        // Videoları ve reklamları birleştirerek HTML oluştur
        let html = '';
        videosToShow.forEach((video, idx) => {
            html += createVideoCard(video, searchTerm);
            // Her 2 videodan sonra reklam ekle (sonda değilse)
            if ((idx + 1) % 2 === 0 && idx !== videosToShow.length - 1) {
                // Dinamik reklam divi
                const adId = `ad-inlist-${page}-${idx}`;
                html += `<div id="${adId}" class="ad-inlist d-flex justify-content-center align-items-center my-3"></div>`;
            }
        });
        videoList.innerHTML = html;
        // Dinamik reklam scriptlerini ekle
        videosToShow.forEach((video, idx) => {
            if ((idx + 1) % 2 === 0 && idx !== videosToShow.length - 1) {
                const adId = `ad-inlist-${page}-${idx}`;
                const adDiv = document.getElementById(adId);
                if (adDiv) {
                    insertAdsterraBanner(adDiv, 'e6dc54954be3940ec0ee3596c49e25cc', 300, 250);
                }
            }
        });

        // Sayfalama oluştur
        if (pagination) createHomePagination(totalPages, homeCurrentPage);

        // İndirme butonlarına event listener ekle
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', function() {
                const videoId = this.getAttribute('data-video-id');
                const video = videos.find(v => v.id === videoId);
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

// Anasayfa için sayfalama oluştur
function createHomePagination(totalPages, currentPage) {
    let pagination = document.getElementById('pagination');
    if (!pagination) {
        // Eğer pagination elementi yoksa oluştur
        const container = document.querySelector('.video-container');
        if (container) {
            const pagDiv = document.createElement('div');
            pagDiv.className = 'pagination-container mt-4';
            pagDiv.innerHTML = `<nav aria-label="Video sayfalama"><ul class="pagination justify-content-center" id="pagination"></ul></nav>`;
            container.appendChild(pagDiv);
            pagination = document.getElementById('pagination');
        }
    }
    if (!pagination) return;
    let html = '';
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
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
                displayVideos(
                    document.getElementById('dateFilter').value,
                    document.getElementById('datePicker').value,
                    document.getElementById('searchInput').value,
                    document.getElementById('categoryFilter').value,
                    page
                );
                // Sayfa değişince en üste kaydır
                const videoList = document.getElementById('videoList');
                if (videoList) {
                    videoList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    });
}

// Arama fonksiyonu
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const datePicker = document.getElementById('datePicker');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const searchTerm = searchInput.value.trim();
    const filter = dateFilter.value;
    const selectedDate = dateFilter.value === 'custom' ? datePicker.value : null;
    const category = categoryFilter.value;
    
    console.log('Arama yapılıyor:', {
        searchTerm: searchTerm,
        filter: filter,
        selectedDate: selectedDate,
        category: category
    });
    
    displayVideos(filter, selectedDate, searchTerm, category);
}

// Arama kutusunu temizle
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    performSearch();
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, videolar gösteriliyor...');
    
    // İlk yükleme
    displayVideos('all', null, '', 'all', 1);
    
    // Filtre değişikliklerini dinle
    document.getElementById('categoryFilter').addEventListener('change', function() {
        const category = this.value;
        const dateFilter = document.getElementById('dateFilter').value;
        const datePicker = document.getElementById('datePicker').value;
        const searchTerm = document.getElementById('searchInput').value;
        
        displayVideos(dateFilter, datePicker, searchTerm, category);
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
        
        displayVideos(filter, datePicker, searchTerm, category);
    });
    
    document.getElementById('datePicker').addEventListener('change', function() {
        const selectedDate = this.value;
        const filter = document.getElementById('dateFilter').value;
        const category = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('searchInput').value;
        
        displayVideos(filter, selectedDate, searchTerm, category);
    });
    
    // Arama işlevselliği
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    });
    
    document.getElementById('clearSearch').addEventListener('click', function() {
        clearSearch();
    });
    
    // Enter tuşu ile arama
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // En alt 320x50 banner reklamı dinamik ekle
    const footerAd = document.getElementById('footer-ad-320x50');
    if (footerAd) {
        insertAdsterraBanner(footerAd, '761708de175f9bfccb0d59c91cfdb8d3', 320, 50);
    }
});

// Modal ve indirme işlemi
// Adsterra banner reklamını dinamik ekle
function insertAdsterraBanner(container, key, width, height) {
    // atOptions'u globalde tanımla
    window.atOptions = {
        'key': key,
        'format': 'iframe',
        'height': height,
        'width': width,
        'params': {}
    };
    // Scripti ekle
    const srcScript = document.createElement('script');
    srcScript.type = 'text/javascript';
    srcScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    container.appendChild(srcScript);
}

// Adsterra native reklamı dinamik ekle
function insertAdsterraNative(container) {
    // Scripti ekle
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl27121631.profitableratecpm.com/3919e94f5b692b86c5d5e2be57e96064/invoke.js';
    container.appendChild(script);
    // Ad divi ekle
    const adDiv = document.createElement('div');
    adDiv.id = 'container-3919e94f5b692b86c5d5e2be57e96064';
    container.appendChild(adDiv);
}

// Modal yönlendirme için global değişkenler
globalThis.downloadModalInterval = null;
globalThis.downloadModalTimeout = null;

function showDownloadModalAndRedirect(url) {
    const modalElement = document.getElementById('downloadModal');
    const modal = new bootstrap.Modal(modalElement);
    // Modal açıldığında eski reklamı temizle
    const modalBody = document.querySelector('#downloadModal .modal-body');
    let oldAdDiv = document.getElementById('modal-native-ad');
    if (oldAdDiv) {
        oldAdDiv.remove();
    }
    // Yeni reklamı ekle
    let adDiv = document.createElement('div');
    adDiv.id = 'modal-native-ad';
    adDiv.className = 'ad-modal d-flex justify-content-center align-items-center my-3';
    modalBody.appendChild(adDiv);
    insertAdsterraNative(adDiv);
    // Kalan süre göstergesi ekle
    let timerText = document.getElementById('redirect-timer');
    if (!timerText) {
        timerText = document.createElement('div');
        timerText.id = 'redirect-timer';
        timerText.style.marginBottom = '10px';
        timerText.style.fontWeight = 'bold';
        timerText.style.fontSize = '1.1rem';
        timerText.style.color = '#007bff';
        modalBody.insertBefore(timerText, modalBody.firstChild);
    }
    let seconds = 10;
    timerText.textContent = `${seconds} saniye sonra yönlendirileceksiniz...`;
    modal.show();
    // Progress bar animasyonu (10 saniye, soldan sağa dolacak)
    const progressBar = document.getElementById('downloadProgress');
    let progress = 0;
    progressBar.style.width = '0%';
    progressBar.textContent = seconds;
    if (globalThis.downloadModalInterval) clearInterval(globalThis.downloadModalInterval);
    if (globalThis.downloadModalTimeout) clearTimeout(globalThis.downloadModalTimeout);
    globalThis.downloadModalInterval = setInterval(() => {
        progress += 100 / 10 / 5; // 10 saniyede 100'e ulaşacak (her 200ms)
        if (progress > 100) progress = 100;
        progressBar.style.width = Math.round(progress) + '%';
        // Her saniye metni ve barı güncelle
        if (progress % 10 === 0 && seconds > 1) {
            seconds--;
            timerText.textContent = `${seconds} saniye sonra yönlendirileceksiniz...`;
            progressBar.textContent = seconds;
        }
        if (progress >= 100) {
            clearInterval(globalThis.downloadModalInterval);
            globalThis.downloadModalTimeout = setTimeout(() => {
                modal.hide();
                timerText.textContent = '';
                progressBar.style.width = '100%';
                progressBar.textContent = '0';
                redirectToDownload(url);
            }, 500);
        }
    }, 200);
    // Modal kapatılırsa timer ve yönlendirme iptal
    modalElement.addEventListener('hidden.bs.modal', function onModalHidden() {
        if (globalThis.downloadModalInterval) clearInterval(globalThis.downloadModalInterval);
        if (globalThis.downloadModalTimeout) clearTimeout(globalThis.downloadModalTimeout);
        timerText.textContent = '';
        progressBar.style.width = '100%';
        progressBar.textContent = '100';
        modalElement.removeEventListener('hidden.bs.modal', onModalHidden);
    });
}

function redirectToDownload(url) {
    console.log('Yönlendirme yapılıyor:', url);
    // Gerçek uygulamada bu URL'ye yönlendirme yapılacak
    window.open(url, '_blank');
} 