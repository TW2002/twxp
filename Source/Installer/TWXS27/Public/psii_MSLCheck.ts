## TWX Script       : MSL Checker
## Version          : 1.4
## Author           : Psion
## Description      : Either lists all MSL sectors or checks if a single sector is in the MSLs
##                  : Will also output a list of AMTRAK sectors
## Trigger Point    : Anywhere, handles everything through the TWX DB
## Warnings         : MUST have a full ZTM to run
##                  : Can be run if AC or Rylos is unknown, but will not be able to plot
##                  : complete MSLs (obviously).  Enter 0 for unknown class 0s and it 
##                  : will do the best it can.  Script will NEVER give a false positive,
##                  : only false negatives.  So it may think a sector that is actually inside
##                  : the MSLs is outside them, but never vice versa.
## Other            : Checks for and ignores repeat sectors
##		    : Future version might check for planets in MSLs too
##	 	    : Fedspace sectors (1-10 and SD) are NOT included in AMTRACK or MSL lists
##                  : They ARE included when checking a single sector though
##                  : AMTRACK includes all sectors adj to the MSL sectors, excepting the MSL
##                  : sectors themselves, plus all sectors adj to 1-10, excepting 1-10 themselves
##                  : My ICQ is 211279673.  Drop me a message if you have questions or problems.

loadVar $ac
loadVar $rylos

:menu
echo "*  " ansi_12 "Stardock is: " STARDOCK "  Alpha Centauri is: " $ac "  Rylos is: " $rylos
echo "*  " ansi_9 "1." ansi_10 " Output MSL sectors to file"
echo "*  " ansi_9 "2." ansi_10 " Check a single sector"
echo "*  " ansi_9 "3." ansi_10 " Output AMTRAK sectors to file"
echo "*  " ansi_9 "4." ansi_10 " Change Alpha Centauri"
echo "*  " ansi_9 "5." ansi_10 " Change Rylos"
echo "**"
getConsoleInput $opt SINGLEKEY

if ($opt = 1)
        goto :buildmsl
elseif ($opt = 2)
        setVar $choice 1
        goto :buildmsl
elseif ($opt = 3)
        setVar $amtrak 1
        goto :buildmsl
elseif ($opt = 4)
        goto :changeac
elseif ($opt = 5)
        goto :changerylos
else
        halt
end
##Plots
##1#    1	SD
##2#    SD	1
##3#    SD	AC
##4#    AC	SD
##5#    SD	Ry
##6#    Ry	SD
##7#    AC	Ry
##8#    Ry	AC
:buildmsl
setArray $paths 8 2
setVar $i 1
setVar $k 1

##Builds static plot array
setVar $paths[1][1] 1
setVar $paths[1][2] STARDOCK
setVar $paths[2][1] STARDOCK
setVar $paths[2][2] 1
setVar $paths[3][1] STARDOCK
setVar $paths[3][2] $ac
setVar $paths[4][1] $ac
setVar $paths[4][2] STARDOCK
setVar $paths[5][1] STARDOCK
setVar $paths[5][2] $rylos
setVar $paths[6][1] $rylos
setVar $paths[6][2] STARDOCK
setVar $paths[7][1] $ac
setVar $paths[7][2] $rylos
setVar $paths[8][1] $rylos
setVar $paths[8][2] $ac

##Plots all MSLs
While ($k <= 8)
        setVar $one $paths[$k][1]
        setVar $two $paths[$k][2]
        gosub :plotpath
        add $k 1
end


if ($incflag = 1)
        echo "** THERE IS INSUFFICIENT DATA TO PLOT COMPLETE MSLS!!"
        echo "* DATA IS INCOMPLETE.  SECTORS LISTED AS OUTSIDE THE"
        echo "* MSLS MAY ACTUALLY BE IN ONE OF THE MSLS!"
end

if ($choice = 1)
        goto :checkone
elseif ($amtrak = 1)
        goto :amtrak
end

:listall

##Checks for existing MSL file
:mslfilecheck
setVar $outfile GAMENAME & "_Psi_MSLs.txt"
fileExists $filepresent $outfile
if ($filepresent)
	echo "** MSL file already exists, do you want to overwrite? [y/n]"
	getConsoleInput $overwrite SINGLEKEY
	lowerCase $overwrite
	if ($overwrite = "y")
		delete $outfile
	else
		halt
	end
end

setVar $m 1
While ($m < $i)
        if (($msl[$m] > 11) AND ($msl[$m] <> STARDOCK))
                write $outfile $msl[$m]
        end
        add $m 1
