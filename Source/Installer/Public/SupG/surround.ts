send "/"
setTextTrigger cursec :cursec "Command [TL="
pause

:cursec
getText CURRENTLINE $cursec "]:[" "] (?"
setVar $loop 0
:loop
if ($loop < SECTOR.WARPCOUNT[$cursec])
	add $loop 1
	getDistance $dist SECTOR.WARPS[$cursec][$loop] $cursec
	if ($dist = 1) AND (SECTOR.WARPS[$cursec][$loop] <> STARDOCK) AND (SECTOR.WARPS[$cursec][$loop] > 10)
		setVar $send $send & "m" & SECTOR.WARPS[$cursec][$loop] & "*Za9999**  fZ1*zcd*  <za9999**  "
	end
	goto :loop
end
send $send	 