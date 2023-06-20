    #=--------                                                                       -------=#
     #=------------------------------ Grid Target Lister v1  ------------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	March 26, 2007 - Version 1.03
	#		Author		:	LoneStar
	#		TWX			:	For 2.04b, and 2.04 Final
	#		Description	:	Gridding List Target Maker
	#
	#		Fixes		:	- Stupidly Stripped the : from inputted filenames.. duh!
	#						- Added Save/LoadVar Logic for custom Filenames
	#                   	- Optimzed ORE-Waster Logic. Now Calcs farthest distances
	#                         from A to B, from B to C, and so on
	#                       - Variable Issue w/respect to dedisp of $PROXIMITY, was $PROXIMITY_Dist

	setVar $TagLine 			"LS's Gridder Target Lister"
   	setVar $TagLineB 			("**"&ANSI_14&"LSTR "&ANSI_15&"-")
	setVar $TagLineC 			("*       "&ANSI_14&"LSTR "&ANSI_15&"-")
	setVar $TagVersion 			"Version 1.03"
	setVar $TagVersionMinor 	"v1.03 "
	setVar $figfile 			"_ck_" & GAMENAME & ".figs"
	setVar $figfile_MOM			"_MOM_" & GAMENAME & ".figs"

	setArray $Figs				SECTORS
	setVar $RESULT				0

	setVar $FILENAME_DEFAULT	"c:\123.txt"

	loadVar $LSTR_FNAME
	if (($LSTR_FNAME = 0) OR ($LSTR_FNAME = ""))
		setVar $LSTR_FNAME $FILENAME_DEFAULT
		saveVar $LSTR_FNAME
	end

	setVar $FILENAME			$LSTR_FNAME
	setVar $LST_ORDER			"Ascending"
	setVar $CORP_FIGS			0
	setVar $PROXIMITY			0
	setVar $PROXIMITY_Dist		0
	setVar $WARPS				6
	setVar $LIMITOR				0
	setVar $SELECTED			ANSI_14
	setVar $MIN_TUNNEL_LENG		3

	gosub :Reset_Lines

	if (GAMENAME = "")
		echo $TagLineB & "GameName Is Not Set**"
		halt
	end
	if ((STARDOCK = 0) OR (STARDOCK = ""))
		echo $TagLineB & "StarDock Not Visited**"
		halt
	end

	fileExists $tst $figfile_MOM
	if ($tst = 0)
		fileExists $tst $figfile
		if ($tst = 0)

		else
			echo $TagLineB&" Reading ck's Fighter File...*"
			setArray $puke SECTORS
			setVar $i 1
			readtoarray $figfile $puke
			while ($i <= SECTORS)
				getWord $puke[1] $fig_check $i
				if ($fig_check <> 0)
					setVar $FIGS[$i] 1
				end
				add $i 1
			end

		end
	else
  		echo $TagLineB&" Reading M()M Fighter File...*"
		readtoarray $figfile_MOM $FIGS
	end
	:Menu_Top
	echo #27 & "[2J"
	:Menu_Top_No_Clear
	Echo "**"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo ANSI_15 & "*    -/-   LoneStar's Grid Maker   -/-*"
	Echo ANSI_7&"               Version "&$TagVersionMinor&"*"
	Echo ("    "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_8&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo ANSI_8&"*    1"&ANSI_10&" - "&$LINE1&"DeadEnds"
	Echo ANSI_8&"*    2"&ANSI_10&" - "&$LINE2&"Fill Universe"
	Echo ANSI_8&"*    3"&ANSI_10&" - "&$LINE3&"Fill Holes"
	Echo ANSI_8&"*    4"&ANSI_10&" - "&$LINE4&"Orphan Fighters"
	Echo ANSI_8&"*    5"&ANSI_10&" - "&$LINE5&"Existing Grid"
	Echo ANSI_8&"*    6"&ANSI_10&" - "&$LINE6&"Tunnels"
	Echo ANSI_8&"*    7"&ANSI_10&" - "&$LINE7&"Proximal          "
	if ($PROXIMITY = 0)
	else
		echo ANSI_7&"Within "&$PROXIMITY_Dist&" hops of " &$PROXIMITY
	end
	Echo ANSI_8&"*    8"&ANSI_10&" - "&$LINE8&"Sector Warps      "&ANSI_7&$WARPS&" ways"
	Echo ANSI_8&"*    9"&ANSI_10&" - "&$LINE9&"Corp Targetting   "
	if ($CORP_FIGS = 0)
		echo ANSI_7&"Nope"
	else
		echo ANSI_7&"Corp "&$CORP_FIGS
	end
    ECHO "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo ANSI_8&"*    O"&ANSI_10&" - "&ANSI_15&"List Order        "&ANSI_7&$LST_ORDER
	Echo ANSI_8&"*    L"&ANSI_10&" - "&ANSI_15&"Limit Results     "
	if (($LIMITOR = 0) OR ($LIMITOR = SECTORS))
		Echo ANSI_7&"No"
	else
		Echo ANSI_7&$LIMITOR & ", Targets"
	end
	Echo ANSI_8&"*    F"&ANSI_10&" - "&ANSI_15&"OutPut File Name  "&ANSI_7&$FILENAME
    Echo ANSI_8&"*    V"&ANSI_10&" - "&ANSI_15&"View Grid Status"
    Echo ANSI_8&"*    G"&ANSI_10&" - "&ANSI_15&"Generate Results"
    Echo ANSI_8&"*    W"&ANSI_10&" - "&ANSI_15&"Write File"
    Echo ANSI_8&"*    Q"&ANSI_10&" - "&ANSI_15&"Quit"
    if ($RESULT <> 0)
   		setVar $CashAmount $RESULT
		gosub :CommaSize
		echo $TagLineC&ANSI_15&" "&$CashAmount&" Total Sectors Found."
	end
    ECHO "*    " #27 "[1m" ANSI_4 #196 #196 #196 #196 #196 #196  #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196 #196
	Echo "*    "&ANSI_4&"("&ANSI_14&"H"&ANSI_6&"elp"&ANSI_4&")?"

	:Another_Input
	getConsoleInput $Select SINGLEKEY
	UpperCase $Select
	if ($Select = "Q")
		#					----------={	Quit
		echo "**" & ANSI_12 "  Script Halted" & ANSI_15 & "**"
		halt
	elseif ($Select = "H")
		gosub :Help_Me
		goto  :Menu_Top_No_Clear
	elseif ($Select = "1")
		#					----------={    DeadEnds
		gosub :Reset_Lines
		SetVar $LINE1 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "2")
		#					----------={	Fill Universe
		gosub :Reset_Lines
		SetVar $LINE2 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "3")
		#					----------={    Fill Holes
		gosub :Reset_Lines
		SetVar $LINE3 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "4")
		#					----------={	Orphan Fighters
		gosub :Reset_Lines
		SetVar $LINE4 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "5")
		#					----------={	Existing Grid
		gosub :Reset_Lines
		SetVar $LINE5 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "6")
		#					----------={    Tunnels
		gosub :Reset_Lines
		SetVar $LINE6 $SELECTED
		setVar $RESULT 0
	elseif ($Select = "7")
		#					----------={	Proximal
		gosub :Reset_Lines
		setVar $RESULT 0
		getInput $selection	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Start Point Sector Number  (" & ANSI_6 & "0 To Cancel" & ANSI_14 & ")?")
		isNumber $tst $selection
		if ($tst = 0)
			setVar $PROXIMITY 0
			setVar $PROXIMITY_Dist 0
		else
			if ($selection > SECTORS)
				setVar $PROXIMITY 0
				setVar $PROXIMITY_Dist 0
			elseif ($selection < 1)
				setVar $PROXIMITY 1
			else
				setVar $PROXIMITY $selection
			end
		end
		if ($PROXIMITY <> 0)
			getInput $selection	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Number Of Hops Out From "&$PROXIMITY&" (" & ANSI_6 & "0 To Cancel" & ANSI_14 & ")?")
			isNumber $tst $selection
			if ($tst = 0)
				setVar $PROXIMITY 0
				setVar $PROXIMITY_Dist 0
			else
				if ($selection > 15)
					setVar $PROXIMITY_Dist 15
				elseif ($selection < 1)
					setVar $PROXIMITY_Dist 1
				else
					setVar $PROXIMITY_Dist $selection
					SetVar $LINE7 $SELECTED
				end
			end
		end
	elseif ($Select = "8")
		#					----------={	Sector Warps
		gosub :Reset_Lines
		setVar $RESULT 0
		SetVar $LINE8 $SELECTED
		if ($WARPS = 1)
			setVar $WARPS 2
		elseif ($WARPS = 2)
			setVar $WARPS 3
		elseif ($WARPS = 3)
			setVar $WARPS 4
		elseif ($WARPS = 4)
			setVar $WARPS 5
		elseif ($WARPS = 5)
			setVar $WARPS 6
		elseif ($WARPS = 6)
			setVar $WARPS 1
		end
	elseif ($Select = "9")
		#					----------={	Corporation Targetting
		gosub :Reset_Lines
		setVar $RESULT 0
		getInput $selection	(ANSI_15 & #27 & "[1A" & #27 & "[K" & ANSI_14 & "*Which Enemy Corp Fighters To Target (" & ANSI_6 & "0 To Cancel" & ANSI_14 & ")?")
		isNumber $tst $selection
		if ($tst = 0)
			setVar $CORP_FIGS 0
		else
			setVar $CORP_FIGS $selection
			SetVar $LINE9 $SELECTED
		end
	elseif ($Select = "O")
		#					----------={	List Ordering
		if ($LST_ORDER = "Ascending")
			setVar $LST_ORDER "Descending"
		elseif ($LST_ORDER = "Descending")
			setVar $LST_ORDER "Random"
		elseif ($LST_ORDER = "Random")
			setVar $LST_ORDER "Ore Waster"
		elseif ($LST_ORDER = "Ore Waster")
			setVar $LST_ORDER "Ascending"
		end
	elseif ($Select = "L")
		#					----------={	Limit Results
		getInput $selection	(#27 & "[1A" & #27 & "[K" & ANSI_14 & "*Enter Maximum Number Of Results (" & ANSI_6 & "0 For Maximum" & ANSI_14 & ")?")
		isNumber $tst $selection
		if ($tst = 0)
			setVar $LIMITOR 0
		else
			if ($selection < 0)
				setVar $LIMITOR 0
			elseif ($Selection > SECTORS)
				setVar $LIMITOR SECTORS
			else
				setVar $LIMITOR $selection
			end
		end
	elseif ($Select = "F")
	#					----------={	Output File Name
		getInput $selection	(#27 & "[1A" & #27 & "[K" & ANSI_14 & "*File Name To Output Results Too (" & ANSI_6 & "Default Is " & $FILENAME_DEFAULT & ANSI_14 & ")?")
		stripText $selection "?"
		stripText $selection "*"
		stripText $selection ">"
		stripText $selection "<"
		stripText $selection "|"
		if (($selection = "") OR ($selection = "0"))
			setVar $FILENAME $FILENAME_DEFAULT
		else
			setVar $FILENAME $selection
		end
		setVar $LSTR_FNAME $FILENAME
		saveVar $LSTR_FNAME
	elseif ($Select = "V")
	#					----------={	View Grid Status
		gosub :SECTOR_BREAK_DOWN
		goto :Menu_Top_No_Clear
	elseif ($Select = "G")
	#					----------={    Generate Results
		gosub :Make_List
	elseif ($Select = "W")
   	#					----------={	Write File
		DELETE $FILENAME
		if ($RESULT = 0)
			gosub :Make_List
		end

		if ($LIMITOR = 0)
			setVar $LIMITOR SECTORS
		end

		if ($RESULT <> 0)
			setVar $RESULT 1
			if ($LST_ORDER = "Ascending")
				setVar $idx 1
				while (($idx <= SECTORS) AND ($Result <= $LIMITOR))
					if ($Results[$idx] <> 0)
						write $FILENAME $idx
						setVar $Results[$idx] 0
						Add $RESULT 1
					end
					add $idx 1
				end
			elseif ($LST_ORDER = "Descending")
				setVar $idx SECTORS
				while (($idx <> 0) AND ($Result <= $LIMITOR))
					if ($Results[$idx] <> 0)
						write $FILENAME $idx
						setVar $Results[$idx] 0
						add $RESULT 1
					end
					subtract $idx 1
				end
			elseif ($LST_ORDER = "Random")
				Echo ANSI_15&"**        Processing may take a couple minutes while the list is Randomized.**"
				setVar $idx 1
				while (($idx <= SECTORS) AND ($RESULT <= $LIMITOR))
					getRnd $ptr 1 20000
					setVar $ret $ptr
					setVar $temp 0
					while ($ptr <= SECTORS)
						if ($Results[$ptr] <> 0)
							write $FILENAME $ptr
							setVar $Results[$ptr] 0
							add $RESULT 1
							goto :Next_Rnd_Selection
                        end
                    	add $ptr 1
                    end
                    #If we get here, start searching Backwards
					while ($ret >= 1)
						if ($Results[$ret] <> 0)
							write $FILENAME $ret
							setVar $Results[$ret] 0
							add $RESULT 1
							goto :Next_Rnd_Selection
						end
						subtract $ret 1
                    end
                    #if we get here, there's no more results
					goto :We_Done
                    :Next_Rnd_Selection
					add $idx 1
				end
				:We_Done
			elseif ($LST_ORDER = "Ore Waster")
				Echo ANSI_15&"**        Processing may take  a  while depending on  the number of results"
				Echo ANSI_15&"*        found. If you are using TWX 2.04 final, processing shouldn't take"
				Echo ANSI_15&"*        too long. However, you can monitor the outputted file for changes"
				Echo ANSI_15&"*        in it's size;  no change over a  long period of time may indicate"
				Echo ANSI_15&"*        something is wrong. To minimize processing time(s),  try limiting"
				Echo ANSI_15&"*        results, grid, update Fighter list(s), and generate another list."

				setVar $idx 10

			end
		else
			echo $TagLineB&" Nothing To Do.**"
		end
	elseif ($Select = "?")
	else
		goto :Another_Input
	end
	goto :Menu_Top


    #=--------                                                                       -------=#
     #=------------------------------      SUB ROUTINES      ------------------------------=#
    #=--------                                                                       -------=#
:Reset_Lines
	setVar $LINE1				ANSI_15
	setVar $LINE2				ANSI_15
	setVar $LINE3				ANSI_15
	setVar $LINE4				ANSI_15
	setVar $LINE5				ANSI_15
	setVar $LINE6				ANSI_15
	setVar $LINE7				ANSI_15
	setVar $LINE8				ANSI_15
	setVar $LINE9				ANSI_15
	return

:SECTOR_BREAK_DOWN
	SetVar $SectorBreakDown_idx 1
	SetVar $data1 				0
	SetVar $data2 				0
	SetVar $data3 				0
	SetVar $data4 				0
	SetVar $data5 				0
	SetVar $data6 				0
	SetVar $datap1 				0
	SetVar $datap2 				0
	SetVar $datap3 				0
	SetVar $datap4 				0
	SetVar $datap5 				0
	SetVar $datap6 				0
	SetVar $fig1 				0
	SetVar $fig2 				0
	SetVar $fig3 				0
	SetVar $fig4 				0
	SetVar $fig5 				0
	SetVar $fig6 				0
	SetVar $Holes 				0
	SetVar $Orphans 			0
	SetVar $UFDE 				0
	SetVar $UEDE 				0
	SetVar $TUNL 				0

	Echo $TagLineB &" Processing " & ANSI_12 & "Grid Status" & ANSI_15 & ", Please Stand By...*"

	setArray $2WARP_CHECKED 	SECTORS

	setVar $WARP_PTR 11
	while ($WARP_PTR <= SECTORS)
		if (SECTOR.WARPCOUNT[$WARP_PTR] = 2) and ($2WARP_CHECKED[$WARP_PTR] = 0)
			setVar $length 						1
			setVar $2WARP_CHECKED[$WARP_PTR] 	1
			setVar $FOCUS 						$WARP_PTR
			setVar $TUNNEL_COURSE 				$FOCUS
			setVar $NUM_FIGS 					0

			setVar $TUNNEL_TEMP $FIGS[$WARP_PTR]
			if ($TUNNEL_TEMP > 0)
				add $NUM_FIGS 1
			end
			setVar $FOCUS SECTOR.WARPS[$WARP_PTR][1]
			getDistance $DIST_2_ADJ $FOCUS $WARP_PTR
			if ($DIST_2_ADJ = 1)
				setVar $Add_Focus "LEFT"
				gosub :WALK_THE_LINE
			end
			setVar $FOCUS SECTOR.WARPS[$WARP_PTR][2]
			getDistance $DIST_2_ADJ $FOCUS $WARP_PTR
			if ($DIST_2_ADJ = 1)
				setVar $Add_Focus "RIGHT"
				gosub :WALK_THE_LINE
			end
			if ($length >= $MIN_TUNNEL_LENG)
				if ($NUM_FIGS < $length)
					add $TUNL 1
				end
			end
		end
		add $WARP_PTR 1
	end

	While ($SectorBreakDown_idx <= SECTORS)
		setVar $SectorBreakDown_Figs $FIGS[$SectorBreakDown_idx]
		if ($SectorBreakDown_Figs = 0)
		# ----------------------------------------Find UnFig'd DEs
			if (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 1)
				add $UFDE 1
			end
			# ----------------------------------------Find Holes
			SetVar $adj 1
			# >= 1 .. will include DEs ... > 1 .. Excludes DEs
			if (SECTOR.WARPCOUNT[$SectorBreakDown_idx] > 1)
				if ($Figs[$SectorBreakDown_idx] = 0)
					while ($adj <= SECTOR.WARPCOUNT[$SectorBreakDown_idx])
						SetVar $adjSector SECTOR.WARPS[$SectorBreakDown_idx][$adj]
						setVar $temp $FIGS[$adjSector]
						if ($temp = 0)
							goto :NextHole
						end
						add $adj 1
					end
					add $Holes 1
				end
			end
			:NextHole
		end
		if ($SectorBreakDown_Figs > 0)
			# ----------------------------------------Find UnExplored DEs
			if (SECTOR.EXPLORED[$SectorBreakDown_idx] <> "YES")
				if (SECTOR.WARPINCOUNT[$SectorBreakDown_idx] = 1)
				   add $UEDE 1
				end
			end
			# ----------------------------------------Find Orphans
			SetVar $adj 1
			if (SECTOR.WARPCOUNT[$SectorBreakDown_idx] >= 1)
				if ($Figs[$SectorBreakDown_idx] > 0)
					while ($adj <= SECTOR.WARPCOUNT[$SectorBreakDown_idx])
						SetVar $adjSector SECTOR.WARPS[$SectorBreakDown_idx][$adj]
						if ($FIGS[$adjSector] > 0)
							goto :NextOrph
						end
						add $adj 1
					end
					if (($adjSector > 10) AND ($adjSector <> STARDOCK))
		    			add $Orphans 1
		    		end
	    		end
			end
			:NextOrph
		end

		if (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 1)
			if ($SectorBreakDown_Figs > 0)
				add $fig1 1
			end
			add $data1 1
			add $datap1 1
		elseif (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 2)
			if ($SectorBreakDown_Figs > 0)
				add $fig2 1
			end
			add $data2 1
			add $datap2 1
		elseif (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 3)
			if ($SectorBreakDown_Figs > 0)
				add $fig3 1
			end
			add $data3 1
			add $datap3 1
		elseif (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 4)
			if ($SectorBreakDown_Figs > 0)
				add $fig4 1
			end
			add $data4 1
			add $datap4 1
		elseif (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 5)
			if ($SectorBreakDown_Figs > 0)
				add $fig5 1
			end
			add $data5 1
			add $datap5 1
		elseif (SECTOR.WARPCOUNT[$SectorBreakDown_idx] = 6)
			if ($SectorBreakDown_Figs > 0)
				add $fig6 1
			end
			add $data6 1
			add $datap6 1
		end
		add $SectorBreakDown_idx 1
	end
	multiply $datap1 100
	divide $datap1 SECTORS
	multiply $datap2 100
	divide $datap2 SECTORS
	multiply $datap3 100
	divide $datap3 SECTORS
	multiply $datap4 100
	divide $datap4 SECTORS
	multiply $datap5 100
	divide $datap5 SECTORS
	multiply $datap6 100
	divide $datap6 SECTORS

	Echo "*" & ANSI_15
	Echo "           Warps "&ANSI_8&#179&ANSI_15&" Warp Count  "&ANSI_8&#179&ANSI_15&" Fig'd "&ANSI_8&#179&"*"
	Echo ("        "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&#196&#196&#196&#196&#196&#197&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#197&#196&#196&#196&#196&#196&#196&#196&#197&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo "*"
	SetVar $2BPadded $data1
	gosub :padsectcnt
	SetVar $2BPPadded $datap1
	gosub :padpercentile
	Echo ANSI_7 & "              1  " & ANSI_8 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_8 & " | "
	SetVar $2BPadded $fig1
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_8 & "  |*"

	SetVar $2BPadded $data2
	gosub :padsectcnt
	SetVar $2BPPadded $datap2
	gosub :padpercentile
	Echo ANSI_7 & "              2  " & ANSI_8 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_8 & " | "
	SetVar $2BPadded $fig2
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_8 & "  |*"

	SetVar $2BPadded $data3
	gosub :padsectcnt
	SetVar $2BPPadded $datap3
	gosub :padpercentile
	Echo ANSI_7 & "              3  " & ANSI_7 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_7 & " | "
	SetVar $2BPadded $fig3
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_7 & "  |*"

	SetVar $2BPadded $data4
	gosub :padsectcnt
	SetVar $2BPPadded $datap4
	gosub :padpercentile
	Echo ANSI_7 & "              4  " & ANSI_7 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_7 & " | "
	SetVar $2BPadded $fig4
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_7 & "  |*"

	SetVar $2BPadded $data5
	gosub :padsectcnt
	SetVar $2BPPadded $datap5
	gosub :padpercentile
	Echo ANSI_7 & "              5  " & ANSI_15 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_15 & " | "
	SetVar $2BPadded $fig5
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_15 & "  |*"

	SetVar $2BPadded $data6
	gosub :padsectcnt
	SetVar $2BPPadded $datap6
	gosub :padpercentile
	Echo ANSI_7 & "              6  " & ANSI_15 & "| " & ANSI_7 & $Padded & ANSI_8 & " (" & ANSI_7 & $PPadded & "%" & ANSI_8 & ")" & ANSI_15 & " | "
	SetVar $2BPadded $fig6
	gosub :padsectcnt
	Echo ANSI_7 & $Padded & ANSI_15 & "  |*"
	setVar $2BPadded ($data1 + $data2 + $data3 + $data4 + $data5 + $data6)
	gosub :padsectcnt
	Echo ANSI_7&"           Totals:" & $Padded & "         "
	setVar $2BPadded ($fig1 + $fig2 + $fig3 + $fig4 + $fig5 + $fig6)
	gosub :padsectcnt
	echo $Padded & "*"
	Echo ("           "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&ANSI_7&#196&ANSI_15&#196&#196)
	setVar $2BPadded $Holes
	gosub :padsectcnt
	setVar $CashAmount $Padded
	gosub :CommaSize
	getWordPos $CashAmount $pos ","
	if ($pos = 0)
		setVar $CashAmount (" "&$CashAmount)
	end
	Echo "*            " & ANSI_15 & "Holes                " & ANSI_14 & ": " & ANSI_7 & $CashAmount
	setVar $2BPadded $Orphans
	gosub :padsectcnt
	setVar $CashAmount $Padded
	gosub :CommaSize
	getWordPos $CashAmount $pos ","
	if ($pos = 0)
		setVar $CashAmount (" "&$CashAmount)
	end
	Echo "*            " & ANSI_15 & "Orphaned             " & ANSI_14 & ": " & ANSI_7 & $CashAmount
	setVar $2BPadded $UFDE
	gosub :padsectcnt
	setVar $CashAmount $Padded
	gosub :CommaSize
	getWordPos $CashAmount $pos ","
	if ($pos = 0)
		setVar $CashAmount (" "&$CashAmount)
	end
	Echo "*            " & ANSI_15 & "UnFig'd Dead Ends    " & ANSI_14 & ": " & ANSI_7 & $CashAmount
	setVar $2BPadded $UEDE
	gosub :padsectcnt
	setVar $CashAmount $Padded
	gosub :CommaSize
	getWordPos $CashAmount $pos ","
	if ($pos = 0)
		setVar $CashAmount (" "&$CashAmount)
	end
	Echo "*            " & ANSI_15 & "UnExplored Dead Ends " & ANSI_14 & ": " & ANSI_7 & $CashAmount
	setVar $2BPadded $TUNL
	gosub :padsectcnt
	setVar $CashAmount $Padded
	gosub :CommaSize
	getWordPos $CashAmount $pos ","
	if ($pos = 0)
		setVar $CashAmount (" "&$CashAmount)
	end
	Echo "*            " & ANSI_15 & "UnFig'd Tunnels      " & ANSI_14 & ": " & ANSI_7 & $CashAmount
	Echo "*"
	return

:WALK_THE_LINE
	# Called from :SECTOR_BREAK_DOWN Subroutine
	while ($2WARP_CHECKED[$FOCUS] = 0) AND (SECTOR.WARPCOUNT[$FOCUS] = 2)
		setVar $2WARP_CHECKED[$FOCUS] TRUE
		add $length 1
		setVar $TUNNEL_TEMP $Figs[$FOCUS]
		if ($TUNNEL_TEMP > 0)
			add $NUM_FIGS 1
		end
		if ($Add_Focus = "LEFT")
			setVar $TUNNEL_COURSE $FOCUS & #196 & $TUNNEL_COURSE
		elseif ($Add_Focus = "RIGHT")
			setVar $TUNNEL_COURSE $TUNNEL_COURSE & #196 & $FOCUS
		end
		setVar $TUNNEL_ADJ SECTOR.WARPS[$FOCUS][1]
		if ($2WARP_CHECKED[$TUNNEL_ADJ] = 1)
			setVar $TUNNEL_ADJ SECTOR.WARPS[$FOCUS][2]
		end
		getDistance $DIST_2_ADJ $TUNNEL_ADJ $FOCUS
		if ($DIST_2_ADJ > 1)
			return
		end
		setVar $FOCUS $TUNNEL_ADJ
	end
	return
:padsectcnt
	if ($2BPadded < 10)
		SetVar $Padded "   " & $2BPadded
	elseif ($2BPadded < 100)
		SetVar $Padded "  " & $2BPadded
	elseif ($2BPadded < 1000)
		SetVar $Padded " " & $2BPadded
	else
		SetVar $Padded $2BPadded
	end
	return
:padpercentile
	if ($2BPPadded < 10)
    	SetVar $PPadded "  " & $2BPPadded
    elseif ($2BPPadded < 100)
    	SetVar $PPadded " " & $2BPPadded
	elseif ($2BPPadded < 100)
		SetVar $PPadded 100
	end
	return

:Make_List
	setVar $idx 			11
	setArray $Results		SECTORS
	setVar $RESULT			0

	if ($LINE1 = $SELECTED)
		#					----------={    DeadEnds
		Echo $TagLineB &" Processing " & ANSI_12 & "UnFig'd DeadEnds" & ANSI_15 & ", Please Stand By...*"
		while ($idx <= SECTORS)
			if ((SECTOR.WARPCOUNT[$idx] = 1) and ($Figs[$idx] = 0))
				setVar $Results[$idx] 1
				add $RESULT 1
			end
        	add $idx 1
		end
	elseif ($LINE2 = $SELECTED)
		#					----------={	Fill Universe
		Echo $TagLineB &" Processing " & ANSI_12 & "All UnFig'd Sectors" & ANSI_15 & ", Please Stand By...*"
		while ($idx <= SECTORS)
			if ($Figs[$idx] = 0)
				if (($idx <> STARDOCK) AND ($idx > 10))
					setVar $Results[$idx] 1
					add $RESULT 1
				end
			end
        	add $idx 1
		end
	elseif ($LINE3 = $SELECTED)
		#					----------={    Fill Holes
		Echo $TagLineB &" Processing " & ANSI_12 & "Holes In The Grid" & ANSI_15 & ", Please Stand By...*"
		while ($idx <= SECTORS)
			if (SECTOR.WARPCOUNT[$idx] > 1)
				if ($Figs[$IDX] = 0)
					setVar $adj 1
					while ($adj <= SECTOR.WARPCOUNT[$idx])
						SetVar $adjSector SECTOR.WARPS[$idx][$adj]
						if ($Figs[$adjSector] = 0)
							goto :NextHole_Here
						end
						add $adj 1
					end
					setVar $Results[$idx] 1
					add $RESULT 1
				end
			end
			:NextHole_Here
			add $idx 1
		end
	elseif ($LINE4 = $SELECTED)
		#					----------={	Orphan Fighters
		Echo $TagLineB &" Processing " & ANSI_12 & "Fighters w/o A Friendly Adj" & ANSI_15 & ", Please Stand By...*"
		while ($idx <= SECTORS)
			SetVar $adj 1
			if (SECTOR.WARPCOUNT[$idx] >= 1)
				if ($Figs[$idx] > 0)
					while ($adj <= SECTOR.WARPCOUNT[$idx])
						SetVar $adjSector SECTOR.WARPS[$idx][$adj]
						if ($Figs[$adjSector] > 0)
							goto :NextOrph_Here
						end
						add $adj 1
					end
					if (($adjSector > 10) AND ($adjSector <> STARDOCK))
						setVar $Results[$adjSector] 1
		    			add $RESULT 1
		    		end
	    		end
			end
			:NextOrph_Here
			add $idx 1
		end
	elseif ($LINE5 = $SELECTED)
		#					----------={	Existing Grid
		Echo $TagLineB &" Processing " & ANSI_12 & "Existing Grid" & ANSI_15 & ", Please Stand By...*"
		while ($idx <= SECTORS)
			if ($Figs[$idx] <> 0)
				setVar $Results[$idx] 1
            	add $RESULT 1
            end
        	add $idx 1
		end
	elseif ($LINE6 = $SELECTED)
		#					----------={    Tunnels
		Echo $TagLineB &" Processing " & ANSI_12 & "Processing UnFig'd Tunnels" & ANSI_15 & ", Please Stand By...*"
		setArray $2WARP_CHECKED 	SECTORS
		setVar $WARP_PTR 			11
		while ($WARP_PTR <= SECTORS)
			if ((SECTOR.WARPCOUNT[$WARP_PTR] = 2) and ($2WARP_CHECKED[$WARP_PTR] = 0))
				setArray $TUNNEL_TARGETS		30
				setVar $TUNNEL_TARGETS_idx		0
				setVar $length 					1
				setVar $2WARP_CHECKED[$WARP_PTR] 1
				setVar $FOCUS 					$WARP_PTR
				setVar $TUNNEL_COURSE 			$FOCUS
				setVar $NUM_FIGS 				0

				setVar $TUNNEL_TEMP $Figs[$WARP_PTR]
				if ($TUNNEL_TEMP = 0)
					add $TUNNEL_TARGETS_idx 1
		            setVar $TUNNEL_TARGETS[$TUNNEL_TARGETS_idx] $FOCUS
				end

				setVar $FOCUS SECTOR.WARPS[$WARP_PTR][1]
				getDistance $DIST_2_ADJ $FOCUS $WARP_PTR

				if ($DIST_2_ADJ = 1)
					gosub :WALK_THE_LINE2
				end
				setVar $FOCUS SECTOR.WARPS[$WARP_PTR][2]
				getDistance $DIST_2_ADJ $FOCUS $WARP_PTR
				if ($DIST_2_ADJ = 1)
					gosub :WALK_THE_LINE2
				end
				if ($length >= $MIN_TUNNEL_LENG)
					if ($Figs[$WARP_PTR] = 0)
						setVar $Results[$WARP_PTR] 1
		            	add $RESULT 1
					end

					if ($TUNNEL_TARGETS_idx > 0)
						while ($TUNNEL_TARGETS_idx > 0)
							setVar $TUNNEL_NUL $TUNNEL_TARGETS[$TUNNEL_TARGETS_idx]
							setVar $Results[$TUNNEL_NUL] 1
			            	add $RESULT 1
                        	subtract $TUNNEL_TARGETS_idx 1
						end
					end
				end
			end
			add $WARP_PTR 1
		end
	elseif ($LINE7 = $SELECTED)
		#					----------={	Proximal
		Echo $TagLineB &" Processing "&ANSI_12&"Proximal Target To "&$PROXIMITY&ANSI_15&", Please Stand By...*"
		setVar $prox_depth			1
		setVar $prox_currentTA		$PROXIMITY
		setArray $proxchecked		SECTORS
		setArray $proxque 			SECTORS
		setArray $proxquecopy 		SECTORS
		setVar $prox_top			0
		setVar $prox_idx			1
		setVar $prox_idxTop			1
		setVar $prox_maxdepth		$PROXIMITY_Dist
		setVar $proxquecopy[1] 		$prox_currentTA
		setVar $stat_Proximal		0
		setVar $stat_Guarding		0
		while ($prox_depth <= $prox_maxdepth)
			while ($prox_idx <= $prox_idxtop)
				setVar $prox_focus $proxquecopy[$prox_idx]
				gosub :getadjacents
	            add $prox_idx 1
			end
			setVar $prox_i 1
			while ($prox_i <= $prox_top)
				setVar $proxquecopy[$prox_i] $proxque[$prox_i]
				add $prox_i 1
			end
			setVar $prox_idx 1
			setVar $prox_idxtop $prox_top
			setVar $prox_top 0
			add $prox_depth 1
		end

	elseif ($LINE8 = $SELECTED)
		#					----------={	Sector Warps
		Echo $TagLineB &" Processing "&ANSI_12&$WARPS&"-Way Sectors"& ANSI_15&", Please Stand By...*"
		while ($idx <= SECTORS)
			if ($WARPS = SECTOR.WARPCOUNT[$idx])
				if ($Figs[$idx] = 0)
					setVar $Results[$idx] 1
	            	add $RESULT 1
                end
			end
			add $idx 1
		end
	elseif ($LINE9 = $SELECTED)
		if ($CORP_FIGS <> 0)
			Echo $TagLineB &" Processing "&ANSI_12&"Known Corp #"&$CORP_FIGS&" Sectors"& ANSI_15&", Please Stand By...*"
			while ($idx <= SECTORS)
				if ($Figs[$idx] = 0)
					setVar $temp SECTOR.FIGS.OWNER[$idx]
					getWordPos $temp $pos "Corp#"&$CORP_FIGS
					if ($pos <> 0)
						setVar $Results[$idx] 1
						add $RESULT 1
					end
				end
				add $idx 1
			end
		end
	end
	return

:WALK_THE_LINE2
	while ($2WARP_CHECKED[$FOCUS] = 0) AND (SECTOR.WARPCOUNT[$FOCUS] = 2)
		setVar $2WARP_CHECKED[$FOCUS] TRUE
		add $length 1
		setVar $TUNNEL_TEMP $Figs[$FOCUS]
		if ($TUNNEL_TEMP = 0)
			add $TUNNEL_TARGETS_idx 1
			setVar $TUNNEL_TARGETS[$TUNNEL_TARGETS_idx] $FOCUS
		end
		setVar $TUNNEL_ADJ SECTOR.WARPS[$FOCUS][1]
		if ($2WARP_CHECKED[$TUNNEL_ADJ] = 1)
			setVar $TUNNEL_ADJ SECTOR.WARPS[$FOCUS][2]
		end
		getDistance $DIST_2_ADJ $TUNNEL_ADJ $FOCUS
		if ($DIST_2_ADJ > 1)
			return
		end
		setVar $FOCUS $TUNNEL_ADJ
	end
	return

:getadjacents
   	setVar $prox_adj 1
	while ($prox_adj <= SECTOR.WARPCOUNT[$prox_focus])
		setVar $sector SECTOR.WARPS[$prox_focus][$prox_adj]
		if ($proxchecked[$sector] = 0)
			add $prox_top 1
			setVar $proxque[$prox_top] $sector
			setVar $proxchecked[$sector] 1
			if ($Figs[$sector] = 0)
				setVar $Results[$sector] 1
	           	add $RESULT 1
   			end
		end
		add $prox_adj 1
	end
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

:Find_Farthest
	setVar $idx2 		11
	setVar $idx2Limitor	0
	setVar $Dist_val	0
	setVar $Dist_ptr	0

	while (($idx2 <= SECTORS) AND ($idx2Limitor < 100)
		if ($Results[$idx2] <> 0)
        	getDistance $dist $idx $idx2
			if ($dist > $Dist_val)
				setVar $Dist_val $dist
				setVar $Dist_ptr $idx2
			end
			add $idx2Limitor 1
		end
		add $idx2 1
	end
	return

:Help_Me
	Echo "***"
	Echo (ANSI_7&"                  LoneStar's Grid Maker  Version " &$TagVersionMinor&"*")
	Echo ("              "&ANSI_15&#196&#196&ANSI_7&#196&ANSI_8&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&#196&ANSI_7&#196&ANSI_15&#196&#196)
	Echo "*"
	Echo (ANSI_15&"  This is a very simple Grid Targetting List Generator, should work with*")
	Echo (ANSI_15&"  all versions of TWX. Some of the routines are the result of studying*")
	Echo (ANSI_15&"  Elder Prophet's Breadth-First search example. A complete Sector Map is*")
	Echo (ANSI_15&"  preferable for best results; some options do not require it. Can be*")
	Echo (ANSI_15&"  ran while offline. Reads M()M fighter file, or if not found, will read*")
	Echo (ANSI_15&"  Cherokee's fighter file.*")
	Echo "**"
	Echo (ANSI_6&" DeadEnds"&ANSI_15&"          All Dead Ends that have no Fighter deployed*")
	Echo "*"
	Echo (ANSI_6&" Fill Universe"&ANSI_15&"     All sectors that do not have a Fighter deployed*")
	Echo "*"
	Echo (ANSI_6&" Fill Holes"&ANSI_15&"        Returns a list of Gridding Targets that are themselves*")
	Echo (ANSI_15&"                   surrounded with friendly Fighters --includes Dead Ends*")
	Echo "*"
	Echo (ANSI_6&" Orphan Fighters"&ANSI_15&"   Returns a list of deployed Fighters that do not have a*")
	Echo (ANSI_15&"                   adjacent friendly Fighter deployed.*")
	Echo "*"
	Echo (ANSI_6&" Existing Grid"&ANSI_15&"     Returns a list of already gridded sectors.*")
	Echo "*"
	Echo (ANSI_6&" Tunnels"&ANSI_15&"           Gridding Targets that are in tunnels minimum of 3 three*")
	Echo (ANSI_15&"                   sectors in length.*")
	Echo "*"
	Echo (ANSI_6&" Proximal"&ANSI_15&"          Set a center point, and a list of all sectors that have*")
	Echo (ANSI_15&"                   no firendly fighters deployed within a specified distance*")
	Echo "*"
	Echo (ANSI_6&" Sector Warps"&ANSI_15&"      Returns a list of all "&ANSI_14&"1"&ANSI_15&","&ANSI_14&" 2"&ANSI_15&","&ANSI_14&" 3"&ANSI_15&","&ANSI_14&" 4"&ANSI_15&","&ANSI_14&" 5"&ANSI_15&","&ANSI_14&" 6"&ANSI_15&", way sectors that*")
	Echo (ANSI_15&"                   have no firendly Fighter deployed.*")
	Echo "*"
	Echo (ANSI_6&" Corp Targetting"&ANSI_15&"   Searches TWX DBase and returns a list of sectors that*")
	Echo (ANSI_15&"                   belong to any given Corporation.*")
	Echo "*"
	Echo (ANSI_6&" List Order"&ANSI_15&"        A Toggel setting can be: "&ANSI_14&"Ascending"&ANSI_15&","&ANSI_14&" Descending"&ANSI_15&","&ANSI_14&" Random"&ANSI_15&",*")
	Echo (ANSI_15&"                   "&ANSI_14&"Ore Waster"&ANSI_15&".  The Ore-Waster generates a list of targets as*")
	Echo (ANSI_15&"                   far as possible from each other; usually 10 to 15 hops apart.*")
	Echo "*"
	Echo (ANSI_6&" Limit Results"&ANSI_15&"     Some options require alot of processing (ie Ore-Waster),*")
	Echo (ANSI_15&"                   making a list, for example,  of 100 Targets at a time can*")
	Echo (ANSI_15&"                   significantly reduce processing times*")
	Echo "*"
	Echo (ANSI_6&" OutPut File Name"&ANSI_15&"  Default is: "&ANSI_14&"c:\123.txt"&ANSI_15&", name and path of where the output*")
	Echo (ANSI_15&"                   file will be written. Previous file, if exists, will be*")
	Echo (ANSI_15&"                   deleted.*")
	Echo "*"
	Echo (ANSI_6&" View Grid Status"&ANSI_15&"  Scans existing Grid and generates an overview report of*")
	Echo (ANSI_15&"                   current Grid Status. This is includes Tunnels, Holes, and*")
	Echo (ANSI_15&"                   Orphaned Sectors.*")
	Echo "*"
	Echo (ANSI_6&" Generate Results"&ANSI_15&"  Simply generates results as selected in the menu and displays*")
	Echo (ANSI_15&"                   the number of Gridding Targets found.*")
	Echo "*"
	Echo (ANSI_6&" Write File"&ANSI_15&"        Will output results as described above. Will not generate*")
	Echo (ANSI_15&"                   results if they've already been generated.*")
	Echo "**"
	return