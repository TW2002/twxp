  # Modified LoneStars Passive Gridder to suite MOMBOT
  # All credits to the legend himself for this one!
  #
  #	Hammer - MOdifying to use EPHaggle and Sector Params
  #            - Add filters for density
  #            - Smarter filter on twarp/next sector
  #		- paranoid/safe options - NextReport options
  #   to do - remove aliens, enter sectors with level 4 planets (dangerous!)
  #		- Store "explored" sectors for a while - option to clear it. so it can resume
    

    #=--------                                                                       -------=#
     #=---------------------      LoneStar's Passive Gridder      -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	Circa August 2007
	#		Author		:	LoneStar
	#		TWX			:	For TWX 2.04 Final
	#
	#		Credits		:	Mind Daggers QUIKSTATS, and GETCOURSE routines
	#
	#		To Run		:	You will Need the following addressed
	#                                   - Command Prompt
	#                                   - Density Scanner (at least)
	#									- More Than 10 Fighters
	#									- More than 10,000 creds (for buying fuel)
	#                                   - have _ck_callsaveme.cts in scripts
	#									- ZTM not required, but CIM will need to be updated
	#								      periodically.
	#
	#		Fixes       :	Initial Release (work in progress)
	#
	#		Description	:   Passive Gridder that doesnt' holo-scan, and uses twarp when boxed in.
	#                       Will update fig/limps lists if desired to SectorParam's, but also updates
	#                       the FIGSEC as it moves
	#						It's a good idea to update your deployed limp data, as the the Gridder will report
	#						if, for example, an adjacent possibly has someone cloaked.
	#
	#		Notes:          Modified quikstats to change CURRENTTURNS to 68536, if $UNLIM ='s TRUE
	#                       Had to use two Arrays: $DENS and $ANOM for: Adj Warp Count, and
	#                       Anomoly readings in adj sectors as TWX is more than a little retarded
	#                       (SECTOR.ANOMOLY[idx] doesn't work, and SECTOR.WARPCOUNT isn't accurate)
	#
		
	reqRecording
	clearAllAvoids
	gosub :BOT~loadVars

	loadVar $MAP~rylos
	loadVar $MAP~alpha_centauri
	loadVar $BOT~LIMP_FILE 		
	loadVar $BOT~ARMID_FILE 

	setVar $BOT~help[1]  $BOT~tab&"       LS Passive Gridder - Still the best "
	setVar $BOT~help[2]  $BOT~tab&"       "
	setVar $BOT~help[3]  $BOT~tab&" lspassgrid [stopturns] {a1/a2/a3} {l1/l2/l3} {ports}"
	setVar $BOT~help[4]  $BOT~tab&"            {holo} {trade} {restock} {filter} {ignore:}"
	setVar $BOT~help[5]  $BOT~tab&" Options:"
	setVar $BOT~help[6]  $BOT~tab&"    [stopturns]     Passive Grid Stops at here"
	setVar $BOT~help[7]  $BOT~tab&"	   {a1/a2/a3}      Drop 1/2/3 Armid Mines"
	setVar $BOT~help[8]  $BOT~tab&"	   {l1/l2/l3}      Drop 1/2/3 Limpet Mines"
	setVar $BOT~help[9]  $BOT~tab&"    {ports}         Grabs port reports"
	setVar $BOT~help[10]  $BOT~tab&"    {holo}         Holo Scans to ensure sectors safe"
	setVar $BOT~help[11]  $BOT~tab&"    {trade}        Will trade ports looking for Equ MCIC"
	setVar $BOT~help[12]  $BOT~tab&"                   Requires EP Haggle or equiv"
	setVar $BOT~help[13]  $BOT~tab&"    {safe}         Twarps to Limpet sectors only"
	setVar $BOT~help[14]  $BOT~tab&"    {paranoid}     Twarp to Limpet and Mines only"
	setVar $BOT~help[15]  $BOT~tab&"    {nextreport}   Next sector requires an adj port report."
	setVar $BOT~help[16]  $BOT~tab&"    {restock}      Buys more Limpets and Mines."
	setVar $BOT~help[17]  $BOT~tab&"    {filter}       Filters mines/armids/planets to detect"
	setVar $BOT~help[18]  $BOT~tab&"                   safe sectors. run >limps >armids 1st"
	setVar $BOT~help[19]  $BOT~tab&"    {ignorea}      Uses holo scan to passive grid alien figs"
	setVar $BOT~help[20]  $BOT~tab&"    {resume}       Roughly resumes last run"
	setVar $BOT~help[21]  $BOT~tab&"    {ignore:}      Ignore corp or trader fighters"
	setVar $BOT~help[22]  $BOT~tab&"    {skip:}        Skips sectors with this param !=0 !=''"
	setVar $BOT~help[23]  $BOT~tab&"    {lock:PARAM=n} Lock grid to this param - WHICHBUB=2"
	setVar $BOT~help[24]  $BOT~tab&"    {twenty}       Drop 20 fighters in density 0 sectors"
	setVar $BOT~help[25]  $BOT~tab&"    Doesn't require ZTM but works better"
	setVar $BOT~help[26]  $BOT~tab&"    Works best with T-Warp to reroute"

	gosub :bot~helpfile

	setVar $BOT~script_title "LoneStar's Passive Gridder"
	gosub :BOT~banner
	
	setVar $TAGLINE     "LoneStar's Passive Gridder"
	setVar $TAGLINEB     $BOT~bot_name
	setVar $TAGLINEC     $BOT~bot_name

	setVar $Turn_Limit 20
	setArray $CHKD	SECTORS
	setArray $ANOM	10
	setArray $DENS	10
	setArray $Limps	SECTORS
	setVar $Update_Limps		FALSE
	setVar $Update_Figs		FALSE
	setVar $Update_Port		FALSE

	setVar $DROPING_MINES	0
	SetVar $DROP_LIMP 0
	SetVar $DROP_ARMID 0


	setArray $LOG_ENTRIES 5
	setVar $LOG_ENTRIES[1] ""
	setVar $LOG_ENTRIES[2] ""
	setVar $LOG_ENTRIES[3] ""
	setVar $LOG_ENTRIES[4] ""
	setVar $LOG_ENTRIES[5] ""

	setVar $DEP_FIGS	0
	setVar $DEP_LIMP	0
	setVar $DEP_NEW	0
	setVar $LOG_EVENT	0
	setVar $HOLO		FALSE
	setVar $TRACKER	FALSE
	setVar $EQU_MIN 50
	setVar $EQU_MIN_BUY 25
	setVar $DROP_TWENTY	0
	setVar $FILTER_DENSITY 0

	setVar $planet~planetsInSectors SECTORS
	
	

	if ($MAP~rylos < 1)
		setVar $Report_RYLOS 	TRUE
	end
	if ($MAP~alpha_centauri < 1)
		setVar $Report_ALPHA	TRUE
	end
	setvar $player~save true

	gosub :player~quikstats
	if ($player~total_holds <= $EQU_MIN)
		
	end

	setVar $startingLocation $PLAYER~CURRENT_PROMPT
	if ($startingLocation <> "Command")
		setVar $SWITCHBOARD~message "Must be started from Command prompt.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	if ($PLAYER~SCAN_TYPE = "None")
		setVar $SWITCHBOARD~message "Must At Least Have a Density Scanner.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if ($PLAYER~FIGHTERS < 10)
		
		setVar $SWITCHBOARD~message "Must At More than 10 Fighters.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if (CURRENTCREDITS < 10000)
		
		setVar $SWITCHBOARD~message "Must At Least Have 10,000 creds.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end


	setVar $Update_Figs FALSE
	setVar $Update_Limps FALSE
	
	
	
	setVar $Turn_Limit $bot~parm1
	isNumber $number $Turn_Limit

	if (($number <> 1) or ($Turn_Limit = 0))
		setvar $switchboard~message "Please select what turns to halt at.*"
		gosub :switchboard~switchboard
		halt
	
	end

	getWordPos $bot~user_command_line $pos "ignore:"
	if ($pos > 0)
		getText $bot~user_command_line $ignore "ignore:" " "

		if ($ignore = "")
			setVar $bot~user_command_line $bot~user_command_line & " "
			getText $bot~user_command_line $ignore "ignore:" " "
		end
		replaceText $bot~user_command_line " ignore:" & $ignore & " " " "
		replaceText $bot~user_command_line " ignore:" & $ignore " "
	end

	getWordPos $bot~user_command_line $pos "skip:"
	if ($pos > 0)
		getText $bot~user_command_line $skipparam "skip:" " "

		if ($skipparam = "")
			setVar $bot~user_command_line $bot~user_command_line & " "
			getText $bot~user_command_line $skipparam "skip:" " "
		end
		replaceText $bot~user_command_line " skip:" & $skipparam & " " " "
		replaceText $bot~user_command_line " skip:" & $skipparam " "
		upperCase $skipparam
	end

	getWordPos $bot~user_command_line $pos "lock:"
	if ($pos > 0)
		getText $bot~user_command_line $lockparamtemp "lock:" " "

		if ($lockparamtemp = "")
			setVar $bot~user_command_line $bot~user_command_line & " "
			getText $bot~user_command_line $lockparamtemp "lock:" " "
			
		end
		replaceText $bot~user_command_line " lock:" & $lockparamtemp & " " " "
		replaceText $bot~user_command_line " lock:" & $lockparamtemp " "

		setVar $temp $lockparamtemp
		
		replaceText $temp "=" " "
		getWord $temp $lockparam 1
		getWord $temp $lockvalue 2
		if ($lockparam = "") or ($lockvalue = "")
			setVar $SWITCHBOARD~message "Issue with Lock syntax try LOCK:WHICHBUB=2*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		upperCase $lockparam
	end

	

	getWordPos $bot~user_command_line $pos "a1"
	if ($pos > 0)
		setVar $DROP_ARMID 1
	end
	getWordPos $bot~user_command_line $pos "a2"
	if ($pos > 0)
		setVar $DROP_ARMID 2
	end
	getWordPos $bot~user_command_line $pos "a3"
	if ($pos > 0)
		setVar $DROP_ARMID 3
	end

	getWordPos $bot~user_command_line $pos "l1"
	if ($pos > 0)
		setVar $DROP_LIMP 1
	end
	getWordPos $bot~user_command_line $pos "l2"
	if ($pos > 0)
		setVar $DROP_LIMP 2
	end
	getWordPos $bot~user_command_line $pos "l3"
	if ($pos > 0)
		setVar $DROP_LIMP 3
	end	



	setVar $LSDString ""
	if (($DROP_ARMID > 0) and ($DROP_LIMP > 0))
		setVar $DROPING_MINES 3
		setVar $LSDString "0@0@0@0@0@N@M@M@0@N@0@0@N@0@0@0@0@0@0@0"
	elseif ($DROP_ARMID > 0)

		setVar $DROPING_MINES 2
		setVar $LSDString "0@0@0@0@0@N@N@M@0@N@0@0@N@0@0@0@0@0@0@0"
	elseif ($DROP_LIMP > 0)

		setVar $DROPING_MINES 1
		setVar $LSDString "0@0@0@0@0@N@M@N@0@N@0@0@N@0@0@0@0@0@0@0"
	else
		setVar $DROPING_MINES 0
	end
	
	setVar $allLimps 0
	setVar $allArmids 0

	getWordPos $bot~user_command_line $pos "filter"
	if ($pos > 0)
		setVar $FILTER_DENSITY 1
		readToArray $BOT~LIMP_FILE $allLimps
		readToArray $BOT~ARMID_FILE $allArmids
	end


	setVar $Update_Port FALSE
	getWordPos $bot~user_command_line $pos "ports"
	if ($pos > 0)
		setVar $Update_Port TRUE
	end

	setVar $HOLO FALSE
	getWordPos $bot~user_command_line $pos "holo"
	if ($pos > 0)
		setVar $HOLO TRUE
	end

	setVar $DROP_TWENTY 0
	getWordPos $bot~user_command_line $pos "twenty"
	if ($pos > 0)
		setVar $DROP_TWENTY 1
	end

	setVar $twarp_safety 0
	getWordPos $bot~user_command_line $pos "safe"
	if ($pos > 0)
		setVar $twarp_safety 1
	end

	getWordPos $bot~user_command_line $pos "paranoid"
	if ($pos > 0)
		setVar $twarp_safety 2
	end

	setVar $TRACKER FALSE
	getWordPos $bot~user_command_line $pos "trade"
	if ($pos > 0)
		setVar $TRACKER TRUE
	end

	setVar $NextRequiresReport 0
	getWordPos $bot~user_command_line $pos "nextreport"
	if ($pos > 0)
		setVar $NextRequiresReport 1
	end

	setVar $restock 0
	getWordPos $bot~user_command_line $pos "restock"
	if ($pos > 0)
		setVar $restock 1
	end


	getWordPos $bot~user_command_line $pos "resume"
	if ($pos > 0)
		setvar $r 11
		while ($r <= SECTORS)
			getSectorParameter $r "LSCHK" $lschk
			if ($lschk = TRUE)
				setVar $CHKD[$r] 1
			else
				setVar $CHKD[$r] 0
			end
			add $r 1
		end
		
	else
		setvar $r 11
		while ($r <= SECTORS)
			setSectorParameter $r "LSCHK" FALSE
			add $r 1
		end
		
	end

	setVar $ignorea 0
	getWordPos $bot~user_command_line $pos "ignorea"
	if ($pos > 0)
		setVar $ignorea 1
	end

	if ($FILTER_DENSITY = 1)
		goSub :getPersonalPlanets
	end

	

	goto :Lets_Get_It_On

