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
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Video kartı oluşturma hatası:', error);
        return '';
    }
}

// Videoları göster
async function displayVideos(filter = 'all', selectedDate = null, searchTerm = '', category = 'all') {
    try {
        const videoList = document.getElementById('videoList');
        if (!videoList) {
            console.error('videoList elementi bulunamadı!');
            return;
        }

        const videos = await loadVideos();
        console.log('Filtreleme öncesi videolar:', videos);
        
        if (!videos || videos.length === 0) {
            videoList.innerHTML = '<div class="alert alert-info">Henüz video eklenmemiş.</div>';
            return;
        }

        const filteredVideos = filterVideos(videos, filter, selectedDate, searchTerm, category);
        console.log('Filtrelenmiş videolar:', filteredVideos);
        
        if (filteredVideos.length === 0) {
            let message = 'Seçilen kriterlere uygun video bulunamadı.';
            if (searchTerm.trim()) {
                message = `"${searchTerm}" araması için sonuç bulunamadı.`;
            }
            videoList.innerHTML = `<div class="alert alert-info">${message}</div>`;
            return;
        }

        // Videoları tarihe göre sırala (en yeniden en eskiye)
        filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

        videoList.innerHTML = filteredVideos.map(video => createVideoCard(video, searchTerm)).join('');
        
        // İndirme butonlarına event listener ekle
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', function() {
                const videoId = this.getAttribute('data-video-id');
                const video = videos.find(v => v.id === videoId);
                if (video) {
                    const videoUrl = video.embedUrl.replace('embed/v2/', '');
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, videolar gösteriliyor...');
    displayVideos();

    const dateFilter = document.getElementById('dateFilter');
    const datePicker = document.getElementById('datePicker');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const categoryFilter = document.getElementById('categoryFilter');

    // Sayfa ilk açıldığında tarih kutusu gizli olsun
    datePicker.style.display = 'none';

    // Kategori filtresi değişikliği
    categoryFilter.addEventListener('change', function() {
        console.log('Kategori değişti:', this.value);
        performSearch();
    });

    // Tarih filtresi değişikliği
    dateFilter.addEventListener('change', function() {
        if (this.value === 'custom') {
            datePicker.style.display = 'block';
        } else {
            datePicker.value = '';
            datePicker.style.display = 'none';
        }
        performSearch();
    });

    // Tarih seçici değişikliği
    datePicker.addEventListener('change', function() {
        if (dateFilter.value === 'custom' && this.value) {
            performSearch();
        }
    });

    // Arama input değişikliği (real-time arama)
    searchInput.addEventListener('input', function() {
        console.log('Arama input değişti:', this.value);
        // Debounce ile performans optimizasyonu
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            console.log('Arama tetiklendi:', this.value);
            performSearch();
        }, 300);
    });

    // Arama kutusunu temizle butonu
    clearSearchBtn.addEventListener('click', function() {
        console.log('Arama temizlendi');
        clearSearch();
    });

    // Enter tuşu ile arama
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Enter tuşu ile arama yapılıyor');
            performSearch();
        }
    });
});

// Reklam yükleme fonksiyonu
function loadAds() {
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
        console.error('Reklam yüklenirken hata oluştu:', e);
    }
}

// Sayfa yüklendiğinde reklamları yükle
window.addEventListener('load', loadAds);

// Modal ve indirme işlemi
function showDownloadModalAndRedirect(url) {
    const modal = new bootstrap.Modal(document.getElementById('downloadModal'));
    const progressBar = document.getElementById('downloadProgress');
    let counter = 10; // Süreyi 10 saniyeye çıkardık
    progressBar.style.width = '100%';
    progressBar.textContent = counter;
    progressBar.setAttribute('aria-valuenow', 100);

    modal.show();

    let interval = setInterval(() => {
        counter--;
        progressBar.textContent = counter;
        progressBar.style.width = (counter * 10) + '%'; // 10 saniye için %10'luk adımlar
        progressBar.setAttribute('aria-valuenow', counter * 10);
        if (counter <= 0) {
            clearInterval(interval);
            modal.hide();
            redirectToDownload(url);
        }
    }, 1000);

    // Modal kapatılırsa sayacı durdur
    document.getElementById('downloadModal').addEventListener('hidden.bs.modal', function() {
        clearInterval(interval);
    }, { once: true });
}

// Yönlendirme fonksiyonu
function redirectToDownload(url) {
    // Popup kullanmayı tamamen bırakıp doğrudan yönlendirme yap
    window.location.href = url;
} 