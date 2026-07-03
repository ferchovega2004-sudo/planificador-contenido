@echo off
:: Verificar privilegios de Administrador
TITLE Configurar Servidor de Pedidos
echo ======================================================
echo   CONFIGURADOR AUTOMATICO DEL SERVIDOR (PC MASTER)
echo ======================================================
echo.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script requiere privilegios de Administrador.
    echo Por favor, haz clic derecho sobre este archivo y selecciona "Ejecutar como Administrador".
    echo.
    pause
    exit /b
)

echo [1/4] Creando regla en el Firewall de Windows para el puerto 3000...
powershell -Command "New-NetFirewallRule -DisplayName 'API Sistema Pedidos' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Force" >nul 2>&1
echo [OK] Puerto 3000 habilitado en el Firewall.
echo.

echo [2/4] Configurando Tailscale en modo desatendido (segundo plano permanente)...
powershell -Command "tailscale up --unattended" >nul 2>&1
echo [OK] Tailscale desatendido configurado.
echo.

echo [3/4] Instalando PM2 y registrando el Servicio de Windows...
call npm install -g pm2 pm2-windows-service
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; pm2-service-install.cmd -n 'PM2-Pedidos'"
echo [OK] Servicio PM2 Windows instalado.
echo.

echo [4/4] Iniciando la API REST de Pedidos y guardando persistencia...
cd %~dp0
call pm2 start npm --name "sistema-pedidos" -- run dev
call pm2 save
echo.
echo ======================================================
echo   CONFIGURACION COMPLETADA CON EXITO
echo   El servidor arrancara solo en cada reinicio.
echo ======================================================
echo.
pause
exit
