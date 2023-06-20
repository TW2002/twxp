#Script Name 		: SupGTarget
#Script Author		: SupG
#Date Completed/Updated : 01/22/02 
#Start Prompt 		: Command
#Script Requirements 	: SupGInclude.ts required in the same directory as this file. Also
#			  ShipCapSupG.ts is also required to be running to complete the attack
#			  sequence. You may edit this script as you choose.
#Script Description 	: Script that finds the appropriate attack sequence for a given target
#WARNINGS		: This script will try to attack ANYTIME it sees the Target, whether
#			  that be by displaying the sector, or by seeing him/her warp in, log in,
#			  pop off a planet, etc.. Also, it will try to activate from any prompt, so 
#			  try to be at the Command prompt as much as possible while running this.
#			  Be carefull anytime you use an attack script
#DISCLAIMER		: SupG accepts NO RESPONSIBILITY for any mishaps 
#			  that occur to you or your character concerning the use of this script.
#			  Any bugs or problems found in this script should be directed
#			  toward SupG only at www.twtavern.com in the forum.
#				
#					SupG
#					www.scripterstavern.com

getinput $targetperson "Target (EXACTLY as it appears in the game)"

:top
killalltriggers
setTextLineTrigger lift :checker $targetperson &" blasts off from the StarDock"
setTextLineTrigger twarp :checker $targetperson &" appears in a brilliant flash of warp energies!"
setTextLineTrigger warp :checker $targetperson &" warps into the sector."
setTextLineTrigger port :checker $targetperson &" lifts off from"
setTextLineTrigger enter :checker $targetperson &" enters the game."
setTextlineTrigger check :ehe "<Re-Display>"
pause

:checker 
killalltriggers
send "anny50000*annny50000*"
halt

send "D"
:ehe
setTextLineTrigger :cursec :check "Sector  :"
pause
:check
getWord CURRENTLINE $sector 3
setTextlineTrigger feds :feds "Federals:"
setTextLineTrigger traders :traders "Traders :"
pause

:feds
setVar $feds 1
killtrigger traders
:fedloop
setTextLineTrigger fed :fed 
pause

:fed
getWord CURRENTLINE $end 1
if ($end = "Traders")
	getWordPos CURRENTLINE $pos $targetperson
	goto :traders
elseif ($end = "Ships")
	goto :end
elseif ($end = "Warps")
	goto :end
else
	add $feds 1
	goto :fedloop
end

:traders
killtrigger feds
getWordPos CURRENTLINE $pos $targetperson
if ($pos > 0)
	setVar $locked 1
	setTextTrigger noun :end "Warps to Sector"
	pause
end
setVar $traders 1
killalltriggers

:traderloop
setTextLineTrigger trade :trade
pause

:trade
getWord CURRENTLINE $end 1
if ($end = "Ships")
	goto :end
elseif ($end = "Warps")
	goto :end
end
getWordPos CURRENTLINE $pos $targetperson
if ($pos > 0)
	setVar $locked 1
	setTextTrigger noun :end "Warps to Sector"
	pause
end

add $traders 1
goto :traderloop

:end
divide $feds 2
divide $traders 2
setVar $target ($feds + $traders + SECTOR.SHIPCOUNT[$sector])
if ($locked = 1)
	setVar $ns 0
	send "a"
:ns	
	if ($ns < $target)
		add $ns 1
		send "n"	
		goto :ns
	end
	send "y"
end
setVar $locked 0
goto :top 
halt
