#Look at making mow holo more efficent
#turn limit or reporting? 
loadVar $switchboard~bot_name
gosub :BOT~loadVars
clearAllAvoids
#HELP FILE
setVar $BOT~help[1]  $BOT~tab&"   The Wall"
setVar $BOT~help[2]  $BOT~tab&"  "
setVar $BOT~help[3]  $BOT~tab&"   wall [Origin] [Distance] {holo} {limit:n}"
setVar $BOT~help[4]  $BOT~tab&"         "
setVar $BOT~help[5]  $BOT~tab&"   Plots courses to find all sectors Distance from Origin"
setVar $BOT~help[6]  $BOT~tab&"         "
setVar $BOT~help[7]  $BOT~tab&"   holo - Will holo all unexplored sectors."
setVar $BOT~help[8]  $BOT~tab&"   limit:n - will only mow N plots"
setVar $BOT~help[9]  $BOT~tab&"  designed for day 1 use with no ZTM."

gosub :bot~helpfile


gosub :PLAYER~quikstats
setVar $location $PLAYER~CURRENT_PROMPT

setVar $doholo 0
setVar $origin 0
setVar $distance 0

setVar $minFigs 100
setVar $restockTerra 0
setVar $endFigsOnly 0

# do the first block - to set WALLBLOCK
setVar $block 0
# use the block
setVar $useblock 0


setArray $blocks SECTORS

    if ($bot~parm1 = 0)
        setVar $bot~parm1 ""
    end

    isNumber $test $bot~parm1
	if ($test)
        if ($bot~parm1 <= SECTORS)
		    setvar $switchboard~message "Using Origin Sector: " & $bot~parm1 & "*"
		    gosub :switchboard~switchboard
            setVar $origin $bot~parm1
        else
            setvar $switchboard~message "Origin should be from 1 to  " & SECTORS & "*"
		    gosub :switchboard~switchboard
            halt
        end
	else
		setvar $switchboard~message "Origin should be from 1 to  " & SECTORS & "*"
		gosub :switchboard~switchboard
		halt
	end

    if ($bot~parm2 = 0)
        setVar $bot~parm2 ""
    end

    isNumber $test $bot~parm2
	if ($test)
        if ($bot~parm2 <= 12) and ($bot~parm2 >= 2)
		    setvar $switchboard~message "Putting up fig wall " & $bot~parm2 & " warps from origin.*"
		    gosub :switchboard~switchboard
            setVar $distance $bot~parm2
        else
            setvar $switchboard~message "Distance should be 2 to 12 warps from origin.*"
		    gosub :switchboard~switchboard
            halt
        end
	else
		setvar $switchboard~message "Distance should be 2 to 12 warps from origin.*"
		gosub :switchboard~switchboard
		halt
	end
    
    send "v"
    setTextLineTrigger getBackDockCrazy :getBackDockCrazy "The StarDock is located in sector"
    pause
    :getBackDockCrazy
        killalltriggers
        getWord CURRENTLINE $stardock 7
        STRIPTEXT $stardock "."

    if (($player~current_sector = $origin) or ($player~current_sector < 11) or ($player~current_sector = $stardock))
        setvar $switchboard~message "Can not start from origin or fed space.*"
		gosub :switchboard~switchboard
		halt

    end
   
   

    getWordPos $bot~user_command_line $pos "limit:"
    if ($pos > 0)
        setVar $cline $bot~user_command_line & " " 
        getText $cline $limitResults "limit:" " "
        setVar $SWITCHBOARD~message "Limiting to " & $limitResults & " results.*"
        gosub :switchboard~switchboard
    end

	if ($location <> "Command")
		setVar $SWITCHBOARD~message "Please start from the command prompt"
        gosub :switchboard~switchboard
        halt
	end


    getWordPos $bot~user_command_line $pos "holo"
	if ($pos > 0)
		setVar $doholo 1
	end
	

    # do the first block - to set WALLBLOCK
    setVar $block 0
    # use the block
    setVar $useblock 0

    getWordPos $bot~user_command_line $pos "useblock"
    if ($pos > 0)
        setVar $useblock 1
        send "'Using useblock routine in wall*"
    else
         getWordPos $bot~user_command_line $pos "block"
        if ($pos > 0)
            setVar $block 1
        send "'Using block routine in wall*"
        end
    end

    
    send "cv0*yyq"
    setArray $destSectors 10
    setArray $destSectorsOk 10
    setVar $i 1
    while ($i <= 10)
        setVar $destSectorsOk[$i] 1
        add $i 1
    end

    if ($useblock = 1)
        setVar $i 11
        while ($i <= SECTORS)
            getSectorParameter $i "WALLBLOCK" $res
            if ($res = 1)
    echo "Adding " $i "*"
                setVar $blocks[$i] 1
            end
            add $i 1
        end
    end
    setVar $targetSectors 0
    setVar $targetSectorsi 0
    setVar $badCourse 0
    setVar $badCourseReq 0
    setArray $sectorUsed SECTORS

    goSub :setDestSectors
