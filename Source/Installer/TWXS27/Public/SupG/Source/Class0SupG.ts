# TWX SupG Script	: Class0SupG.ts
# Author           	: SupG
# Date Completed/Updated: 12/22/02
# Description      	: Simple script that uses ZTM data to find likely
#                    	  sectors that may contain a class 0 port.
# Trigger Point    	: Any
# Other            	: Let me know of any problems with this script
#
#		   SupG
#		www.scripterstavern.com
setVar $filename GAMENAME & "_CLASS0.txt"
setVar $scriptName "   SupGClass0  "
:signature
echo ANSI_6 "**-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "(" ansi_15 "      " $scriptName "      " ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-*"
echo ANSI_6 "-" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "(" ansi_15 "  www.scripterstavern.com  " ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-**"

delete $filename
setVar $speedy 11

echo ansi_15 "*Finding Sectors : Status (| = 10%)*"
echo "1%        100%* "
setVar $heh SECTORS
divide $heh 10
setVar $statuscount 0

:readit
if ($speedy < SECTORS)
	add $statuscount 1
	if ($statuscount = $heh)
		echo ansi_12 "|"
		setVar $statuscount 0
	end
	if (SECTOR.WARPCOUNT[$speedy] >= 6) and (SECTOR.WARPINCOUNT[$speedy] > 6)
			write $filename $speedy
	end
    	add $speedy 1
	goto :readit
end
:done
echo ansi_15 "*Done, sector list in file name: " $filename
halt
