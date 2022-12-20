#Rincrast's mine deploy!
#Deploys armids and limpets
#Version 1.0
loadVar $numArmids
loadVar $numLimps

:minestart
if ($numArmids = 0)
	getInput $numArmids "How many Armid Mines? "
	isNumber $test $numArmids
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of mines.*"
		setVar $numArmids 0
		goto :minestart
	end
	if ($numArmids < 1)
		echo ANSI_15 & "*Invalid number of mines.*"
		setVar $numArmids 0
		goto :minestart
	end
end
if ($numLimps = 0)
	getInput $numLimps "How many Limpet Mines? "
	isNumber $test $numLimps
	if ($test = 0)
		echo ANSI_15 & "*Invalid number of mines.*"
		setVar $numArmids 0
		setVar $numLimps 0
		goto :minestart
	end
	if ($numLimps < 1)
		echo ANSI_15 & "*Invalid number of mines.*"
		setVar $mineDeploy 0
		goto :minestart
	end
end


setVar $mineBurst "* z *h1z" & $numArmids & "*cq* h2z" & $numLimps & "*cq*zn "

:verifyprompt
    cutText CURRENTLINE $location 1 7
    stripText $location " "
if ($location = "Citadel")
	send "qd"
	waitFor "Planet #"
	getWord CURRENTLINE $pnum 2
	getWord CURRENTLINE $currentSector 5
	stripText $pnum "#"
	stripText $currentSector ":"
	setVar $mineBurst "q z *h1z" & $numArmids & "*cq* h2z" & $numLimps & "*cq*zn l " & $pnum & "* c"
	send $mineBurst
elseif ($location = "Command")
	send "d"
	waitFor "Sector  :"
	getWord CURRENTLINE $currentSector 3
	setVar $mineBurst "* z *h1z" & $numArmids & "*cq* h2z" & $numLimps & "*cq*zn "
	send $mineBurst
else 
	send "'Must be at Citadel or Commmand prompt to execute mine deploy.*"
	halt
end

if ($location = "Citadel")
	send "s"
	waitFor "Citadel command (?=help) S"
	waitFor "<Scan Sector>"
	setTextTrigger CitadelPrompt :SDone "Citadel command (?=help)"
	setTextTrigger minedsector :SDone "Mined Sector: Do you wish to Avoid"
else
	send "d"
	waitFor "(?=Help)? : D"
	waitFor "<Re-Display>"
	setTextTrigger CommandPrompt :SDone "Command [TL="
end
	setvar $s 1
 
	:SNextLine
	killTrigger GetSInfo
	setTextLineTrigger GetSInfo :SInfo
	pause
 
	:SInfo
	SetVar $CSInfo[$s] CURRENTLINE
	add $s 1
	Goto :SNextLine
	Pause

	:SDone
	Setvar $cs $s
	Setvar $s 1
	send "*"
	send "'*"
	:CSDisplay
	If ($s = $cs-1)
		Goto :csAllDone
	end
	Send "." $CSInfo[$s] "*"
	add $s 1
	goto :CSDisplay
	:csAlldone
	send ".*Rin MineDeploy version 1.0 completed!**"
	halt
#These mines are not under your control.