#Script Name 		: IGSupG.ts
#Script Author		: SupG
#Date Completed/Updated : 01/22/02 
#Start Prompt 		: none
#Script Requirements 	: Your ship requires an Interdictor Generator
#Script Description 	: This script will turn your Interdictor back on if you 
#			  get hit by a photon.

:wait
setTextLineTrigger turnIG :IG " damaging your ship."
pause

:IG
getWord CURRENTLINE $test 1
if ($test = "F") or ($test = "R") or ($test = "P") or ($test = "'") or ($test = "`")
	goto :wait
end
waitfor "Command [TL="
send "by"
goto :wait