:Lets_Get_It_On
    getTime $Stamp "t d/m/yy"

	stop $FILENAME
	stop $FILENAME

	if ($TRACKER)
		setVar $MCICd	0
		setArray $MCIC	SECTORS

		setVar $m 11
		while ($m <= SECTORS)
			getSectorParameter $m "EQUIPMENT-" $mtest
			isNumber $tst $mtest
			if ($tst)

				setVar $MCIC[$m] TRUE
				add $Results 1
				add $MCICd 1
			end
			add $m 1
		end


	else
		if ($player~equipment_holds > 0)
		    send "   j   y   "
		end
	end

	write $LOG_FName "-------------------------{ " & $Stamp & " }-------------------------"
	echo "***"
	if ($Update_Figs)
		#echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"ReFreshing Deployed Fighter Data"&ANSI_8&">*")
		gosub :Build_FIG_LIST
	end

	#echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Reading Figs"&ANSI_8&">*")
	setVar $idx 1
	while ($idx <= SECTORS)
		getSectorParameter $idx "FIGSEC" $flag
		isNumber $tst $flag
		if ($tst <> 0)
			if ($flag <> 0)
				Add $DEP_FIGS 1
			end
		else
			setSectorParameter $idx "FIGSEC" FALSE
		end
		add $idx 1
	end

	if ($DEP_FIGS = 0)
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"No Deployed Fighter Data Found"&ANSI_8&">*")
		halt
	else
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Deployed Fighters "&ANSI_14&" : "&ANSI_15&$DEP_FIGS&ANSI_8&">*")
	end

	if ($Update_Limps)
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"ReFreshing Limpet Data"&ANSI_8&">*")
		gosub :Build_LIMP_LIST
	else
		echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Reading Limps"&ANSI_8&">*")
		setVar $idx 1
		while ($idx <= SECTORS)
			getSectorParameter $idx "LIMPSEC" $flag
			isNumber $tst $Flag
			if ($tst <> 0)
				if ($flag > 0)
					setVar $Limps[$idx] 1
					add $DEP_LIMP 1
				end
			end
			add $idx 1
		end
	end

   	window status 500 245 (" " & $TAGLINE & " v" & $Version)
   	#echo "**"
	#echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Gridded Sectors: "&ANSI_14&$DEP_FIGS&ANSI_8&">*")
	#echo ($TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Limp'd Sector  : "&ANSI_14&$DEP_LIMP&ANSI_8&">**")

    send " C ;UYQ "
	waitfor "Max Figs Per Attack:"
	getWord CurrentLine $maxFigAttack 5
	stripText $maxFigAttack ","
	isNumber $tst $maxFigAttack
	if ($tst = 0)
		setVar $maxFigAttack 9999
	end

	while (CURRENTTURNS > $Turn_Limit)
		:To_The_Top
		gosub :player~quikstats
		setVar $anon_ptr 1
		setTextLineTrigger	TurnsGone	:TurnsGone	"Do you want instructions (Y/N) [N]?"

		send "SZND*"
		waiton "Relative Density Scan"
		killAllTriggers
	  	setTextLineTrigger	1	:getWarp "Sector "
	  	setTextTrigger		2	:gotWarpInfo "Command [TL="
		pause
		:getWarp
		  	getWord CURRENTLINE $anm 13
		  	getText CURRENTLINE $temp "Warps :" "NavHaz :"
			stripText $temp " "
			stripText $temp ","

			setVar $DENS[$anon_ptr] $temp
			setVar $ANOM[$anon_ptr] $anm
			add $anon_ptr 1
			setTextLineTrigger	1	:getWarp "Sector "
			pause
		:gotWarpInfo
			killAllTriggers

			if ($TRACKER)
				gosub :Haggel_Checker
			elseif (($player~ore_holds < $player~total_holds) AND ($player~TWARP_TYPE <> "No"))

				if ((PORT.CLASS[$player~CURRENT_SECTOR] = 3) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 4) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 5) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 7))
					#Echo "***Stupid Attmpt**"
					send "P T ** 0* 0* "
					
				end
			end
			if ($restock = 1)
				if (CURRENTCREDITS < 100000)
					send ("'["&$TagLineB&"] Restocking halted as credits low*")
					setVar $restock 0
				end

				if (($player~ore_holds = $player~total_holds) AND ($player~TWARP_TYPE <> "No"))
				
					setVar $doRestock 0
					if (($DROP_ARMID > 0) and ($DROP_LIMP > 0))
						if (($player~ARMIDS < 4) or ($player~LIMPETS < 4))
							setVar $doRestock 1
						end
					elseif ($DROP_ARMID > 0)
						if ($player~ARMIDS < 4)
							setVar $doRestock 1
						end
					elseif ($DROP_LIMP > 0)
						if ($player~LIMPETS < 4)
							setVar $doRestock 1
						end

					end
					if ($doRestock = 1)
						setVar $BOT~command "lsd"
						setVar $BOT~user_command_line $LSDString
						setVar $BOT~parm1 $LSDString
						
						saveVar $BOT~parm1
						
						saveVar $BOT~command
						saveVar $BOT~user_command_line
						load "scripts\"&$bot~mombot_directory&"\modes\resource\lsd.cts"
						setEventTrigger        moveended        :moveended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\modes\resource\lsd.cts"
						pause
						:moveended
							killalltriggers
						gosub :player~quikstats
						gosub :resetMinesAfterRestock
					end
				end
			end
		
		setArray $Adj_Targets SECTOR.WARPCOUNT[$player~CURRENT_SECTOR]
		setArray $Filtered_Density SECTOR.WARPCOUNT[$player~CURRENT_SECTOR]

		setVar $holoRequired 0
		setVar $firstFilter 1


		:refilter
		setVar $i 1
		while ($i <= SECTOR.WARPCOUNT[$player~CURRENT_SECTOR])
			setVar $adj SECTOR.WARPS[$player~CURRENT_SECTOR][$i]
			setVar $currentDensity SECTOR.DENSITY[$adj]
			if ($FILTER_DENSITY = 1)
				if ($planet~planetsInSectors[$adj] > 0)
					subtract $currentDensity (500 * $planet~planetsInSectors[$adj])
				end
				if ($allLimps[$adj] > 0)
					subtract $currentDensity (2 * $allLimps[$adj])
					setVar $ANOM[$i] "No"
				end
				if ($allArmids[$adj] > 0)
					subtract $currentDensity (10 * $allArmids[$adj])
				end
					
			end
			if (($ignorea = 1) OR (($ignore <> "") and ($ignore <> "0")))
				if ($firstFilter = 1)
					getSectorParameter $adj "FIGSEC" $Flag
					isNumber $tst $Flag
					if ($tst = 0)
						setVar $Flag 0
						setSectorParameter $adj "FIGSEC" FALSE
					end
					if (($flag = 0) and (($currentDensity <> 0) and $currentDensity <> 100))
						# not our fig there, and density not passive
						setVar $holoRequired 1
					end
				else
					setVar $figsowner SECTOR.FIGS.OWNER[$adj]
					lowercase $figsowner
					getWordPos $figsowner $whereowner "belong to"
					getWordPos $figsowner $whereownercorp "belong to corp#"&$ignore
					getWordPos $figsowner $whereownerplayer "belong to "&$ignore
					if ($whereowner = 0)
						if (SECTOR.FIGS.QUANTITY[$adj] < $player~FIGHTERS)
							subtract $currentDensity (SECTOR.FIGS.QUANTITY[$adj] * 5)
						end
					elseif (($whereownercorp > 0) OR ($whereownerplayer > 0))
						if (SECTOR.FIGS.QUANTITY[$adj] < $player~FIGHTERS)
							subtract $currentDensity (SECTOR.FIGS.QUANTITY[$adj] * 5)
						end					
					end
					

				end
				
			end

			setVar $Filtered_Density[$i] $currentDensity
			add $i 1
		end 

		if ($holoRequired = 1)
			setVar $firstfilter 0
			setVar $holoRequired 0
			send "zn"
			waitfor "o you want instructions (Y/N) [N]?"
			gosub :Do_Holo
	

			goto :refilter
			
		end

		setVar $i 1
		while ($i <= SECTOR.WARPCOUNT[$player~CURRENT_SECTOR])
        		setVar $adj SECTOR.WARPS[$player~CURRENT_SECTOR][$i]
			setVar $Adj_Targets[$i] 10
			setVar $currentDensity $Filtered_Density[$i]
			
			if (SECTOR.NAVHAZ[$adj] <> 0)
				setVar $filter 0
				setVar $Filter (SECTOR.NAVHAZ[$adj] * 21)
				setVar $Filter ($currentDensity - $Filter)
			else
				setVar $filter $currentDensity
			end

			if ($adj < 10)
				setVar $buff "    "
			elseif ($adj < 100)
				setVar $buff "   "
			elseif ($adj < 1000)
				setVar $buff "  "
			elseif ($adj < 10000)
				setVar $buff " "
			else
				setVar $buff ""
			end

			getSectorParameter $adj "FIGSEC" $Flag
			isNumber $tst $Flag

			if ($tst = 0)
				setVar $Flag 0
				setSectorParameter $adj "FIGSEC" FALSE
			end

			if ($skipparam <> "")
				getSectorParameter $adj $skipparam $skipChk
				if ($skipChk = "")
					setVar $skipChk 0
				end
				
				if ($skipChk <> 0)
					goto :Next_ADJ_Please

				end
				
			end

			if ($lockparam <> "")
				getSectorParameter $adj $lockparam $lockChk
				if ($lockChk = "")
					setVar $lockChk 0
				end
				
				if ($lockChk <> $lockvalue)
					goto :Next_ADJ_Please

				end
				
			end

			# Log anything interesting

			if (($currentDensity > 200) AND ($Flag = 0))
				setVar $StrMsg ("Sect: " & $buff & $adj & " Den: " & $currentDensity & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			elseif (SECTOR.NAVHAZ[$adj] <> 0)
				setVar $StrMsg ("NavHaz in Sect: " & $buff & $adj & " Den: " & $currentDensity & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end
			if ((($currentDensity = 0) OR ($currentDensity = 5)) AND ($ANOM[$i] = "Yes"))
				setVar $StrMsg ("Cloaked Ship, Sect: " & $buff & $adj & " Den: " & $currentDensity & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end

			if (($currentDensity = 40) OR ($currentDensity = 45) OR ($currentDensity = 140) OR ($currentDensity = 145))
				setVar $StrMsg ("Possible Trader, Sect: " & $buff & $adj & " Den: " & $currentDensity & " Haz: " & SECTOR.NAVHAZ[$adj] & "% Filtered: " & $Filter)
				write $LOG_FName $StrMsg
				add $LOG_EVENT 1
				setVar $LOG_TEXT $StrMsg
				gosub :Move_Down
				send ("'["&$TagLineB&"] " & $StrMsg & "*")
				waitfor "Message sent on sub-space channel"
			end

			# END LOG

			# Skip Limps
			if (($ANOM[$i] = "Yes") AND ($Limps[$adj] = 0))
            			goto :Next_ADJ_Please
			end

			#prioritise sectors nextdoor
			if ($flag = 0)
				if (($currentDensity = 0) OR ($currentDensity = 100))
	            			if (SECTOR.NAVHAZ[$adj] = 0)
						if (SECTOR.EXPLORED[$adj] <> "YES")
							if ($DENS[$i] > 1)
								setVar $Adj_Targets[$i] 1
								goto :Next_ADJ_Please
							end
						end
					end
				end

				if (($currentDensity = 0) OR ($currentDensity = 100))
	            			if (SECTOR.NAVHAZ[$adj] = 0)
						if (SECTOR.EXPLORED[$adj] = "YES")
							if ($DENS[$i] > 1)
								setVar $Adj_Targets[$i] 2
								goto :Next_ADJ_Please
							end
						end
					end
				end
				if (($currentDensity = 0) OR ($currentDensity = 100))
	            			if (SECTOR.NAVHAZ[$adj] = 0)
						if (SECTOR.EXPLORED[$adj] <> "YES")
							if ($DENS[$i] >= 1)
								setVar $Adj_Targets[$i] 3
								goto :Next_ADJ_Please
							end
						end
					end
				end
				if (($currentDensity = 0) OR ($currentDensity = 100))
	            			if (SECTOR.NAVHAZ[$adj] = 0)
						if (SECTOR.EXPLORED[$adj] = "YES")
							if ($DENS[$i] >= 1)
								setVar $Adj_Targets[$i] 4
								goto :Next_ADJ_Please
							end
						end
					end
				end
			end

			if (($currentDensity = 105) OR ($currentDensity = 5))
            			if (SECTOR.NAVHAZ[$adj] = 0)
					if (SECTOR.EXPLORED[$adj] <> "YES")
						if ($Flag <> 0)
							if ($DENS[$i] > 1)
								setVar $Adj_Targets[$i] 5
								goto :Next_ADJ_Please
							end
						end
					end
				end
			end
			
			# The next two seem illogical because there explored and figged. 
			# However, I assume if you have no t-warp, it makes sense.
			# Hammer: Adding twarp filter
			
			if ($player~TWARP_TYPE = "No")
				# If density is 105 or 5, and 5+ warps, no hz, has fig, not checked - go there? but why
				if (($currentDensity = 105) OR ($currentDensity = 5))
					#if (SECTOR.EXPLORED[$adj] <> "YES")
					if (SECTOR.WARPCOUNT[$adj] >= 5)
						if (SECTOR.NAVHAZ[$adj] = 0)
							if ($Flag = 1)
								if ($DENS[$i] >= 1)
									if ($CHKD[$ADJ] = 0)
										setVar $Adj_Targets[$i] 6
										goto :Next_ADJ_Please
									end
								end
							end
						end
					end
				end
				if (($currentDensity = 105) OR ($currentDensity = 5))
					#if (SECTOR.EXPLORED[$adj] <> "YES")
					if (SECTOR.WARPCOUNT[$adj] > 1)
						if (SECTOR.NAVHAZ[$adj] = 0)
							if ($Flag = 1)
								if ($DENS[$i] >= 1)
									if ($CHKD[$ADJ] = 0)
										setVar $Adj_Targets[$i] 6
										goto :Next_ADJ_Please
									end
								end
							end
						end
					end
				end
			end
			:Next_ADJ_Please
        		add $i 1
		end

		setVar $idx 1
		setVar $Target 10
		setVar $Target_IDX 0

		while ($idx <= SECTOR.WARPCOUNT[$player~CURRENT_SECTOR])
			if (($Adj_Targets[$idx] < $Target) AND ($Target <> 0))
				setVar $Target $Adj_Targets[$idx]
				setVar $Target_IDX $idx
			end
			add $idx 1
		end

		if ($Target_IDX <> 0)
			setVar $Target SECTOR.WARPS[$player~CURRENT_SECTOR][$Target_IDX]
			if (SECTOR.DENSITY[$Target] >= 100)
				send " c r"&$Target&"*q"
				setTextLineTrigger	NoData1	:NoData		"You have never visted sector"
				setTextLineTrigger	NoData2	:NoData		"I have no information about a port in that sector"
				setTextLineTrigger	YaData1	:YaData		"Items     Status  Trading % of max OnBoard"
				setTextLineTrigger	YaData2	:YaData		"A  Cargo holds     :"
				pause
				:NoData
				killAllTriggers
				if ($HOLO)
					gosub :Do_Holo
					gosub :Display_Holo
					waiton	"Command [TL="
					if (SECTOR.FIGS.QUANTITY[$Target] <> 0)
						if ((SECTOR.FIGS.OWNER[$Target] <> "belong to your Corp") AND (SECTOR.FIGS.OWNER[$Target] <> "yours"))
							#Trying Again, but this time ignoring $Target
							setVar $Ignore $Target
							setVar $idx 1
							setVar $Target 10
							setVar $Target_IDX 0
							while ($idx <= SECTOR.WARPCOUNT[$player~CURRENT_SECTOR])
								if ($Adj_Targets[$idx] < $Target) AND ($Target <> 0) AND (SECTOR.WARPS[$player~CURRENT_SECTOR][$idx] <> $Ignore)
									setVar $Target $Adj_Targets[$idx]
									setVar $Target_IDX $idx
								end
								add $idx 1
							end
							if ($Target_IDX <> 0)
								setVar $Target SECTOR.WARPS[$player~CURRENT_SECTOR][$Target_IDX]
							else
								goto :No_Target
							end
						end
					end
				end
				:YaData
				killAllTriggers
			end
        	goto :Next_Target
        end

        :No_Target
	
		if ($player~TWARP_TYPE <> "No")
			#Find A Place To Twarp To
			getNearestWarps $WarpArray $player~CURRENT_SECTOR
			getRnd $w 5 10
			while ($w <= $WarpArray)
				setVar $focus $WarpArray[$w]
				if ($Focus <> $player~CURRENT_SECTOR)
					getSectorParameter $Focus "FIGSEC" $Flag
					isNumber $tst $Flag
					if ($tst = 0)
						setVar $Flag 0
						setSectorParameter $Focus "FIGSEC" FALSE
					end
					if ($flag <> false)
						if ($twarp_safety = 1)
							getSectorParameter $Focus "LIMPSEC" $Flag
							isNumber $tst $Flag
							if ($tst = 0)
								setVar $Flag 0
								setSectorParameter $Focus "LIMPSEC" FALSE
							end
						elseif ($twarp_safety = 2)
							

							getSectorParameter $Focus "LIMPSEC" $Flag1
							isNumber $tst1 $Flag1
							if ($tst1 = 0)
								setVar $Flag1 0
								setSectorParameter $Focus "LIMPSEC" FALSE
							end

							getSectorParameter $Focus "MINESEC" $Flag2
							isNumber $tst2 $Flag2
							if ($tst2 = 0)
								setVar $Flag2 0
								setSectorParameter $Focus "MINESEC" FALSE
							end
		
							if (($Flag1 = 0) or ($Flag2 = 0))
								setVar $Flag 0
							else
								setVar $Flag 1
							end

						end
					end
					if ($Flag <> 0)
						if (SECTOR.WARPCOUNT[$Focus] > 1)
							setVar $w_i 1
							while ($w_i <= SECTOR.WARPCOUNT[$Focus])
								setVar $w_adj SECTOR.WARPS[$Focus][$W_i]
								getSectorParameter $w_adj "FIGSEC" $Flag
								isNumber $tst $Flag
								# check for a fig, if no fig it is a candidate
								if ($tst = 0)
									setVar $Flag 0
									setSectorParameter $w_adj "FIGSEC" FALSE
								end

								setVar $skipWarp 0
								if ($skipparam <> "")
									getSectorParameter $w_adj $skipparam $skipChk
									if ($skipChk = "")
										setVar $skipChk 0
									end
									if ($skipChk <> 0)
										setVar $skipWarp 1
									end
								end

								if ($lockparam <> "")
									getSectorParameter $adj $lockparam $lockChk
									if ($lockChk = "")
										setVar $lockChk 0
									end
									if ($lockChk <> $lockvalue)
										setVar $skipWarp 1
									end
								end

								if (($Flag = 0) AND ($CHKD[$w_adj] <> 1) AND ($skipWarp = 0))
									setVar $CHKD[$w_adj] 1
									if ($NextRequiresReport = 1)
								
										setVar $portOk 0
										if (PORT.EXISTS[$w_adj] = 1)
											send "cr" $w_adj "*q"
											waitfor "Computer activate"
											setTextLineTrigger portexists :portexists "Commerce report for"
											setTextLineTrigger portexistsno :portexistsno "I have no information about a port in that sector"
											setTextLineTrigger portexistsno2 :portexistsno2 "u have never visted sector"
											pause
											:portexists
												setVar $portOk 1
								
											:portexistsno
											:portexistsno2
												killtrigger portexistsno
												killtrigger portexistsno2
												killtrigger portexists
											

										end
										# no port report; it's mark it as checked and try aain
										if ($portOk = 1)
											goto :We_Got_Game
										end
									else
										
										goto :We_Got_Game
									end

									
								end
		                    	add $w_i 1
							end
						end
					end
				end
	        	add $w 1
			end

			:We_Done
			#get here, there's no hope
			echo "**" & $TAGLINEc & " " & " No Target To Find. Try updating CIM***"
			halt

	        :We_Got_Game
	        #Echo "***Focus " & $FOCUS & "**"
	        if ($HOLO)
				setVar $cx 1
				setVar $cn 0
				while (SECTOR.WARPS[$player~CURRENT_SECTOR][$cx] <> 0)
					setVar $adj SECTOR.WARPS[$player~CURRENT_SECTOR][$cx]
					if (SECTOR.EXPLORED[$adj] = "NO") OR (SECTOR.EXPLORED[$adj] = "CALC")
						add $cn 1
					end
					add $cx 1
				end
				if ($cn > 2)
					gosub :Do_Holo
					gosub :Display_Holo
				end
	        end
				setVar $engagestring "Y"
				send " M" & $Focus & "*Y"
				setTextLineTrigger		Sector__Good	:Sector__Good	"Locating beam pinpointed, TransWarp"
				setTextLineTrigger		Sector__Here	:Sector__GoodNav	"<Set NavPoint>"
				setTextLineTrigger		Sector__Bad		:Sector__Bad	"No locating beam found"
				setTextTrigger				Sector__Far		:Sector__Far	"You do not have enough Fuel Ore to make the jump."
				pause
				:Sector__Bad
					killAllTriggers
					goto :We_Done
				:Sector__Far
					killAllTriggers
					getNearestWarps $WarpArray $player~CURRENT_SECTOR
					setVar $c 1
					while ($c <= $WarpArray)
						setVar $focus $WarpArray[$c]
						if ((PORT.CLASS[$focus] = 3) OR (PORT.CLASS[$focus] = 4) OR (PORT.CLASS[$focus] = 5) OR (PORT.CLASS[$focus] = 7))
							getSectorParameter $focus "FIGSEC" $Flag
							isNumber $tst $flag
							if ($tst = 0)
								setVar $flag 0
								setSectorParameter $focus "FIGSEC" FALSE
							end
                        	if ($flag = 1)
								setVar $destination $focus
								gosub :getCourse
								if ($courseLength <> 0)
									setVar $j 2
									setVar $result ""

									while ($j <= $courseLength)
										getSectorParameter $COURSE[$j] "FIGSEC" $Flag
										isNumber $tst $Flag
										if ($tst = 0)
											setVar $Flag 0
											setSectorParameter $COURSE[$j] "FIGSEC" FALSE
										end
										if (($Flag = 0) AND ($COURSE[$j] <> $player~CURRENT_SECTOR))
											goto :Next_SXX_Port
										end
										setVar $result $result&"m"&$COURSE[$j]&"* "
										if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK))
											setVar $result ($result&" Z  A  "&$maxFigAttack&"*  *  ")
										end
										# If Not FED Space, Drop A Fig, if we haven't already
										if (($COURSE[$j] > 10) AND ($COURSE[$j] <> STARDOCK) AND ($j > 2))
											getSectorParameter $COURSE[$j] "FIGSEC" $Flag
											isNumber $tst $Flag
											if ($tst = 0)
												setVar $Flag 0
												setSectorParameter $COURSE[$j] "FIGSEC" FALSE
											end
											if ($Flag = 0)
												setVar $result ($result&" F  Z  1 * Z  C  D  *  ")
												setSectorParameter $COURSE[$j] "FIGSEC" TRUE
											end
										end
										add $j 1
									end
									waitfor "Command ["

									if ($TRACKER)
										send ($result&"  **  ")
										gosub :player~quikstats
										gosub :Haggel_Checker
									else
										send ($result&"  **    P   T   *   *   *   *   ")
									end

									gosub :player~quikstats
									if ($player~total_holds <> $player~ore_holds) AND ($TRACKER = 0)
										if (CURRENTCREDITS < 10000)
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out of Funds for ORE purchase.**"
										elseif (($UNLIM = FALSE) AND (CURRENTTURNS < 1))
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out Turns. Photon'd Maybe??**"
										else
											Echo "**" & $TAGLINEc & " " & " Not Enough ORE to continue.**"
										end
										halt
									elseif ($TRACKER) AND ($player~ore_holds < ($player~total_holds - $EQU_MIN))
										if (CURRENTCREDITS < 10000)
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out of Funds for ORE purchase.**"
										elseif (($UNLIM = FALSE) AND (CURRENTTURNS < 1))
											Echo "**" & $TAGLINEc & " " & " Appear To Be Out Turns. Photon'd Maybe??**"
										else
											Echo "**" & $TAGLINEc & " " & " Not Enough ORE to continue.**"
										end
										halt
									elseif (CURRENTCREDITS < 10000)
										Echo "**" & $TAGLINEc & " " & " Too Few Credits to continue.**"
										halt
									end
									goto :To_The_Top
								end
							end
						end
						:Next_SXX_Port
                    	add $c 1
					end
					goto :We_Done
				:Sector__GoodNav
					send "*q"
					setVar $engagestring ""
				:Sector__Good
					killAllTriggers
					#echo ("**" & $TAGLINEc & " " & ANSI_8&"<"&ANSI_15&"Twarping To Jump Point: "&ANSI_14&$Focus&ANSI_8&">*")

					setVar $DROP_STR ""
					if ($DROPING_MINES <> 0)
						if (SECTOR.WARPINCOUNT[$focus] >= 3)
							if (($DROPING_MINES = 1) OR ($DROPING_MINES = 3))
								if ($player~LIMPETS > $DROP_LIMP)
									setVar $DROP_STR ($DROP_STR & "H 2 Z "&$DROP_LIMP&"* C * ")
								else
								   if ($DROPING_MINES = 1)
								   	setVar $DROPING_MINES 0
								   else
								   	setVar $DROPING_MINES 2
								   end
								end
							end

							if (($DROPING_MINES = 2) OR ($DROPING_MINES = 3))
								if ($player~ARMIDS > $DROP_ARMID)
									setVar $DROP_STR ($DROP_STR & "H 1 Z "&$DROP_ARMID&"* C * ")
								else
									if ($DROPING_MINES = 2)
										setVar $DROPING_MINES 0
									else
										setVar $DROPING_MINES 1
									end
								end
							end
						end
					end
					send $engagestring "  *  A Z " & $maxFigAttack & "998877665544332211 n  *  **   " & $DROP_STR
					gosub :player~quikstats
			goto :To_The_Top
		else
			Echo "**" & $TAGLINEc & " " & " Walled In (No Twarp Available)***"
			halt
		end

		:Next_Target

		setVar $figsToDrop 1
		setvar $density_trick false
		if (SECTOR.DENSITY[$Target] = 0)
			if ($DROP_TWENTY = 1)
				setvar $density_trick true
				setVar $figsToDrop 20
			end
		end
		send "  m " & $Target & " *  z  a  " & $maxFigAttack & "99887766554433221100  n  *  dz  n  f  z  " $figsToDrop "*  z  c  d  *  "
		setTextLineTrigger u_torped :help_me "Your ship was hit by a Photon and has been disabled."
		setTextLineTrigger no_turns :help_me "You don't have enough turns left."
		setTextLineTrigger ig_hold1 :help_me "You attempt to retreat but are held fast by an Interdictor Generator."
		setTextLineTrigger ig_hold2 :help_me "An Interdictor Generator in this sector holds you fast!"
		setTextLineTrigger quasar_b :help_me "Quasar Blast!"
		waiton ":[" & $Target & "] (?=Help)"
		goto :help_me_jmp
		:help_me
			killAllTriggers
			getWord CURRENTLINE $spoofy 1
			if ($spoofy <> "Your") AND ($spoofy <> "You") AND ($spoofy <> "An") AND ($spoofy <> "Quasar")
				goto :help_me_jmp
			end
			stop _ck_callsaveme
			stop _ck_callsaveme
			send "   N   Y  *  N   *   R   *   Q   Q   Q   Z   N   *   R   *   "
			waitFor "Command [TL="
			load _ck_callsaveme
			waitFor "Message sent on sub-space channel"
			halt
		:help_me_jmp
		add $DEP_FIGS 1
		add $DEP_NEW 1
		setSectorParameter $Target "FIGSEC" TRUE
		setVar $CHKD[$Target] 1

		setVar $DROP_STR ""

		if ($density_trick <> true)
			if ($DROPING_MINES <> 0)
				if (SECTOR.WARPINCOUNT[$Target] >= 3)
					if (($DROPING_MINES = 1) OR ($DROPING_MINES = 3))
						if ($player~LIMPETS > $DROP_LIMP)
							setVar $DROP_STR ($DROP_STR & "H 2 Z "&$DROP_LIMP&"* C * ")
						else
						   if ($DROPING_MINES = 1)
						   	setVar $DROPING_MINES 0
						   else
						   	setVar $DROPING_MINES 2
						   end
						end
					end

					if (($DROPING_MINES = 2) OR ($DROPING_MINES = 3))
						if ($player~ARMIDS > $DROP_ARMID)
							setVar $DROP_STR ($DROP_STR & "H 1 Z "&$DROP_ARMID&"* C * ")
						else
							if ($DROPING_MINES = 2)
								setVar $DROPING_MINES 0
							else
								setVar $DROPING_MINES 1
							end
						end
					end
				end
			end
		end
		if  ($DROP_STR <> "")
			send $DROP_STR & "  j  *"
			waiton "Are you sure you want to jettison all cargo?"
		end
		gosub :player~quikstats

		if ($PLAYER~CURRENT_PROMPT <> "Command")
			Echo "**" & $TAGLINEc & " " & "Wrong Prompt After Sector Hit.***"
			halt
		end

		if ($TRACKER)
			gosub :Haggel_Checker
		end

		if ($PLAYER~CURRENT_PROMPT <> "Command")
	        send " r *  *  p d 0* 0* 0* * *** * c q q q q q z 2 2 c q * z * *** * * "
			gosub :player~quikstats
			if ($PLAYER~CURRENT_PROMPT = "Command")
				load "_ck_callsaveme.cts"
				halt
			else
				Echo "**" & $TAGLINEc & " " & "Hmmm..  I seem to be stuck.***"
				halt
			end
		end

		gosub :UpdateStatus_window

		if (($Report_RYLOS) AND (RYLOS > 1))
			send "'["&$TagLineB&"] Class 0 RYLOS Spotted In Sector: " & RYLOS &"*"
			waitfor "Message sent on sub-space channel"
			setVar $Report_RYLOS	FALSE
		end
		if (($Report_ALPHA) AND (ALPHACENTAURI > 1))
			send "'["&$TagLineB&"] Class 0 ALPHACENTAURI Spotted In Sector: " & ALPHACENTAURI &"*"
			waitfor "Message sent on sub-space channel"
            setVar $Report_ALPHA	FALSE
		end

		if (($Update_Port) AND (PORT.EXISTS[$Target]))
			send "CR*Q"
			waitfor "<Computer deactivated>"
		end
		
		if ($player~FIGHTERS <= 10)
			Echo "**" & $TAGLINEc & " " & "Fighter Level is Critically Low (Less Than 10)**"
			Halt
		end
	end

	if ($UNLIM = 0)
		if (CURRENTTURNS <= $Turn_Limit)
			send "'["&$TagLineB&"] Turn Limit Reached, Halting*"
		end
	else
		send "'["&$TagLineB&"] Nothing To Do*"
	end

	halt

:TurnsGone
	killAllTriggers
	send "   *   *    *   /"
	waiton #179 & "Turns"
	getText CURRENTLINE $LOCAL "Sect" (#179 & "Turns")
	stripText $LOCAL " "
	send "'"
	waitfor "Sub-space radio ("
	send $LOCAL & "=saveme*"
	waitfor "Message sent on sub-space channel"
	send "F  Z  1*  Z  C  D  *  "
	setDelayTrigger		NoHelpComming	:NoHelpComming	4000
	setTextLineTrigger	HelpCame		:HelpCame		"Saveme script activated - "
	pause
	:NoHelpComming
		killAllTriggers
		send "'["&$TAGLINEb&"] No Help Came.*"
		halt
	:HelpCame
		killAllTriggers
		getText CURRENTLINE $planet~planet "Planet" "to"
		stripText $planet~planet " "
		send "L Z" & #8 & $planet~planet & "*  J  C  *  "
		halt



:Build_FIG_LIST
	killAllTriggers
	send "'Scanning Deployed Fighters...*G"
	SetVar $idx 1
	while ($idx <= SECTORS)
		setSectorParameter $idx "FIGSEC"	FALSE
    	add $idx 1
	end
	killAllTriggers
	waitfor "==========================================================="
	setTextLineTrigger FigLine1		:AddInFigC	" Corp "
	setTextLineTrigger FigLine2		:AddInFigP	" Personal "
	setTextLineTrigger LstBottom	:LstBottom	" Total "
	setTextLineTrigger LstNone		:LstBottom	"No fighters deployed"
	pause
	:AddInFigP
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "FIGSEC" TRUE
		add $DEP_FIGS 1
		setTextLineTrigger FigLine2		:AddInFigP	" Personal "
		pause
	:AddInFigC
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "FIGSEC" TRUE
		add $DEP_FIGS 1
		setTextLineTrigger FigLine1		:AddInFigC	" Corp "
		pause
	:LstBottom
		killAllTriggers

	return

:Build_LIMP_LIST
	killAllTriggers
	setArray $Limps	SECTORS

	SetVar $idx		1
	while ($idx <= SECTORS)
		setSectorParameter $idx "LIMPSEC"	0
		add $idx 1
	end

	send "'Scanning Deployed Limpets...*k2"
	waitfor "===================================="
	setTextLineTrigger LimpLine1		:AddInLimpC	" Corporate"
	setTextLineTrigger LimpLine2		:AddInLimpP	" Personal "
	setTextLineTrigger LstBottom		:LimpLstBottom	"Activated  Limpet  Scan"
	setTextLineTrigger LstNone			:LimpLstBottom	"No Limpet mines deployed"
	pause
	:AddInLimpC
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "LIMPSEC" TRUE
		add $DEP_LIMP 1
		setVar $Limps[$sector] TRUE
		setTextLineTrigger LimpLine1		:AddInLimpC	" Corporate"
		pause
	:AddInLimpP
		getWord CURRENTLINE $sector 1
		setSectorParameter $sector "LIMPSEC" TRUE
		add $DEP_LIMP 1
		setVar $Limps[$sector] TRUE
		setTextLineTrigger LimpLine2		:AddInLimpP	" Personal "
		pause
	:LimpLstBottom
		killAllTriggers

	return

:UpdateStatus_window
	setVar $Window_TXT ""

	setVar $Window_TXT ($Window_TXT & " Sector    : " & $player~CURRENT_SECTOR & "*")
	if ($UNLIM)
		setVar $Window_TXT ($Window_TXT & " Turns     : Unlimited*")
	else
		setVar $CashAmount CURRENTTURNS
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " Turns     : " & $CashAmount)
		setVar $CashAmount $Turn_Limit
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " (Turn Limit " & $CashAmount & ")*")
	end

	setVar $CashAmount CURRENTCREDITS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Credits   : $" & $CashAmount & "*")

	setVar $CashAmount $player~FIGHTERS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Fighters  : " & $CashAmount & "*")

	setVar $CashAmount $DEP_FIGS
	gosub :CommaSize
	setVar $CashAmount1 $CashAmount
	setVar $CashAmount SECTORS
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Grid      : " & $CashAmount1 & " of " & $CashAmount & "*")

	setVar $CashAmount $DEP_NEW
	gosub :CommaSize
	setVar $Window_TXT ($Window_TXT & " Gridded   : " & $CashAmount & "*")
	if ($TRACKER)
		setVar $CashAmount $MCICd
		gosub :CommaSize
		setVar $Window_TXT ($Window_TXT & " MCIC'd    : " & $CashAmount & " ("&$Track_File&")*")
	end

	setVar $Window_TXT ($Window_TXT & "    ----------------: Log Entries :----------------*")
	setVar $ii 1

	while ($ii <= 5)
		if ($LOG_ENTRIES[$ii] <> "")
			setVar $Window_TXT ($Window_TXT & " " & $LOG_ENTRIES[$ii] & "*")
		end
    	add $ii 1
	end
	setWindowContents status ("*" & $Window_TXT)
	setvar $window_content $Window_TXT
	replacetext $window_content "*" "[][]"
	savevar $window_content
	return

