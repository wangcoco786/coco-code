Dim WshShell, projectDir, nodePath, cmd
Set WshShell = CreateObject("WScript.Shell")

projectDir = "c:\Users\15321\Desktop\dist\ai-pm-platform"
nodePath = "node"

' 切换到项目目录并启动，日志写入 logs.txt
cmd = "cmd /c cd /d """ & projectDir & """ && node server.js > """ & projectDir & "\logs.txt"" 2>&1"

WshShell.Run cmd, 0, False
Set WshShell = Nothing
