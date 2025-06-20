// Video verilerini yükle
async function loadVideos() {
    try {
        const response = await fetch('videos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Yüklenen videolar:', data.videos);
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

// Videoları filtrele
function filterVideos(videos, filter, selectedDate = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return videos.filter(video => {
        const videoDate = new Date(video.date);
        videoDate.setHours(0, 0, 0, 0);

        if (filter === 'custom' && selectedDate) {
            const selDate = new Date(selectedDate);
            selDate.setHours(0, 0, 0, 0);
            return videoDate.getTime() === selDate.getTime();
        }

        switch (filter) {
            case 'today':
                return videoDate.getTime() === today.getTime();
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return videoDate.getTime() === yesterday.getTime();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return videoDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return videoDate >= monthAgo;
            default:
                return true;
        }
    });
}

// Video kartı oluştur
function createVideoCard(video) {
    try {
        console.log('Video kartı oluşturuluyor:', video);
        return `
            <div class="video-item mb-4">
                <div class="video-date">${formatDate(video.date)}</div>
                <div class="ratio ratio-16x9">
                    <iframe src="${video.embedUrl}" allowfullscreen></iframe>
                </div>
                <div class="video-actions mt-2">
                    <button class="btn btn-primary download-btn" data-video-id="${video.id}">İndir</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Video kartı oluşturma hatası:', error);
        return '';
    }
}

// Videoları göster
async function displayVideos(filter = 'all') {
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

        const filteredVideos = filterVideos(videos, filter);
        console.log('Filtrelenmiş videolar:', filteredVideos);
        
        if (filteredVideos.length === 0) {
            videoList.innerHTML = '<div class="alert alert-info">Seçilen tarih aralığında video bulunamadı.</div>';
            return;
        }

        // Videoları tarihe göre sırala (en yeniden en eskiye)
        filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

        videoList.innerHTML = filteredVideos.map(video => createVideoCard(video)).join('');
        
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, videolar gösteriliyor...');
    displayVideos();

    const dateFilter = document.getElementById('dateFilter');
    const datePicker = document.getElementById('datePicker');

    // Sayfa ilk açıldığında tarih kutusu gizli olsun
    datePicker.style.display = 'none';

    dateFilter.addEventListener('change', function() {
        if (this.value === 'custom') {
            datePicker.style.display = 'block';
        } else {
            datePicker.value = '';
            datePicker.style.display = 'none';
        }
        displayVideos(this.value);
    });

    datePicker.addEventListener('change', function() {
        if (dateFilter.value === 'custom' && this.value) {
            displayVideos('custom', this.value);
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
    let counter = 10;
    progressBar.style.width = '100%';
    progressBar.textContent = counter;
    progressBar.setAttribute('aria-valuenow', 100);

    modal.show();

    let interval = setInterval(() => {
        counter--;
        progressBar.textContent = counter;
        progressBar.style.width = (counter * 10) + '%';
        progressBar.setAttribute('aria-valuenow', counter * 10);
        if (counter <= 0) {
            clearInterval(interval);
            modal.hide();
            window.open(url, '_blank');
        }
    }, 1000);

    // Modal kapatılırsa sayacı durdur
    document.getElementById('downloadModal').addEventListener('hidden.bs.modal', function() {
        clearInterval(interval);
    }, { once: true });
} 