:CommaSize
	if ($CashAmount < 1000)
		#do nothing
	elseif ($CashAmount < 1000000)
    	getLength $CashAmount $len
		setVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $CashAmount $tmp
	elseif ($CashAmount <= 999999999)
		getLength $CashAmount $len
		setVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $CashAmount $tmp
	end
	return

:Move_Down
	setVar $LOG_ENTRIES[5] $LOG_ENTRIES[4]
	setVar $LOG_ENTRIES[4] $LOG_ENTRIES[3]
	setVar $LOG_ENTRIES[3] $LOG_ENTRIES[2]
	setVar $LOG_ENTRIES[2] $LOG_ENTRIES[1]
	setVar $LOG_ENTRIES[1] ($LOG_EVENT & " " & $LOG_TEXT)
	return

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f*"&$destination&"*nq"
	pause
:sectorsline
	killAllTriggers
	setVar $line CURRENTLINE
	replacetext $line ">" " "
	striptext $line "("
	striptext $line ")"
	setVar $line $line&" "
	getWordPos $line $pos "So what's the point?"
	getWordPos $line $pos2 ": ENDINTERROG"
	getWordPos $line $pos3 "*** Error"

	if (($pos > 0) OR ($pos2 > 0))
		setVar $courseLength 0
		return
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$destination&" "
	getWordPos $line $pos2 "("&$destination&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$destination&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$destination
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$destination&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $COURSE[$index] $index
	while ($COURSE[$index] <> ":::")
		add $courseLength 1
		add $index 1
		getWord $sectors $COURSE[$index] $index
	end
	return