echo "DEST DESCTORS*"
    setVar $i 1
    while ($i <= 10)
        echo "DestSEctor:" $i " " $destSectors[$i] "*"
        if ($destSectors[$i] = 0)
            setVar $destSectorsOk[$i] 0
        else
            add $badCourseReq 1
        end
        add $i 1
    end

    
    goSub :addExistingKnowledge
    if ($limitResults > 0)
        if ($targetSectorsi >= $limitResults)
            setVar $badCourse 99
        end
    end
echo "BAD COURSES REQUIRED:" $badCourseReq "*"
echo "BAD COURSES REQUIRED:" $badCourseReq "*"
echo "BAD COURSES REQUIRED:" $badCourseReq "*"

    while ($badCourse < $badCourseReq)
        goSub :sendPlots
        if ($limitResults > 0)
            if ($targetSectorsi >= $limitResults)
                setVar $badCourse 99
            end
        end
    end

    send "cv0*yyq"
    if ($block = 1)
        setVar $i 11
        while ($i <= SECTORS)
            setSectorParameter $i "WALLBLOCK" ""
            add $i 1
        end
        
        setVar $i 1
        while ($i <= $targetSectorsi)
            setSectorParameter $targetSectors[$i] "WALLBLOCK" "1"
            add $i 1
        end
        setvar $switchboard~message "Wall Completed Block Routine*"
		gosub :switchboard~switchboard
		halt
        halt
    end
    
    
    if ($useblock = 1)
        setVar $sectorListi 0
        setVar $sectorList 0
echo "BLOCKING WALLBLOCK SECTORS*"
echo "BLOCKING WALLBLOCK SECTORS*"

        send "c"
        waitfor "<Computer activated>"
        setVar $i 11
        while ($i <= SECTORS)

            if ($blocks[$i] = 1)
                send "v" $i "*"
            end
            add $i 1
        end
	    send "q"
        waitfor "<Computer deactivated>"
        send "c"
        setVar $i 1
        while ($i <= $targetSectorsi)
            send "f" $stardock "*" $targetSectors[$i] "**"
            add $i 1
        end
        send "^q"
        send "q"
        :checkDockAgain

        setTextLineTrigger checkdockcheckPath :checkdockcheckPath "The shortest path" 
        setTextLineTrigger checkdocknoCheckPath :checkdocknoCheckPath "Error - No route within"
        setTextLineTrigger checkdockcheckPathInt :checkdockcheckPathInt ": ENDINTERROG"
        pause
        :checkdockcheckPath
            killalltriggers
                goto :checkDockAgain
        :checkdocknoCheckPath
            killalltriggers
                getword CURRENTLINE $gsec 14
                add $sectorListi 1
                setVar $sectorList[$sectorListi] $gsec
echo "Confirmed SD OK PAth:" $gsec "*"
                goto :checkDockAgain
        :checkdockcheckPathInt
            killalltriggers
            

        echo "**Unsorted Sectors " $sectorListi " targets*"
    
    else

        
    echo "**Unsorted Sector List " $targetSectorsi " targets*"
        setVar $sectorListi $targetSectorsi
        setVar $sectorList 0
        setVar $i 1
        while ($i <= $targetSectorsi)
    echo $i " " $targetSectors[$i] "*"
            setVar $sectorList[$i] $targetSectors[$i]
            add $i 1
        end

    end


#SORTING BROKE
 #   goSub :sortSectors
  #  setVar $SWITCHBOARD~message "Courses plotted, " & $targetSectorsi & " targets, covering approximately " & $temp_TotalDist & " moves*"
  #  gosub :switchboard~switchboard
#setVar $i 1


 #   while ($i <= $sectorListi)
  #      echo $i " " $sectorCourse[$i] "*"
   #     add $i 1
   # end
#echo "now sectorListi " $sectorListi "*"
#halt
    setVar $doneVoids 0
    goSub :checkDoVoids

    setVar $i 1
    while ($i <= $sectorListi)
        setVar $target $sectorList[$i]
