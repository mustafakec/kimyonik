#!/bin/bash

# Adstxtmanager'dan ads.txt güncelleme script'i
# Bu script günlük olarak çalıştırılabilir

echo "Ads.txt güncelleniyor..."

# Adstxtmanager'dan ads.txt'yi indir
curl -L https://srv.adstxtmanager.com/19390/kimyonik.tr > ads.txt.tmp

# İndirilen dosyanın boş olup olmadığını kontrol et
if [ -s ads.txt.tmp ]; then
    # Dosya boş değilse, mevcut ads.txt'yi yedekle ve yeni dosyayı kullan
    mv ads.txt ads.txt.backup.$(date +%Y%m%d_%H%M%S)
    mv ads.txt.tmp ads.txt
    echo "Ads.txt başarıyla güncellendi!"
else
    # Dosya boşsa, PHP redirect'i koru
    rm ads.txt.tmp
    echo "Adstxtmanager'dan veri alınamadı. PHP redirect korunuyor."
fi 