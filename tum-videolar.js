// Sayfalama için global değişkenler
let currentPage = 1;
const videosPerPage = 12; // Her sayfada 12 video
let allVideos = [];
let filteredVideos = [];

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
            
            // Her iki videodan sonra banner ekle
            if ((idx + 1) % 2 === 0) {
                html += `
                    <div class="banner-container my-4 d-flex justify-content-center">
                        <div class="banner-ad">
                            <script>
                            (function(rbi){
                            var d = document,
                                s = d.createElement('script'),
                                l = d.scripts[d.scripts.length - 1];
                            s.settings = rbi || {};
                            s.src = "//ancient-pipe.com/b/XpVRszd.GSl/0gYuWYcu/_ebmQ9/uwZdUqlVknPZTAYF1CMQDpAl1/NpzeIftoNcjiUiw/MvDKUj3FMpwx";
                            s.async = true;
                            s.referrerPolicy = 'no-referrer-when-downgrade';
                            l.parentNode.insertBefore(s, l);
                            })({})
                            </script>
                        </div>
                    </div>
                `;
            }
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
                    // Önce VAST video reklamını göster
                    showVastVideoAd().then(() => {
                        // Reklam tamamlandıktan sonra indirme işlemini başlat
                        const videoUrl = video.embedUrl.replace('https://www.tiktok.com/embed/v2/', 'https://www.tiktok.com/');
                        const redirectUrl = `https://tikmate.io?url=${encodeURIComponent(videoUrl)}`;
                        showDownloadModalAndRedirect(redirectUrl);
                    }).catch(() => {
                        // Reklam yüklenemezse direkt indirme işlemini başlat
                        const videoUrl = video.embedUrl.replace('https://www.tiktok.com/embed/v2/', 'https://www.tiktok.com/');
                        const redirectUrl = `https://tikmate.io?url=${encodeURIComponent(videoUrl)}`;
                        showDownloadModalAndRedirect(redirectUrl);
                    });
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

// VAST video reklam göster (tüm videolar sayfası için)
function showVastVideoAd() {
    return new Promise((resolve, reject) => {
        // Mevcut reklam modalını kaldır
        const existingModal = document.getElementById('vastVideoModal');
        if (existingModal) {
            existingModal.remove();
        }

        // VAST video reklam modalını oluştur
        const modalHtml = `
            <div class="modal fade" id="vastVideoModal" tabindex="-1" aria-labelledby="vastVideoModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="vastVideoModalLabel">
                                <i class="fas fa-play-circle me-2"></i>Video Reklamı
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div id="vastVideoContainer" style="width: 100%; height: 400px; background: #000; border-radius: 8px; overflow: hidden;">
                                <div id="vastVideoLoading" style="display: flex; justify-content: center; align-items: center; height: 100%; color: white;">
                                    <div>
                                        <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                                        <p>Video reklamı yükleniyor...</p>
                                        <small class="text-muted">Lütfen bekleyin, video tamamlandıktan sonra indirme işlemi başlayacak</small>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <div class="progress" style="height: 4px;">
                                    <div id="vastVideoProgress" class="progress-bar bg-primary" role="progressbar" style="width: 0%"></div>
                                </div>
                                <small class="text-muted mt-2 d-block">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Video reklamı tamamlandıktan sonra otomatik olarak devam edeceksiniz
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Modalı sayfaya ekle
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Modalı göster
        const modal = new bootstrap.Modal(document.getElementById('vastVideoModal'));
        modal.show();

        // VAST video reklam scriptini yükle
        const script = document.createElement('script');
        script.src = 'https://unfinished-apple.com/dtmBF/zNd.GVNCvmZwGBUv/YeWmp9suEZJUKlak/P/T/YU1/MRDsAz1ROFTMAitaN/jSUfwPMMDfUi5OMwQZ';
        script.async = true;
        script.onload = () => {
            // Script yüklendi, reklam başladı
            console.log('VAST video reklam yüklendi');
            
            // Reklam container'ını bul
            const videoContainer = document.getElementById('vastVideoContainer');
            if (videoContainer) {
                // Reklam yüklendiğinde loading animasyonunu kaldır
                videoContainer.innerHTML = '';
                
                // Reklam tamamlandığını dinle
                let adCompleted = false;
                let adDuration = 0;
                
                // Reklam süresini takip et (varsayılan 15 saniye)
                const adTimer = setInterval(() => {
                    adDuration += 1;
                    
                    // Progress bar'ı güncelle
                    const progressBar = document.getElementById('vastVideoProgress');
                    if (progressBar) {
                        const progress = (adDuration / 15) * 100;
                        progressBar.style.width = Math.min(progress, 100) + '%';
                    }
                    
                    // Reklam tamamlandığında
                    if (adDuration >= 15 || adCompleted) {
                        clearInterval(adTimer);
                        adCompleted = true;
                        
                        // Loading animasyonunu kaldır
                        const loadingElement = document.getElementById('vastVideoLoading');
                        if (loadingElement) {
                            loadingElement.style.display = 'none';
                        }
                        
                        // Modalı kapat ve resolve et
                        modal.hide();
                        setTimeout(() => {
                            const modalElement = document.getElementById('vastVideoModal');
                            if (modalElement) modalElement.remove();
                            resolve();
                        }, 300);
                    }
                }, 1000);
                
                // Reklam tamamlandı event'ini dinle (eğer VAST API destekliyorsa)
                if (window.vastAdCompleted) {
                    window.vastAdCompleted = () => {
                        adCompleted = true;
                        clearInterval(adTimer);
                        
                        modal.hide();
                        setTimeout(() => {
                            const modalElement = document.getElementById('vastVideoModal');
                            if (modalElement) modalElement.remove();
                            resolve();
                        }, 300);
                    };
                }
                
                // Modal kapatıldığında timer'ı durdur
                document.getElementById('vastVideoModal').addEventListener('hidden.bs.modal', function() {
                    clearInterval(adTimer);
                    adCompleted = true;
                    resolve();
                });
            }
        };
        script.onerror = () => {
            // Script yüklenemezse modalı kapat ve reject et
            console.error('VAST video reklam yüklenemedi');
            modal.hide();
            setTimeout(() => {
                const modalElement = document.getElementById('vastVideoModal');
                if (modalElement) modalElement.remove();
                reject();
            }, 300);
        };

        document.head.appendChild(script);

        // Modal kapatıldığında resolve et
        document.getElementById('vastVideoModal').addEventListener('hidden.bs.modal', function() {
            resolve();
        });
    });
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