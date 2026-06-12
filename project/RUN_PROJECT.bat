@echo off
start cmd /k "cd /d %~dp0server && npm start"
start cmd /k "cd /d %~dp0client && npm start"