:Haggel_Checker
	killAllTriggers
	#
	#	Been a few double ups so making some changes!
	#		We need to trade on one of three conditions
	#		- Low Ore and they sell ore
	#		- Low Equip and they sell Equip
	#		- Buy Equip and no MCIC

		setVar $dotrade 0
		if (($player~ore_holds < 75) and (PORT.BUYFUEL[$player~CURRENT_SECTOR] = 0))
			setVar $dotrade 1
		elseif (($player~equipment_holds < $EQU_MIN_BUY) and (PORT.BUYEQUIP[$player~CURRENT_SECTOR] = 0))
			setVar $dotrade 1
		elseif ((PORT.BUYEQUIP[$player~CURRENT_SECTOR] = 1) and ($MCIC[$player~CURRENT_SECTOR] = FALSE))
			setVar $dotrade 1
		end
		if ($dotrade = 0)
			return
		end
	# End addition

		setVar $EQU_NEED2BUY ($EQU_MIN - $player~equipment_holds)
		setVar $ORE_NEED2BUY (($player~total_holds - $EQU_MIN) - $player~ore_holds)
		if (PORT.CLASS[$player~CURRENT_SECTOR] = 1) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 5) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 6) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 7) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 3) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 4) OR (PORT.CLASS[$player~CURRENT_SECTOR] = 2)
			#send "CR*Q"
			#waiton "<Computer deactivated>"
			#if (PORT.EQUIP[$player~CURRENT_SECTOR] >= $EQU_NEED2BUY) AND ($EQU_NEED2BUY <> 0)
			setTextTrigger noPort :noPort "Corp Menu"
			send "pt"
			Waiton "<Port>"
			setTextTrigger	noFuel		:noFuel		"How many holds of Fuel Ore do you want to buy"
			setTextTrigger	noOrg		:noOrg		"How many holds of Organics do you want to buy"
			setTextTrigger	equp		:equp		"How many holds of Equipment do you want to sell ["
			setTextTrigger	buyequp		:buyequp	"How many holds of Equipment do you want to buy"
			setTextTrigger	nosell		:nosell		"You don't have anything they want"
			setTextTrigger	fuelsell 	:fuelsell	"How many holds of Fuel Ore do you want to sell"
			setTextTrigger	orgSell 	:orgSell	"How many holds of Organics do you want to sell"
			setTextTrigger	done		:done		"Command [TL"
			pause
			:noPort
				killAllTriggers
				Echo "***Hmmm.. where'd the port go?!?**"
				halt
			:done
				killAllTriggers
				return
			:noFuel
        		if ($ORE_NEED2BUY >= 1)
        			#send $ORE_NEED2BUY & "**"
        			send $ORE_NEED2BUY & "*"
        		else
        			send "0*"
        		end
        		pause
			:noOrg
			send "0*"
			pause
			:equp
			if ($MCIC[$player~CURRENT_SECTOR] = 0)
				setVar $MCIC[$player~CURRENT_SECTOR] TRUE
				if ($player~equipment_holds > $EQU_MIN)
					#send ($player~equipment_holds - $EQU_MIN) & "**"
					send ($player~equipment_holds - $EQU_MIN) & "*"
				else
					add $MCICd 1
					#send "5**"
					send "5*"
				end
			else
				send "0*"
			end
			pause
			:buyequp
			if ($EQU_NEED2BUY >= 1)
				#send $EQU_NEED2BUY & "**"
				send $EQU_NEED2BUY & "*"
			else
				send "0*"
			end
			pause
			:nosell
			killAllTriggers
			return
			:fuelsell
			if ($player~ore_holds > ($player~total_holds - $EQU_MIN))
				#send $player~ore_holds - ($player~total_holds - $EQU_MIN)& "**"
				send $player~ore_holds - ($player~total_holds - $EQU_MIN)& "*"
			else
				send "0*"
			end
			pause
			:orgsell
			#send "**"
			send "*"
			pause
	end
	return
