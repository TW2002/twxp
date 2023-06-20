systemscript
:verytop
send "'Bust tracker running - say 'BustTable' in subspace to view the busts.*"
waitFor "Message sent on sub-space channel"
:top
killtrigger bustedsupg
killtrigger bustedck
setTextLineTrigger bustedck :ckbust "Busted in ship"
setTextLineTrigger bustedsupg :supgbust "- Busted"
setTextLineTrigger table :printTable "BustTable"
pause

:ckbust
killtrigger bustedsupg
killtrigger table
gosub :spoof
if ($spoof = 1)
	goto :top
end
gosub :getstuffs
getWord $bustLine $bustShip 4
stripText $bustShip ","
goto :next

:supgbust
killtrigger bustedck
killtrigger table
gosub :spoof
if ($spoof = 1)
	goto :top
end
gosub :getstuffs
getWord $bustLine $bustShip 1

:next
if ($busted[$bustship] = 0)
	add $ships 1
	setVar $ship[$ships] $bustship
end
setVar $busted[$bustShip] $who

send "'Bust recorded...*"
:printTable
send "'*--Bust Table--*"
setVAr $table 0
:table
if ($table < $ships)
	add $table 1
	send $ship[$table] " - " $busted[$ship[$table]] "*"
	goto :table
end
if ($table = 0)
	send "No Busts Recorded.*"
end
send "*"
goto :top

:getStuffs
cutText CURRENTLINE $who 3 6
cutText CURRENTLINE $bustLine 9 9999 
return

:spoof
getWord CURRENTLINE $chk 1
if ($chk <> "R")
	setVar $spoof 1
else
	setVAr $spoof 0
end
return