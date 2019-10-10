# INCLUDE: Z_Logs 
#
# Gosub :Z_Logs~ENTERLOG 
#
# ENTERLOG 
# SetVar $Z_Logs~logentry 
# SetVar $Z_Logs~logentry $Z_Logs~line - to place a line in the log. 
:ENTERLOG
SetVar $line "------------------------------------------------------------"
GetTime $logtime "dd/mm/yyyy  hh:mm"
Write GAMENAME & "_Z-Logs.log" $logtime & " - " & $logentry
SetVar $logentry ""
Return