:Do_Holo
	setArray $HoloOutput 2000
	setVar $Line_Pointer 1
                	send "SzH*  "
	setTextLineTrigger	TurnsGone		:TurnsGone		"Do you want instructions (Y/N) [N]?"
	setTextLineTrigger	DoneScan		:DoneScan		"Warps to Sector(s) :"

	waiton "Long Range Scan"
    :reset_trigger
	setTextLineTrigger holo_line :holo_line
	pause
	:holo_line
	setVar $HoloOutput[$Line_Pointer] CURRENTLINE
	if ($Line_Pointer <= 2000)
		add $Line_Pointer 1
	end
	goto :reset_trigger
	:DoneScan
	killAllTriggers
	setVar $HoloOutput[$Line_Pointer] "ENDENDENDENDENDENDEND"
	return

:Display_Holo
	setVar $Holo_i 1
	setVar $Holo_ptr 1
	setVar $Holo_s ""
	setVar $AvoidFlag ""
	while (SECTOR.WARPS[$player~CURRENT_SECTOR][$Holo_i] > 0)
		setVar $Holo_adj SECTOR.WARPS[$player~CURRENT_SECTOR][$Holo_i]
		if ((SECTOR.PLANETCOUNT[$Holo_adj] > 0) OR (SECTOR.TRADERCOUNT[$Holo_adj] > 0) OR (SECTOR.SHIPCOUNT[$Holo_adj] > 0))
	       		setVar $figOwner SECTOR.FIGS.OWNER[$Holo_adj]
			if ((SECTOR.FIGS.QUANTITY[$Holo_adj] >= 100) AND (($figOwner <> "belong to your Corp") OR ($figOwner <> "yours")))
				while ($Holo_ptr <= $Line_Pointer)
	            			getWordPos $HoloOutput[$Holo_ptr] $Holo_pos ("Sector  : " & $Holo_adj)
	            			setVar $AvoidFlag ($AvoidFlag & " " & $Holo_adj)
					if ($Holo_pos <> 0)
						setvar $Holo_s ($Holo_s & $HoloOutput[$Holo_ptr] & "*")
						:Lets_Go_Again
						add $Holo_ptr 1
						getWordPos $HoloOutput[$Holo_ptr] $pos "Warps to Sector(s) :"
						if (($HoloOutput[$Holo_ptr] <> "") AND ($pos = 0))
							setvar $Holo_s ($Holo_s & $HoloOutput[$Holo_ptr] & "*")
						else
							setvar $Holo_s ($Holo_s & "         *")
							goto :Done_Scan
						end
						goto :Lets_Go_Again
					end
	            			add $Holo_ptr 1
				end
			end
		end
		:Done_Scan
    	add $Holo_i 1
	end

	SetVar	$HOLO_TARGETS	"LSHRED_" & GAMENAME & ".log"
	if ($Holo_s <> "")
		send "'*["&$TagLineB&"] SCAN RESULTS----------------------[ADJ SECTOR: " & CURRENTSECTOR & "*"
		send $Holo_s & "* "
		waitfor "Sub-space comm-link terminated"
	end
	return
	
:resetMinesAfterRestock

	if (($DROP_ARMID > 0) and ($DROP_LIMP > 0))
		setVar $DROPING_MINES 3
	elseif ($DROP_ARMID > 0)

		setVar $DROPING_MINES 2
	elseif ($DROP_LIMP > 0)

		setVar $DROPING_MINES 1
	else
		setVar $DROPING_MINES 0
	end
return


:getPersonalPlanets

	# Planet list from personal planets - relies on no shields being present
	setVar $planet~planetsInSectors SECTORS

	send "cyq"
	waitfor "<Computer activated>"
	waitfor "Sector  Planet Name"

	:pread
	setTextLineTrigger pread1 :pread1 "#" 
	setTextLineTrigger preadDone :preadDone "======   ============  ==== ==== ==== ===== ===== " 
	setTextLineTrigger preadDone2 :preadDone "No Planets claimed"
	pause
	:pread1
		killAllTriggers
		getWord CURRENTLINE $sector 1
		add $planet~planetsInSectors[$sector] 1
		goto :pread
	
	:preadDone
		killAllTriggers


	

return


include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
