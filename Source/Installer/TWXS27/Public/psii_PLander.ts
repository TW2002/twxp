## TWX Script      : Photon, move, and the land on a designated planet
## Version         : 2.2
## Author          : Psion
## Description     : Photons an adjacent sector, then enters the sector and
##		   : lands on the designated planet.  Fires off one fighter
##	           : wave to destroy any remaining shields.
## Trigger Point   : Sector adjacent to the target sector
## Warnings        : Very little error correction built-in! Script MUST be
##		   : run from the sector adjacent the target.  Works best if
##		   : the target planet's shields are under 200 and the wave
##		   : of the ship you are using can take out all the
##		   : remaining shields in one wave.
## Other           : Pretty simple script. Clears the  avoid on the target
##		   : sector.  Gets the max fig wave for your ship
##                 : automatically, makes sure you have photons on board,
##                 : and makes sure the target sector is adjacent.
##                 : MAKE ABSOLUTELY SURE YOU PUT THE PLANET NUMBER IN
##                 : CORRECTLY!  FAILURE TO DO SO MAY TAKE YOU ON AN
##                 : EXPRESS WARP TO A PODDING!
##                 : Mad props to Traitor, I basically stole his photon timer.
##                 : My ICQ is 211279673.  Drop me a message if you have questions or problems.
##                 :
## Version History : 2.2 - Made a small bug fix.  Works with 2.02 and 2.03 now

##get current loc, must be command prompt
cutText CURRENTLINE $location 1 12

if ($location <> "Command [TL=")
	clientMessage "This script must be run from the Command prompt!"
	halt
end

##get current sector
cutText CURRENTLINE $currsec 24 5
stripText $currsec "]"
stripText $currsec " "
stripText $currsec "("
stripText $currsec "?"
stripText $currsec "="

##Gets sector num, planet ID, and wave size to launch
getinput $sector "Enter the sector to photon"
getinput $planet "Enter the planet ID to land on"

##check for phots
send "/"
setTextLineTrigger phot :phot "Phot "
pause

:phot
setVar $culine CURRENTLINE
getText $culine $poh "Phot " "Armd "
replaceText $poh #179 ""
if ($poh = 0)
        clientMessage "No photons on board ship!*"
        halt
end

##check if sector is adj
setVar $numadj SECTOR.WARPCOUNT[$currsec]
setVar $i 1
while ($i <= $numadj)
        if ($sector = SECTOR.WARPS[$currsec][$i])
                goto :adj
        end
        add $i 1
end
clientMessage "Target sector is not adjacent!*"
halt

:adj
setTextLineTrigger getwave :getwave "Max Figs Per Attack:"
send "c;"
pause

:getwave
getWord CURRENTLINE $wave 5

send "v0*yn"
send $sector
send "*"

:timer
send "t"
getWord CURRENTLINE $initTime 1

:checkTime
send "t"
getWord CURRENTLINE $currentTime 1
waitfor "Computer"
if ($initTime <> $currentTime)
	goto :ptorp
else
	goto :checkTime
end

:ptorp
##Fires the photon and enters the sector
send "py" & $sector & "*  q  " & $sector & "*  *  n  *  "
##Lands on the designated planet and launches one fighter wave
send "l" & $planet & "*  *  a  " & $wave & "*  *  *"