echo $target " xxx *"
        
        getSectorParameter $target "FIGSEC" $hasFig
        if ($hasFig = 0) and ($player~CURRENT_SECTOR <> $target)
            
            gosub :PLAYER~quikstats
            if ($player~FIGHTERS < $minFigs)
                setVar $SWITCHBOARD~message "Fighters are low, stopping...*"
                gosub :switchboard~switchboard
                halt
            end
            setVar $BOT~command "mow"
            if ($endFigsOnly = 0)
                setVar $BOT~user_command_line " mow "& $target & " 1 "
            else
                setVar $BOT~user_command_line " mow "& $target & " 0 "
            end
            setVar $BOT~parm1 $target
            
            if ($endFigsOnly = 0)
                setVar $BOT~parm2 1
            else
                setVar $BOT~parm2 0
            end
            if ($doholo)
                setVar $BOT~user_command_line  $BOT~user_command_line & " holo "
                setVar $BOT~parm3 "holo"
            else
                setVar $BOT~parm3 ""
            end

            saveVar $BOT~parm1
            saveVar $BOT~parm2
            saveVar $BOT~parm3
            saveVar $BOT~command
            saveVar $BOT~user_command_line
            load "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
            setEventTrigger		mowended		:mowended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\grid\mow.cts"
            pause
            :mowended
                if ($doholo)
                    setVar $holook 0
                    setVar $y 1
                    while ($y <= SECTOR.WARPCOUNT[$target])
                        if (SECTOR.EXPLORED[SECTOR.WARPS[$target][$y]] <> "YES")
                            setVar $holook 1
                        end
                        add $y 1
                    end
                    if ($holook = 1)
                        send "sh*"
                        waitfor "Long Range Scan"
                        waitfor "Command ["
                    end
                end
                send "f1*cd"
                setSectorParameter  $target "FIGSEC" TRUE
                goSub :checkDoVoids
        end
        add $i 1
    end
    send "cv0*yyq"

    setVar $SWITCHBOARD~message "Unvoiding sectors and finishing up.. Done!*"
    gosub :switchboard~switchboard
    halt
    halt

    :sendPlots
        setVar $desti 1
        send "c"
        waitfor "<Computer activated>"
        while ($desti <= 10)
            if ($destSectorsOk[$desti] = 1)
                if ($destSectors[$desti] > 0)
                    echo $destSectors[$desti] "*"
                    send "f" $origin "*" $destSectors[$desti] "**"
                end
                
            end
            add $desti 1
        end 
        send "^q"
        goSub :checkcourse
        send "q"
    return

    
    halt
    
    :checkcourse
        killalltriggers
        
        :checkCourseMorePaths
        setVar $course ""
        setTextLineTrigger checkPath :checkPath "The shortest path" 
        setTextLineTrigger noCheckPath :noCheckPath "Error - No route within"
        setTextLineTrigger checkPathInt :checkPathInt ": ENDINTERROG"
        pause
        :checkPathInt
            killalltriggers
            return
        :noCheckPath
            killalltriggers
            getword CURRENTLINE $destFail 14
echo "Fail Dest: " $destFail "*"
            
            setVar $d 1
            while ($d <=10)
                if ($destSectors[$d] = $destFail)
                    setVAr $destSectorsOk[$d] 0
                    setVar $d 99
                end
                add $d 1
            end
            add $badCourse 1
            goto :checkCourseMorePaths

        :checkPath
            killalltriggers
            getWord CURRENTLINE $courselen 4
            STRIPTEXT $courselen "("
            if ($courselen <= $distance)
