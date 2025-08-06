@echo off
setlocal

:: Versão do Node que você quer instalar
set NODE_VERSION=22.5.5
set INSTALLER=node-v%NODE_VERSION%-x64.msi
set URL=https://nodejs.org/dist/v%NODE_VERSION%/%INSTALLER%

:: Garante que está na pasta do script
cd /d "%~dp0"

:: Verifica se node já existe
where node >nul 2>&1
if %errorlevel%==0 (
    echo Node.js ja instalado.
) else (
    echo Node.js nao encontrado. Baixando e instalando...

    curl -o %INSTALLER% %URL%
    if exist %INSTALLER% (
        echo Instalando Node.js silenciosamente...
        msiexec /i %INSTALLER% /quiet /norestart
        if %errorlevel% neq 0 (
            echo Erro durante a instalacao do Node.js.
            pause
            exit /b 1
        )
        echo Instalacao concluida.
        del %INSTALLER%
    ) else (
        echo Falha ao baixar o instalador.
        pause
        exit /b 1
    )
)

:: Atualiza a variável PATH para o processo atual (não atualiza o PATH global imediatamente)
set "PATH=%ProgramFiles%\nodejs;%PATH%"

:: Agora executa os comandos npm no diretório atual
echo Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo Erro no npm install.
    pause
    exit /b 1
)

echo Instalacao concluida com sucesso.
pause
endlocal