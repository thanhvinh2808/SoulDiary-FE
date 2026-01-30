# Kiểm tra xem keytool có tồn tại không
if (Get-Command "keytool" -ErrorAction SilentlyContinue) {
    $keystorePath = "$env:USERPROFILE\.android\debug.keystore"
    $androidDir = "$env:USERPROFILE\.android"

    # Tạo thư mục .android nếu chưa có
    if (!(Test-Path $androidDir)) {
        New-Item -ItemType Directory -Path $androidDir | Out-Null
    }

    # Tạo debug.keystore nếu chưa có
    if (!(Test-Path $keystorePath)) {
        Write-Host "Dang tao debug.keystore..." -ForegroundColor Cyan
        keytool -genkey -v -keystore $keystorePath -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    } else {
        Write-Host "debug.keystore da ton tai." -ForegroundColor Green
    }

    # Chạy script lấy SHA1
    Write-Host "`nDang lay ma SHA-1..." -ForegroundColor Cyan
    node getSHA1.js
} else {
    Write-Host "LOI: May ban chua cai Java (JDK)." -ForegroundColor Red
    Write-Host "Vui long cai dat JDK 17 tai link sau roi chay lai script nay:"
    Write-Host "https://aka.ms/download-jdk/microsoft-jdk-17.0.8-windows-x64.msi"
}
