##small change, should not write 0s now....

## TWX Script      : Psion's Avoid Handler
## Version         : 1.1
## Author          : Psion
## Description     : Complete avoid handler, will save avoids, combine avoid lists,
##		   : filter avoid list by current fighters, and load saved avoids
## Trigger Point   : Command prompt
## Warnings        : Still in testing, works fine on a small scale, may have problems
##		   : when dealing with 100s of avoids and/or 1000s of fighters.  Also
##		   : not having a blank line at the end of any files to be concatenated
##		   : may cause a problem where 2 avoided sectors are combined and treated
##		   : as a single avoid, ie 11 and 47 becomes 1147.  Working on a fix now.
## Other           : A chat about probing with Kemper3 and some references he made to
##		   : scripts of his own that do similar things is what gave me the idea
##                 : to write this.  RammaR gave me the code to grab the currently avoided
##                 : sectors, I made very few changes, that section is almost entirely his
##                 : work.  He was also a big help figuring out some of the weirdness
##                 : involved with TWX menus.
##                 : My ICQ is 211279673.  Drop me a message if you have questions or problems.


##get current loc, must be command prompt
cutText CURRENTLINE $location 1 12

if ($location <> "Command [TL=")
	clientMessage "This script must be run from the Command prompt!"
	halt
end

addMenu "" "Psion's Avoid Handler" "Avoid Operations" "." "" "Main" FALSE
addMenu "Psion's Avoid Handler" "Save And Clear Avoids" "Save And Clear Avoids" "1" :Savevoids "" TRUE
addMenu "Psion's Avoid Handler" "Concatenate Avoids"  "Combine Avoid Lists" "2" :Concat "" FALSE
addMenu "Psion's Avoid Handler" "Refresh Fighter List" "Refresh Fighter List" "3" :Refresh "" TRUE
addMenu "Psion's Avoid Handler" "Filter Avoids"  "Filter Avoids By Current Fighters" "4" :Filter "" TRUE
addMenu "Psion's Avoid Handler" "Load Avoids"  "Load Avoids From File" "5" :Loadvoids "" TRUE

:start_menu
ECHO ANSI_2 "*----------------------------------------*"
ECHO ANSI_10 "    Psion's Avoid Handler v1.1       "
ECHO ANSI_2 "*----------------------------------------*"
openMenu "Psion's Avoid Handler"

##Saves then clears avoids
:Savevoids
:Read_Avoids
setVar $void_total 0
send "cxq"
waitFor "<List Avoided Sectors>"
setTextLineTrigger readLine :Read_line
pause

:Read_line
setVar $count3 1
setVar $line_Text CURRENTLINE
while ($count3 <= 11)
        getWord $line_text $sector $count3
        if ($sector = "Computer") OR ($sector = "No")
                goto :void_read_complete
        elseIf ($sector > 0)
                add $void_total 1
                setVar $void[$void_total] $sector
        end
add $count3 1
end

:Void_Trigger
setTextLineTrigger readLine :Read_line
pause

:void_read_complete
waitFor "Command [TL"
setVar $outfile GAMENAME & "_Avoids.psi"
fileExists $filepresent $outfile
if ($filepresent)
	delete $outfile
end

setVar $i 1
while ($i <= $void_total)
        write $outfile $void[$i]
        add $i 1
end
send " c v 0* y y q "
setDelayTrigger slowdown1 :slowdown1 500
pause
:slowdown1
ClientMessage "Avoids saved to " & $outfile & "!*"
goto :start_menu

##Concatenates 2 lists, removing dupes
:Concat
closeMenu
echo "*What is the name of the file to concatenate?*"
getConsoleInput $catfile
fileExists $filepresent $catfile
if ($filepresent = FALSE)
        clientMessage "No Such File!*"
        goto :wait2
end

:readvoidlist
setVar $voidfile GAMENAME & "_Avoids.psi"
fileExists $filepresent $voidfile
if ($filepresent = FALSE)
        clientMessage "No avoids file exists!*"
        goto :wait2
end
setVar $voidlistline 1
while ($rvoid <> EOF)
        read $voidfile $rvoid $voidlistline
        if (($rvoid <> 0) AND ($rvoid <> "EOF"))
                setVar $readvoids[$voidlistline] $rvoid
        end
        add $voidlistline 1
end

