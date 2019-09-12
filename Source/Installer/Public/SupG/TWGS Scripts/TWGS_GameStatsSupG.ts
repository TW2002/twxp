
setVar $tempname "c:\Program Files\Apache Group\Apache\htdocs\GAME" & GAME & ".tmp"
setVAr $links "c:\Program Files\Apache Group\Apache\htdocs\GAME" & GAME & ".php"
delete $tempname
fileExists $tst $links
if ($tst)
	setVar $init 0
else
	setVar $init 1
end
:reconnected
setEventTrigger 0 :discon "Connection lost"
:wait
setDelayTrigger getstat :getstat 600000
pause

:getstat
write $tempname "<body bgcolor=black><pre>"
send "clvq"
waitfor "Ranking Traders..."

:getclv
setTextLineTrigger clv :clv
pause

:clv
getWord CURRENTLINE $ender 1
if ($ender <> "Computer")
	setVar $SupGInclude~data CURRENTANSILINE
	gosub :SupGInclude~parseansi
	write $tempname $SupGInclude~data
	goto :getclv
else
	goto :getlog
end

:getlog
write $tempname "<HR>"
send "CD"
waitfor "Enter the beginning date you wish to read from. Today is"
getWord CURRENTLINE $currentdate 12
send $currentdate "*y"
setVar $today $currentdate
striptext $currentdate "/"
setVar $filename "c:\Program Files\Apache Group\Apache\htdocs\GAME" & GAME & $currentdate & ".html"
if ($init <> 1)
	if ($currentdate <> $predate)
		fileExists $tst $filename
		if ($tst = 0)
			write $links "<HR><center>Logs For : <a href=" & #34 & "GAME" & GAME & $currentdate & ".html" & #34 & ">" & $today & "</a></center>"
		end
	end
else
	write $links "<body bgcolor=black>"
	write $links "<center><font color=ffffff><h3>Game Logs</h3></font></center>"
	write $links "<hr><center><font color=ffffff>Logs For : </font><a href=" & #34 & "GAME" & GAME & $currentdate & ".html" & #34 & ">" & $today & "</a></center>"
	setVar $init 0
end
setVar $predate $currentdate
Waitfor "Include time/date stamp? (Y/N) [N] Yes"
:log
setTextLineTrigger heh :heh
setTextTrigger pause :pause "[Pause]"
setTextTrigger done :done "Computer command"
pause

:heh
killtrigger pause
killtrigger heh
killtrigger done
setVar $SupGInclude~data CURRENTANSILINE
gosub :SupGInclude~parseansi
write $tempname $SupGInclude~data & "</font></span>"
goto :log

:pause
killtrigger heh
killtrigger pause
killtrigger done
send "*"
goto :log

:done
killtrigger pause
killtrigger heh
send "Q"
goto :whosonline

:whosonline
write $tempname "<HR>"
write $tempname "<center><font color=" & #34 & "white" & #34 & ">Who's Playing</font></center>"
send "#"
waitfor "Who's Playing"
:getonline
setTextLineTrigger online :whoonline
setTextTrigger gotonline :gotonline "Command [TL="
pause

:whoonline
killtrigger gotonline
setVar $SupGInclude~data CURRENTANSILINE
gosub :SupGInclude~parseansi
write $tempname $SupGInclude~data
goto :getonline

:gotonline
write $tempname "<HR>"
write $tempname "<center><font color=" & #34 & "white" & #34 & ">Status Screen</font></center>"
send "V"
:v
setTextLineTrigger vscreen :vscreen
pause

:vscreen
getWord CURRENTLINE $stop 2
if ($stop = "Corporations")
	goto :slap
end
setVar $SupGInclude~data CURRENTANSILINE
gosub :SupGInclude~parseansi
write $tempname $SupGInclude~data
goto :v

:slap
killtrigger online
write $tempname "<HR><P><center><font color=" & #34 & "white" & #34 & ">Game Stats by SupG (GameStatsSupG.ts)</font></center>"
write $tempname "<center><font color=" & #34 & "white" & #34 & "><a href=" & #34 & "http://www.scripterstavern.com" & #34 & "target=" & #34 & "_blank" & #34 & ">www.scripterstavern.com</a></font></center>"
fileexists $spank $filename
if ($spank = 1)
	delete $filename
end
rename $tempname $filename
delete $tempname
goto :wait

:discon
waitfor "Command [TL="
goto :wait

include "SupGInclude"