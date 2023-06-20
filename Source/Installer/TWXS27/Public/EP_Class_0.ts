# Script: EP_Class_0.ts, v1.2
# Author: ElderProphet - ElderProphet@comcast.net
# Last Update: 12/2005
# Future Plans: Update for use with CURRENTSECTOR after next TWX release.
#
# This script requires good ZTM data.  It simply queries the TWX database for
# sectors that have 6 warps out, and at least a single one-way in.  When it
# finds a sector meeting these criteria, it performs a few additional checks in
# an attempt to further narrow the possibilities.
#
# This script will show distances if launched from the Command prompt.

:findClass0s
echo #27 "[2J" ANSI_14 "*Class 0 Search (v1.2), by " ANSI_12 "+" ANSI_11 "ElderProphet" ANSI_12 "+**"
echo ANSI_11 "Current List of Class 0 Possibilities" ANSI_10 "*"
setVar $mySector 0
getWord CURRENTLINE $command 1
if ($command = "Command")
	getText CURRENTLINE $mySector "]:[" "] (?="
end
setVar $Class0Log "Class_0_Check-" & GAMENAME & ".txt"
delete $Class0Log
setVar $a 11
while ($a <= SECTORS)
	if (SECTOR.WARPCOUNT[$a] = 6) and (SECTOR.BACKDOORCOUNT[$a] > 0) and ($a <> STARDOCK)
		gosub :knownPortCheck
	end
	add $a 1
end
echo "**" ANSI_11 "Check the file named " ANSI_14 $Class0Log "**"
halt

:knownPortCheck
# If we've explored this sector, then only report it if it's one of the Class 0s.
if (SECTOR.EXPLORED[$a] = "YES")
	if (PORT.NAME[$a] = "Alpha Centauri") or (PORT.NAME[$a] = "Rylos")
		echo "*Class 0, " PORT.NAME[$a] ", found, Sector: " $a
		if ($mySector <> 0)
			getDistance $distance $mySector $a
			if ($distance > 0)
				echo " -> " $distance " hops."
			end
		end
	end
# Only report unexplored sectors, or scanned sectors with a density > 100.
elseif ((SECTOR.EXPLORED[$a] = "DENSITY") and (SECTOR.DENSITY[$a] >= 100)) or (SECTOR.EXPLORED[$a] = "NO") or (SECTOR.EXPLORED[$a] = "CALC")
	write $Class0Log $a
	echo "*" $a
	if ($mySector <> 0)
		getDistance $distance $mySector $a
		if ($distance > 0)
			echo " -> " $distance " hops."
		end
	end
end
return