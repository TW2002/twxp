#currently does whatever you want. :)
# Rincrast's surround, based on SupG's
# Version 1.1
# Added option to deploy space mines in the surround scheme (ver 1.1)

:verifyprompt
    cutText CURRENTLINE $location 1 7
    stripText $location " "
if ($location = "Citadel")
	send "qd"
	waitFor "Planet #"
	getWord CURRENTLINE $pnum 2
	stripText $pnum "#"
	send "mnt*q"
	waitFor "Command [TL="
end
if ($location = "Planet")
	send "d"
	waitFor "Planet #"
	getWord CURRENTLINE $pnum 2
	stripText $pnum "#"
	send "mnt*q"
	waitFor "Command [TL="
end

loadVar $numFigsToUse
loadVar $figType
loadVar $mineDeploy
:start
if ($numFigsToUse = 0)
	getInput $numFigsToUse "Deploy how many figs per sector? "
	isNumber $test $numFigsToUse
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $numFigsToUse 0
		setVar $figType 0
		goto :start
	end
	if ($numFigsToUse < 1)
		echo ANSI_15 & "*Invalid number of fighters.*"
		setVar $numFigsToUse 0
		setVar $figType 0
		goto :start
	end
end
if ($figType = 0)
	echo ANSI_15 & "*What kind of figs to deply? (d, o, t) "
	getConsoleInput $figType singlekey
	lowercase $figType
	if ($figType <> "d") AND ($figType <> "o") AND ($figType <> "t")
		echo ANSI_15 & "*Invalid fighter type.*"
		setVar $numFigsToUse 0
		setVar $figType 0
		goto :start
	end
end
if ($mineDeploy = 0)
	echo ANSI_15 & "*Deploy mines? "
	getConsoleInput $mineDeploy singlekey
	lowercase $mineDeploy
	if ($mineDeploy <> "y") AND ($mineDeploy <> "n")
		echo ANSI_15 & "*Invalid entry.*"
		setVar $mineDeploy 0
		goto :minestart
	end
end
send "/"
setTextTrigger cursec :cursec "Command [TL="
pause

:cursec
getText CURRENTLINE $cursec "]:[" "] (?"
send "'Surrounding sector " & $cursec ".*"
setVar $loop 0
:loopn
if ($loop < SECTOR.WARPCOUNT[$cursec]) AND ($mineDeploy = "n")
	add $loop 1
	getDistance $dist SECTOR.WARPS[$cursec][$loop] $cursec
	if ($dist = 1) AND (SECTOR.WARPS[$cursec][$loop] <> STARDOCK) AND (SECTOR.WARPS[$cursec][$loop] > 10)
		setVar $send $send & "m" & SECTOR.WARPS[$cursec][$loop] & "* Za9999**  fZ" & $numFigsToUse & "*zc" & $figType & "*  < za9999**  "
	end
	goto :loopn
end
:loopy
if ($loop < SECTOR.WARPCOUNT[$cursec]) AND ($mineDeploy = "y")
	add $loop 1
	getDistance $dist SECTOR.WARPS[$cursec][$loop] $cursec
	if ($dist = 1) AND (SECTOR.WARPS[$cursec][$loop] <> STARDOCK) AND (SECTOR.WARPS[$cursec][$loop] > 10)
		setVar $send $send & "m" & SECTOR.WARPS[$cursec][$loop] & "* Za9999**  fZ" & $numFigsToUse & "*zc" & $figType & "h1z1*cq* h2z1*cq*  < za9999**  "
	end
	goto :loopy
end
send $send
if ($location = "Citadel")
	send "l" & $pnum & "*mnt*c"
end
if ($location = "Planet")
	send "l" & $pnum & "*mnt*"
end
send "'Sector " & $cursec " surrounded succesfully with " & $numFigsToUse & " fighters.*"
if ($mineDeploy = "y")
	send "'Mines deployed.*"
end
send "/"