:readcatfile
setVar $catfileline 1
while ($catvoid <> EOF)
        read $catfile $catvoid $catfileline
        if (($catvoid <> 0) AND ($catvoid <> "EOF"))
                setVar $catvoids[$catfileline] $catvoid
        end
        add $catfileline 1
end

:catcompare
setVar $catloop 1
setVar $voidloop 1
while ($catloop < $catfileline)
        setVar $dupe FALSE
        while ($voidloop < $voidlistline)
                if ($catvoids[$catloop] = $readvoids[$voidloop])
                        setVar $dupe TRUE
                end
                add $voidloop 1
        end
        if (($dupe = FALSE) AND ($catvoids[$catloop] <> 0))
                write $voidfile $catvoids[$catloop]
        end
        add $catloop 1
end


clientMessage "Lists concatenated and filtered for duplicates!*"

:wait2
setDelayTrigger slowdown2 :slowdown2 500
pause
:slowdown2
goto :start_menu

##Builds a fig list
:Refresh
:figlist
setVar $figfile GAMENAME & "_Figs.psi"
delete $figfile

setArray $figlist SECTORS
setVar $fc 1
send "g"
waitfor "=========="
setTextLineTrigger getfigs :getfigs " "
setTextLineTrigger listdone :listdone " Total    "
pause

:getfigs
getWord CURRENTLINE $newfig 1
setVar $figlist[$newfig] 1
write $figfile $newfig
add $fc 1
setTextLineTrigger getfigs :getfigs " "
pause

:listdone
killTrigger getfigs

waitFor "Command [TL="

:wait3
setDelayTrigger slowdown3 :slowdown3 500
pause
:slowdown3
goto :start_menu

##Filters avoids by fig list
:Filter
:readavoidlist
setVar $avoidfile GAMENAME & "_Avoids.psi"
fileExists $filepresent $avoidfile
if ($filepresent = FALSE)
        clientMessage "No avoids file exists!*"
        goto :wait4
end
setVar $avoidlistline 0
while ($ravoid <> EOF)
        add $avoidlistline 1
        read $avoidfile $ravoid $avoidlistline
        if (($ravoid <> 0) AND ($ravoid <> "EOF"))
                setVar $readavoids[$avoidlistline] $ravoid
        end

end

:readfiglist
setVar $figfile GAMENAME & "_Figs.psi"
fileExists $filepresent $figfile
if ($filepresent = FALSE)
        clientMessage "No fig file exists!*"
        goto :wait4
end
setVar $figline 0
while ($figsec <> EOF)
        add $figline 1
        read $figfile $figsec $figline
        if (($figsec <> 0) AND ($figsec <> "EOF"))
                setVar $figlist[$figline] $figsec
        end

end

:figfilter
setVar $vloop 1
setVar $newvloop 1
while ($vloop < $avoidlistline)
        setVar $filtersec FALSE
        setVar $floop 1
        while ($floop < $figline)
                if ($readavoids[$vloop] = $figlist[$floop])
                        setVar $filtersec TRUE
                end
                add $floop 1
        end
        if ($filtersec = FALSE)
                add $newvloop 1
                setVar $newavoidlist[$newvloop] $readavoids[$vloop]
        end
        add $vloop 1
end

:writenewvoids
delete $avoidfile
setVar $vwriteloop 0
while ($vwriteloop < $newvloop)
        add $vwriteloop 1
        if ($newavoidlist[$vwriteloop] <> 0)
                write $avoidfile $newavoidlist[$vwriteloop]
        end
end

clientMessage "Avoids filtered!*"
:wait4
setDelayTrigger slowdown4 :slowdown4 500
pause
:slowdown4
goto :start_menu

##Loads saved avoids
:Loadvoids
setVar $infile GAMENAME & "_Avoids.psi"
fileExists $filepresent $infile
if ($filepresent = FALSE)
        clientMessage "No avoids file exists!*"
        goto :wait5
end

send "c"
setVar $linenum 1
while ($curvoid <> EOF)
        read $infile $curvoid $linenum
        if (($curvoid <> 0) AND ($curvoid <> "EOF"))
                send "v" $curvoid "*"
        end
        add $linenum 1
end

send "q"
waitFor "<Computer deactivated>"
waitFor "Command [TL="
ClientMessage "Avoids Loaded!*"

:wait5
setDelayTrigger slowdown5 :slowdown5 500
pause
:slowdown5
ClientMessage "Ready To Probe!*"
