systemscript
setVar $conf GAMENAME & "_ATCKCONF.txt"
fileExists $exist $conf
if ($exist)
	gosub :readconf
end
:top
killtrigger nav
killtrigger cursec
killtrigger keypress
setTextOutTrigger keypress :keypress
setTextTrigger cursec :cursec "(?=Help)? :"
pause

:keypress
getOutText $text
if ($text = "atk_saveme")
	send "'" $cursec "=saveme*"
	send "'pickup " $cursec " ::*"
elseif ($text = "attack1")
	send "aty"
	gosub :maxfigs
elseif ($text = "attack2")
	send "atny"
	gosub :maxfigs
elseif ($text = "attack3")
	send "atnny"
	gosub :maxfigs
elseif ($text = "attack4")
	send "atnnny"
	gosub :maxfigs
elseif ($text = "attack5")
	send "atnnnny"
	gosub :maxfigs
elseif ($text = "attack6")
	send "atnnnnny"
	gosub :maxfigs
elseif ($text = "attack7")
	send "atnnnnnny"
	gosub :maxfigs
elseif ($text = "attack8")
	send "atnnnnnnny"
	gosub :maxfigs
elseif ($text = "attack9")
	send "atnnnnnnnny"
	gosub :maxfigs
elseif ($text = "attack0")
	send "atnnnnnnnnny"
	gosub :maxfigs
elseif ($text = "macro1")
	setVar $macro $macro[1]
	gosub :macro
elseif ($text = "macro2")
	setVar $macro $macro[2]
	gosub :macro
elseif ($text = "macro3")
	setVar $macro $macro[3]
	gosub :macro
elseif ($text = "macro4")
	setVar $macro $macro[4]
	gosub :macro
elseif ($text = "recmac1")
	if ($macro[1] <> 0)
		echo ANSI_15 "*Current macro recorded is : " $macro[1] "*"
	else
		echo ANSI_15 "*Current macro is empty.*"
	end
	getInput $macro "(Macro 1) Enter macro to record (enter to retain old value)"
	if ($macro <> "")
		setVar $macro[1] $macro
	end
	gosub :saveconf
elseif ($text = "recmac2")
	if ($macro[2] <> 0)
		echo ANSI_15 "*Current macro recorded is : " $macro[2] "*"
	else
		echo ANSI_15 "*Current macro is empty.*"
	end
	getInput $macro "(Macro 2) Enter macro to record (enter to retain old value)"
	if ($macro <> "")
		setVar $macro[2] $macro
	end
	gosub :saveconf
elseif ($text = "recmac3")
	if ($macro[3] <> 0)
		echo ANSI_15 "*Current macro recorded is : " $macro[3] "*"
	else
		echo ANSI_15 "*Current macro is empty.*"
	end
	getInput $macro "(Macro 3) Enter macro to record (enter to retain old value)"
	if ($macro <> "")
		setVar $macro[3] $macro
	end
	gosub :saveconf
elseif ($text = "recmac4")
	if ($macro[4] <> 0)
		echo ANSI_15 "*Current macro recorded is : " $macro[4] "*"
	else
		echo ANSI_15 "*Current macro is empty.*"
	end
	getInput $macro "(Macro 3) Enter macro to record (enter to retain old value)"
	if ($macro <> "")
		setVar $macro[4] $macro
	end
	gosub :saveconf
elseif ($text = "atk_photon")
	send "sh"
	waitFor ")uit? [D] H"
	waitFor "(?=Help)? :"
	setVar $cnt 0
	:cnt
	if ($cnt < SECTOR.WARPCOUNT[$cursec])
		add $cnt 1
		if (SECTOR.TRADERCOUNT[SECTOR.WARPS[$cursec][$cnt]] > 0) AND (SECTOR.WARPS[$cursec][$cnt] > 10) AND (SECTOR.WARPS[$cursec][$cnt] <> STARDOCK)
			send "cpy" SECTOR.WARPS[$cursec][$cnt] "*q"
		else
			goto :cnt
		end
	end
elseif ($text = "atk_surround")
	load "surround.ts"
else
	processOut $text
end
goto :top


:maxfigs
setVar $mf 1
killtrigger corp
killtrigger max
setTextTrigger corp :corp "Corporate command"
setTextTrigger max :max ") [0]?"
pause

:max
killtrigger corp
getText CURRENTLINE $max "0 to " ") ["
stripText $max ","
send $max "*"
return

:cursec
getText CURRENTLINE $cursec "]:[" "] (?"
goto :top

:corp
killtrigger max
setVar $mf 0
send "*"
return

:macro
getLength $macro $len
setVar $loop 0
:macloop
if ($loop < $len)
	add $loop 1
	cutText $macro $char $loop 1
	if ($char = #42)
		send "*"
	else
		send $char
	end
	goto :macloop
end
return

:readconf
read $conf $line $reader
if ($line <> "EOF")
	setVar $macro[$reader] $line
	add $reader 1
	goto :readconf
end
return

:saveconf
delete $conf
write $conf $macro[1]
write $conf $macro[2]
write $conf $macro[3]
write $conf $macro[4]
return