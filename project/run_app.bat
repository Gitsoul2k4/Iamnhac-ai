@echo off
set "ROOT_DIR=D:\Dai hoc\tttn\project"

echo ===================================================
echo   KHOI DONG HE THONG WEBSITE NGHE NHAC
echo ===================================================

:: 1. KHOI DONG SERVER (BACKEND)
echo.
echo [1/2] Dang khoi dong Server (Port 5000)...
start "SERVER - BACKEND" cmd /k "cd /d %ROOT_DIR%\server && npm run dev"

:: 2. KHOI DONG CLIENT (FRONTEND)
echo.
echo [2/2] Dang khoi dong Client (Port 3000)...
echo Vui long doi mot chut de trinh duyet tu dong mo...
start "CLIENT - FRONTEND" cmd /k "cd /d %ROOT_DIR%\client && npm start"

echo.
echo HE THONG DANG CHAY!
echo - Neu thay trinh duyet mo ra trang web chao mung -> THANH CONG.
echo - Khong tat 2 cua so CMD den vua hien ra.
echo ===================================================
pause