echo "# DIDNT THINK PLOT COULT GET SMALLER?*"
echo "# DIDNT THINK PLOT COULT GET SMALLER?*"
echo "# DIDNT THINK PLOT COULT GET SMALLER?*"
echo "# DIDNT THINK PLOT COULT GET SMALLER?*"
#if this occurs, void it and move on
halt
            end
            :keepadding2
            setTextLineTrigger addCourse2 :addCourse2 ">"
            setTextTrigger endCourse2 :endCourse2 "Computer command [" 
            pause
            :addCourse2
                killalltriggers
                setVar $course $course & " " & CURRENTLINE
                goto :keepadding2
            :endCourse2
                killalltriggers
                #5749 > (2496) > (7072) > (322) > (799) > (6950) > (5933) > 7113 > 609 > 1 
                setVar $prevwarp ""
                setVar $y 1
                setVar $countC 0
                setVar $go 1
                 echo "$Course: " $course  "*"    
                while ($go = 1)
               
                    getWord $course $warp $y
                    if ($warp <> ">")
                        add $countC 1
                        if ($countC = ($distance + 1))
                            stripText $warp "("
                            stripText $warp ")"
                            if ($sectorUsed[$warp] = 0)
                                if ($useblock = 1)
                                    if ($blocks[$warp] = 1)
    echo "Found $warp" $warp " But skipped as target it's a blocked target!!"
                                    else
                                        add $targetSectorsi 1
                                        setVar $targetSectors[$targetSectorsi] $warp
                                        setVar $sectorUsed[$warp] 1
                                echo "Found $warp: " $warp " To list " & $targetSectorsi "*"
                                    end
                                else
                                    add $targetSectorsi 1
                                    setVar $targetSectors[$targetSectorsi] $warp
                                    setVar $sectorUsed[$warp] 1
                                echo "Found $warp: " $warp " To list " & $targetSectorsi "*"
                                end
    
                            end   
                            send "v" $warp "*"
    
                            
                        end
                        
                    end
                    add $y 1
                    if ($y > 50)
                        setVar $go 0
                    end
                end
                killalltriggers
                goto :checkCourseMorePaths
    return

    :addExistingKnowledge

        getAllCourses $allCourses $origin
        send "c"
        setVar $i 1
        while ($i <= SECTORS)
            if ($allCourses[$i] = $distance)
                echo $i " "  $useblock " " $blocks[$i] "*"
                send "v" $i "*"
                if ($useblock = 1)
                    if ($blocks[$i] = 1)
                        echo "Found $warp" $warp " But skipped as target it's a blocked target!!"
                    else
                        add $targetSectorsi 1
                        setVar $targetSectors[$targetSectorsi] $i
                        setVar $sectorUsed[$i] 1
                    end
                else
                    add $targetSectorsi 1
                    setVar $targetSectors[$targetSectorsi] $i
                    setVar $sectorUsed[$i] 1
                end
                if ($limitResults > 0)
                    if ($targetSectorsi >= $limitResults)
                        setVar $i 99999
                    end
                end
            end
            add $i 1
        end
        send "q"
        waitfor "<Computer deactivated>"
    return

    :setDestSectors
        setVar $successSectors 0
        setVar $successAttemp 11
        # are goingt o stop at 10 Success Plots where we add them or not.
        # if we are plotting out of a dead end or low warp area, we may not have 10
        # and we dont' want double ups.

        setVar $successPlots 0
        send "c"
        while ($successPlots < 10)

            setVar $i 1
            while ($i < 18)
                
                if ($successAttemp = $origin)
                    add $successAttemp 1
                end
                send "f" $origin "*" $successAttemp "**"
                add $successAttemp 1
                add $i 1
            end
            send "^Q"
            
            :setDestWaitForMore
            setVar $course ""
            setTextLineTrigger destPath :destPath "The shortest path" 
            setTextLineTrigger noPath :noPath "Error - No route within"
            setTextLineTrigger setDestPlotsDone :setDestPlotsDone ": ENDINTERROG"
            pause
            :noPath
                killalltriggers
                goto :setDestWaitForMore
            :destPath
                killalltriggers
                getWord CURRENTLINE $courselen 4
                STRIPTEXT $courselen "("
                if ($courselen <= $distance)
                    goto :setDestWaitForMore
                end
                :keepadding
                setTextLineTrigger addCourse :addCourse ">"
                setTextTrigger endCourse :endCourse "Computer command [" 
                pause
                :addCourse
                    killalltriggers
                    setVar $course $course & " " & CURRENTLINE
                    goto :keepadding
                :endCourse
                    killalltriggers
                    #5749 > (2496) > (7072) > (322) > (799) > (6950) > (5933) > 7113 > 609 > 1 
                    setVar $prevwarp ""
                    setVar $y 1
                    setVar $countC 0
                    setVar $go 1
                    while ($go = 1)
                        
                        getWord $course $warp $y
                        if ($warp <> ">")
                            add $countC 1
                            if ($countC = ($distance + 2))
                                stripText $warp "("
                                stripText $warp ")"
                                echo "Found $warp: " $warp " checking not in list and adding*"
                                
                                setVar $c 1
                                setVar $okToAdd 1
                                while ($c <= $successSectors)
                                    if ($destSectors[$c] = $warp)
                                        setVar $okToAdd 0
                                    end
                                    add $c 1
                                end
                                
                                if ($okToAdd = 1)
                                    echo "Added $warp: " $warp " To list*"
                                    add $successSectors 1
                                    setVar $destSectors[$successSectors] $warp
                                end
                                add $successPlots 1
                                if ($successPlots = 10)
                                    send "q"
                                    waitfor ": ENDINTERROG"
                                    return
                                end

                            end
                            
                        end
                        add $y 1
                        if ($y > 50)
                            setVar $go 0
                        end
                    end
                    goto :setDestWaitForMore
            :setDestPlotsDone
                killalltriggers
            
        end
        send "q"
    return



