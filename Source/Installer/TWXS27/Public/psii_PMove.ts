## TWX Script      : Photon move
## Version         : 2.3
## Author          : Psion
## Description     : Photons an adjacent sector, then enters the sector
## Trigger Point   : Sector adjacent to the target sector
## Warnings        : Very little error correction built-in! Script MUST be
##		   : run from the sector adjacent the target.
## Other           : Pretty simple script. Clears the  avoid on the target
##		   : sector.  Makes sure you have photons on board,
##                 : and makes sure the target sector is adjacent.
##                 : Oh, and don't do anything really stupid, like try to
##                 : launch a photon into fedspace.
##                 : Mad props to Traitor, I basically stole his photon timer.
##                 : My ICQ is 211279673.  Drop me a message if you have questions or problems.
##                 :
## Version History : 2.3 - Made a small bug fix.  Works with 2.02 and 2.03 now

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
echo "*What sector do you want to photon?"
GetConsoleInput $sector

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
send "cv0*yn"
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
send "py" & $sector & "*  q  " & $sector & "*  *  *"