end
echo "**" $outfile " completed!**"
halt

##Checks if a single sector in the MSLs
:checkone
echo "** What sector would you like to check?*"
getConsoleInput $checksec

if (($checksec >= 1) AND ($checksec <= 10))
        goto :inmsl
end
if ($checksec = STARDOCK
        goto :inmsl
end
if ($checksec <= 0)
        echo "*Invalid Sector!*"
        goto :checkone
elseif ($checksec > SECTORS)
        echo "*Invalid Sector!*"
        goto :checkone
end

setVar $p 1
While ($p <= $i)
        if ($checksec = $msl[$p])
                goto :inmsl
        end
        add $p 1
end

:outmsl
echo "** Sector " $checksec " is NOT in the MSLs!**"
goto :another

:inmsl
echo "** Sector " $checksec " IS in the MSLs!**"

:another
echo "** Would you like to check another sector? [y/n]*"
getConsoleInput $another SINGLEKEY
lowerCase $another
if ($another = "y")
        goto :checkone
else
        halt
end

:amtrak
setVar $a 1
setVar $trackcount 1
while ($a < $i)
        setVar $temp $msl[$a]
        gosub :checkadj
        add $a 1
end
##Adds secs adj to Fedspace to AMTRAK list
setVar $a 1
while ($a <= 10)
        setVar $temp $a
        gosub :checkadj
        add $a 1
end

##Write amtrak secs
:amtrakfilecheck
setVar $outfile GAMENAME & "_Psi_AMTRAK.txt"
fileExists $filepresent $outfile
if ($filepresent)
	echo "** AMTRAK file already exists, do you want to overwrite? [y/n]"
	getConsoleInput $overwrite SINGLEKEY
	lowerCase $overwrite
	if ($overwrite = "y")
		delete $outfile
	else
		halt
	end
end

setVar $m 1
While ($m < $trackcount)
        if (($track[$m] > 11) AND ($track[$m] <> STARDOCK))
                write $outfile $track[$m]
        end
        add $m 1
end
echo "**" $outfile " completed!**"
halt

########

##Changes AC
:changeac
echo "*What sector is Alpha Centauri in?"
echo "*Enter zero if unknown.*"
getConsoleInput $ac
if ($ac <> 0)
        saveVar $ac
end
goto :menu

##Changes Rylos
:changerylos
echo "*What sector is Rylos in?"
echo "*Enter zero if unknown.*"
getConsoleInput $rylos
if ($rylos <> 0)
        saveVar $rylos
end
goto :menu

##Plots MSLs and records sectors
:plotpath
if ($one = 0)
        setVar $incflag 1
        return
elseif ($two = 0)
        setVar $incflag 1
        return
end

getCourse $plot $one $two
setvar $j 1
while ($j <= $plot)
        setVar $msldupe 0
        setVar $msldupecheck 1
        While ($msldupecheck <= $i)
                if ($plot[$j] = $msl[$msldupecheck])
                        setVar $msldupe 1
                end
                add $msldupecheck 1
        end
        if ($msldupe <> 1)
                setVar $msl[$i] $plot[$j]
                add $i 1
        end
        add $j 1
end
return

##Checks and records adj sectors, excepting duplicates
:checkadj
setVar $numwarp SECTOR.WARPCOUNT[$temp]
setVar $warp 1
while ($warp <= $numwarp)
        ##Edits out repeated MSL sectors
        setVar $msltrackdupe 0
        setVar $msltrackdupecheck 1
        While ($msltrackdupecheck <= $i)
                if (SECTOR.WARPS[$temp][$warp] = $msl[$msltrackdupecheck])
                        setVar $msltrackdupe 1
                end
                add $msltrackdupecheck 1
        end
        ##Edits out repeated AMTRACK sectors
        setVar $trackdupe 0
        setVar $trackdupecheck 1
        While ($trackdupecheck <= $trackcount)
                if (SECTOR.WARPS[$temp][$warp] = $track[$trackdupecheck])
                        setVar $trackdupe 1
                end
                add $trackdupecheck 1
        end
        if (($msltrackdupe <> 1) AND ($trackdupe <> 1))
                setVar $track[$trackcount] SECTOR.WARPS[$temp][$warp]
                if ($sdcheck = 1)
                        echo "*" $track[$trackcount] "*"
                end
                add $trackcount 1
        end
        add $warp 1
end
return