:checkDoVoids
    # just void the origin and adjacent sectors 

    if ($doneVoids = 1)
        Return
    end

    gosub :PLAYER~quikstats
    if ($player~CURRENT_SECTOR = $origin)
        return
    end

    setVar $i 1
    while ($i <= SECTOR.WARPCOUNT[$origin])
        if ($player~CURRENT_SECTOR = SECTOR.WARPS[$origin][$i])
            return
        end
        add $i 1
    end
    
    if ($origin <> $stardock)
         send "cv" $stardock "*"
        setVar $i 1
        while ($i <= SECTOR.WARPINCOUNT[$stardock])
            send "v" SECTOR.WARPSIN[$stardock][$i] "*"
            add $i 1
        end
        
        setVar $i 1
        while ($i <= SECTOR.WARPCOUNT[$stardock])
            send "v" SECTOR.WARPS[$stardock][$i] "*"
            add $i 1
        end
        send "q"
        waitfor "<Computer deactivated>"

    end
    send "cv" $origin "*"
    setVar $i 1
    while ($i <= SECTOR.WARPINCOUNT[$origin])
        send "v" SECTOR.WARPSIN[$origin][$i] "*"
        add $i 1
    end

    setVar $i 1
    while ($i <= SECTOR.WARPCOUNT[$origin])
        send "v" SECTOR.WARPS[$origin][$i] "*"
        add $i 1
    end
    send "q"
    waitfor "<Computer deactivated>"
    
    send "c"
    setVar $i 1
    while ($i <= 10)
        send "v" $i "*"
        add $i 1
    end

    send "q"
    waitfor "<Computer deactivated>"

    setVar $doneVoids 1
return

############ SORTING MOVE TO INCLUDE ONE DAY

# Takes $sectorList - Array of sectors
# Takes $sectorListi - Length of that array
# Returns $sectorCourse
#  Future: add a param option, which would find sectors with param, then call this function



:sortSectors

    setVar $searchsectors 0
    setVar $sectorsLeft 0
    setVar $totalSectors $sectorListi
    setVar $sectorCourse 0
    setVar $nextDistance 0
    setVar $nextIndex 2
    setVar $sectorCourse[1] $sectorList[1]
    setVar $nextDistance[1] $sectorList[1]

    setVar $temp_TotalDist 0

    setVar $i 1
    while ($i <= $sectorListi)
        setVar $searchsectors[$i] $sectorList[$i]
		setVar $sectorsLeft[$i] $sectorList[$i]  
        add $i 1
    end

    setVar $x 1
    setVar $sectorsLeft[1] "-1"
    setVar $fromSector $searchsectors[1]

    setVar $badDist 0
    setVar $badDistLog ""

    while ($x < $totalSectors)

        setVar $y 1
        setVar $closestSector 99999
        setVar $closestDistance 99
        setVar $badDist 0
        while ($y <= $totalSectors)
            setVar $toSector $sectorsLeft[$y]
            if ($toSector <> "-1")
#echo " from:"  $fromSector " to: " $toSector "*"
                getDistance $dist $fromSector $toSector
                if ($dist = "-1")
                    
                    setVar $dist 25
                    setVar $badDist 1
                    
                end
                if ($dist <> "-1")
                    if ($dist < $closestDistance)
                        setVar $closestSector $toSector
                        setVar $closestDistance $dist
                    end
                end
            end
            add $y 1
        end
        if ($badDist = 1)
            setVar $badDistLog $badDistLog & " " & $fromSector 
 
        end

        setVar $sectorCourse[$nextIndex] $closestSector
        setVar $nextDistance[$nextIndex] $closestDistance
        add $temp_TotalDist $closestDistance

        setVar $y 1
        while ($y < $totalSectors)
            if ($sectorsLeft[$y] = $closestSector)
                setVar $sectorsLeft[$y] "-1"
            end
            add $y 1
        end
        
        if ($closestSector < 30001)
            setVar $fromSector $closestSector
        end

        Gosub :sleep
        add $nextIndex 1
        add $x 1
    end
    if ($badDisLog <> "")
        setVar $SWITCHBOARD~message $badDistLog & "*"
        gosub :switchboard~switchboard
    end
return

:sleep
	# This subroutine prevents twx from locking up, and allows you to
	# use the $SX twx command to halt if necessary.
	setdelaytrigger wake :wake 10
	pause
	:wake
	killalltriggers
	return

##########
	#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"


