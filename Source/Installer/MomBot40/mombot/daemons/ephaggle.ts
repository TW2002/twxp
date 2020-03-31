systemscript

// Author Elder Prophet - Incredible coding and research went into this script.  All credit to him.

// Brought to you by Shadow's CTS Decompiler 2.0

setvar $verbose_debug_mode false
setvar $paused_debug_mode false
setvar $VERSION 2019
setvar $SIGLINE "EP's Perfect Haggle, v. " & $VERSION


gosub :BOT~loadVars
loadvar $GAME~ptradesetting

setvar $bot~command "ephaggle"
setVar $BOT~help[1]  $BOT~tab&"ephaggle {blue|worst} {planet"
setVar $BOT~help[2]  $BOT~tab&"  Best haggle routine "
setVar $BOT~help[3]  $BOT~tab&"      Options:  "
setVar $BOT~help[4]  $BOT~tab&"             blue   - haggle without gaining experience "
setVar $BOT~help[5]  $BOT~tab&"             worst  - get the worst price possible "
setVar $BOT~help[5]  $BOT~tab&"             planet - do planet negotiation too "
setVar $BOT~help[6]  $BOT~tab&"       "
setVar $BOT~help[7]  $BOT~tab&"      Default is normal haggle "
setVar $BOT~help[8]  $BOT~tab&"       "
setVar $BOT~help[9]  $BOT~tab&"      Author: Elder Prophet "
gosub :bot~helpfile


setvar $MAXPTRADE 0
setvar $folder "scripts/mombot/games/"&GAMENAME
setvar $MCICFILENAME $folder&"/mcic.csv"
setvar $HAHTOGGLE "Off"
setvar $WPTOGGLE "Off"
setvar $game~mbbsTOGGLE "Off"
#setvar $game~ptradesetting 100
setvar $bot~bluehaggle false
setvar $SWATHBIDCAP "On"
setvar $HAGGLESTAT "Active"


#addmenu "" "haggle" "Haggle Options" "." "" "Haggle" FALSE
#addmenu "haggle" "Execute" #27 & "[1;33mContinue" ";" :CONTINUE "" TRUE
#addmenu "haggle" "Haggle and Hold" "Haggle and Hold" 1 :HAHTOGGLE "" FALSE
#addmenu "haggle" "Worst Price" "Worst Price" 2 :WPTOGGLE "" FALSE
#addmenu "haggle" "MBBS Mode" "MBBS Mode" 3 :MBBSTOGGLE "" FALSE
#addmenu "haggle" "PTrade%" "Planetary Trade %" 4 :SETPTRADE% "" FALSE
#addmenu "haggle" "Blue Haggle" "Blue Haggle" 5 :SETBLUEHAGGLE "" FALSE
#addmenu "haggle" "Swath Offer Capture" "Swath Offer Capture" 6 :SETSWATHBIDCAP "" FALSE
#addmenu "haggle" "Haggle Toggle" "Haggle Toggle" 7 :HAGGLESTAT "" FALSE
#addmenu "haggle" "QueryPort" "Query DB for Current Port Info" 9 :QUERYPORT "" FALSE
#addmenu "haggle" "Import Parms" "Import Sector Parms From file" "i" :IMPORTPARMSFROMFILE "" FALSE
#addmenu "haggle" "Write Parms" "Write Sector Parms to file" "w" :WRITEPARMS2FILE "" FALSE


:CONTINUE
	#setvar $bot~bluehaggle true
	#setvar $bot~haggleandhold true
	#setvar $bot~worstprice 0
	#setvar $game~mbbs 0
	
	loadvar $bot~bluehaggle
	loadvar $bot~worstprice

	if ($bot~bluehaggle)
		setvar $bot~worstprice false
		savevar $bot~worstprice
	elseif ($bot~worstprice)
		setvar $bot~bluehaggle false
		savevar $bot~bluehaggle
	end

	getwordpos " "&$bot~user_command_line&" " $pos " blue"
	getwordpos " "&$bot~user_command_line&" " $pos2 " worst"
	if ($pos > 0)
		setvar $bot~worstprice false
		savevar $bot~worstprice
		setvar $bot~bluehaggle true
		savevar $bot~bluehaggle
	elseif ($pos2 > 0)
		setvar $bot~worstprice true
		savevar $bot~worstprice
		setvar $bot~bluehaggle false
		savevar $bot~bluehaggle
	else
		setvar $bot~worstprice false
		savevar $bot~worstprice
		setvar $bot~bluehaggle false
		savevar $bot~bluehaggle
	end

	getwordpos " "&$bot~user_command_line&" " $pos " planet "
	if ($pos > 0)
		setvar $bot~planettrade true
	else
		setvar $bot~planettrade false
	end

	loadVar $GAME~mbbs
	loadvar $GAME~ptradesetting



setprecision 2
setvar $planet~planettrade_ratio ($game~ptradesetting / 100)
setprecision 0

killalltriggers
setvar $line CURRENTANSILINE
gosub :player~quikstats

setvar $exp $player~experience
setvar $sector player~current_sector

if ($bot~bluehaggle)
	setvar $tag "Blue Haggle"
elseif ($bot~worstprice)
	setvar $tag "Worst Haggle"
else
	setvar $tag "Normal Haggle"
end

if ($bot~planettrade)
	setvar $tag $tag&"  - Planet trade mode as well"
end

setvar $switchboard~message "EP Perfect Haggle loaded - "&$tag&"*"
gosub :switchboard~switchboard
goto :waittoport


:CLSECTORNUM
gettext CURRENTLINE $SECTOR "]:[" "] (?"
goto :WAITTOPORT

:WAITTOPORT
killalltriggers
setarray $average_price_per_hold 0
setarray $price_ratio_per_hold 0
setarray $LHTEYH 0
if ($HAGGLESTAT = "Active")
	settexttrigger SECTOR :GETSECTOR "] (?=Help)? :"
	settextlinetrigger QUICKSTAT :QUICKSTAT #179 & "Exp "
	settextlinetrigger TRACKEXP :TRACKEXP "experience point(s)"
	settextlinetrigger GETDAY :GETDAY "Commerce report for"
	pause
	goto :48
end
pause

:48

:GETSECTOR
gettext CURRENTLINE $SECTOR "]:[" "] (?"
settexttrigger SECTOR :GETSECTOR "] (?=Help)? :"
pause

:QUICKSTAT
settextlinetrigger QUICKSTATEXP :QUICKSTATEXP "Exp "
pause

:QUICKSTATEXP
getword CURRENTLINE $RANK 1
if ($RANK = "Rank")
	getword CURRENTLINE $player~experience 5
	striptext $player~experience ","
	goto :50
end
setvar $TEMP CURRENTLINE & #179
gettext $TEMP $TEMP "Exp" #179
striptext $TEMP ","
striptext $TEMP " "
isnumber $YN $TEMP
if ($YN = 1)
	setvar $player~experience $TEMP
end

:50
settextlinetrigger QUICKSTAT :QUICKSTAT #179 & "Turns "
pause

:TRACKEXP
setvar $LINE CURRENTLINE
setvar $WORD 0
setvar $I 0

:53
if ($WORD <> "EXPERIENCE") and ($I < 20)
	add $I 1
	getword $LINE $WORD $I
	uppercase $WORD
	goto :53
end
getword $LINE $player~experience_increase (($I -1))
getword $LINE $LOSEGAIN (($I -2))
uppercase $LOSEGAIN
if ($LOSEGAIN = "LOSE")
	subtract $player~experience $player~experience_increase
	goto :56
end
isnumber $TRUE $player~experience_increase
if ($TRUE)
	add $player~experience $player~experience_increase
end

:56
round $player~experience 0
settextlinetrigger TRACKEXP :TRACKEXP "experience point(s)"
pause

:GETDAY
killtrigger "TRACKEXP"
getword CURRENTLINE $FOR 3
if ($FOR = "for:")
	goto :WAITTOPORT
end
getword CURRENTLINE $AMPM 6
setvar $I 7

while (($AMPM <> "AM") and ($AMPM <> "PM"))
	getword CURRENTLINE $AMPM $I
	add $I 1
end
getword CURRENTLINE $WEEKDAY $I
settexttrigger PORTING :GETPORTINFO "-=-=-        Docking Log        -=-=-"
pause

:GETPORTINFO
setvar $WORD 3
settextlinetrigger EXP :NEGLECTEDPORT "neglected port"
settextlinetrigger EXP2 :NEGLECTEDPORT "unused port"
settextlinetrigger FUELINFO :PRODUCTINFO "Fuel Ore"
settextlinetrigger ORGSINFO :PRODUCTINFO "Organics"
settextlinetrigger EQUIPINFO :PRODUCTINFO "Equipment"
settextlinetrigger STARTCREDITS :STARTCREDITS "credits"
pause

:NEGLECTEDPORT
killtrigger "EXP"
killtrigger "EXP2"
getword CURRENTLINE $player~experience_increase 8
if ($verbose_debug_mode = TRUE)
	setvar $switchboard~message ANSI_14&"*EXP added: "&$player~experience_increase
	gosub :bot~echo
end
add $player~experience $player~experience_increase
round $player~experience 0
pause

:PRODUCTINFO
getword CURRENTLINE $PRODUCT 1
uppercase $PRODUCT
getword CURRENTLINE $BUYSELL[$PRODUCT] $WORD
uppercase $BUYSELL[$PRODUCT]
getword CURRENTLINE $PORTQTY[$PRODUCT] (($WORD + 1))
getword CURRENTLINE $PERCENT[$PRODUCT] (($WORD + 2))
striptext $PERCENT[$PRODUCT] "%"
getword CURRENTLINE $ONBOARD[$PRODUCT] (($WORD + 3))
setvar $WORD 2
pause

:STARTCREDITS
killalltriggers
setvar $FINALOFFER 0
if ($bot~planettrade)
	settextlinetrigger PLANETTRADE :PLANETTRADE "How many units"
end
settextlinetrigger SHIPTRADE :SHIPTRADE "How many holds"
settexttrigger DONE :WAITTOPORT "Command [TL"
pause

:PLANETTRADE
killalltriggers
setvar $planet~planetSHIP "PLANET"
setvar $variance 0
setvar $ROLLHH 0
setvar $PLRYHH 0
setvar $EDDHPO 0
setvar $PELHOH 0
goto :BUYSELL

:SHIPTRADE
killalltriggers
setvar $planet~planetSHIP "SHIP"
setvar $variance "-.003"
setvar $ROLLHH "-.003"
setvar $PLRYHH ".003"

:BUYSELL
getword CURRENTLINE $PRODUCT 5
uppercase $PRODUCT
setvar $BUYSELL $BUYSELL[$PRODUCT]
if ($BUYSELL = "SELLING")
	setvar $PLUSMINUS "-1"
	goto :66
end
setvar $PLUSMINUS 1

:66
if ($bot~planettrade)
	settextlinetrigger PLANETTRADE :PLANETTRADE "How many units"
end
settextlinetrigger SHIPTRADE :SHIPTRADE "How many holds"
settexttrigger DONE :WAITTOPORT "Command [TL"
settextlinetrigger TRADEQTY :TRADEQTY "Agreed,"
pause

:TRADEQTY
killalltriggers
getword CURRENTLINE $holds_to_trade 2
striptext $holds_to_trade ","
settextlinetrigger BUYOFFER :INITOFFER "We'll buy them for"
settextlinetrigger SELLOFFER :INITOFFER "We'll sell them for"
pause

:INITOFFER
killalltriggers
if ($PERCENT[$PRODUCT] = 0)
	getsectorparameter $SECTOR $PRODUCT & "L" $TEMPPROD1
	getsectorparameter $SECTOR $PRODUCT & "H" $TEMPPROD2
	if ($TEMPPROD1 = 0) or ($TEMPPROD2 = 0)
		setvar $switchboard~message "*Can not derive values when Percentage is 0 and Productivity is unknown.*Complete haggling manually."
		gosub :bot~echo
		send "*"
		killalltriggers
		settextlinetrigger STARTCREDITS :STARTCREDITS "credits"
		settextlinetrigger GOODTRADE :GOODTRADE "For your good trading"
		settextlinetrigger GREATTRADE :GOODTRADE "For your great trading"
		settexttrigger DONE :WAITTOPORT "Command [TL"
		if ($bot~planettrade)
			settextlinetrigger PLANETTRADE :PLANETTRADE "How many units"
		end
		settextlinetrigger SHIPTRADE :SHIPTRADE "How many holds"
		pause
	end
end
setarray $BID 0
getword CURRENTLINE $OFFER 5
settexttrigger PARSEINITOFFER :PARSEINITOFFER "]"
pause

:PARSEINITOFFER
striptext $OFFER ","
striptext $OFFER "["
striptext $OFFER "]"
striptext $OFFER "?"
setvar $BID 1
setvar $BID[$BID] $OFFER
setvar $BUYSELL $BUYSELL[$PRODUCT]
setvar $PORTQTY $PORTQTY[$PRODUCT]
setvar $PERCENT $PERCENT[$PRODUCT]

:CONTROL
gosub :PREPARE
gosub :SETVARS
gosub :START
gosub :BID

:PREPARE
gettime $STARTTIME
setprecision 0
setvar $average_price_per_hold[FUEL] "25.5"
setvar $average_price_per_hold[ORGANICS] "50.5"
setvar $average_price_per_hold[EQUIPMENT] "90.5"
setvar $price_ratio_per_hold[FUEL] "0.25"
setvar $price_ratio_per_hold[ORGANICS] "0.5"
setvar $price_ratio_per_hold[EQUIPMENT] "0.9"
setvar $low_mcic_guess[FUEL] 40
setvar $high_mcic_guess[FUEL] 90
setvar $low_mcic_guess[ORGANICS] 30
setvar $high_mcic_guess[ORGANICS] 75
setvar $low_mcic_guess[EQUIPMENT] 20
setvar $high_mcic_guess[EQUIPMENT] 65
if ($planet~planetSHIP = "PLANET")
	setvar $variance 0
	setvar $ROLLHH 0
	setvar $PLRYHH 0
	setarray $HHDYOR 0
	setvar $EDDHPO 0
	setvar $PELHOH 0
	setvar $under_1000_experience_rate 0
	goto :74
end
setvar $variance "-0.003"
setvar $ROLLHH "-0.003"
setvar $PLRYHH "0.003"
if ($WEEKDAY = "Mon")
	setvar $EDDHPO 0
	setvar $PELHOH 5
	goto :76
end
if ($WEEKDAY = "Tue")
	setvar $EDDHPO 7
	setvar $PELHOH 7
	goto :76
end
if ($WEEKDAY = "Wed")
	setvar $EDDHPO 10
	setvar $PELHOH 15
	goto :76
end
if ($WEEKDAY = "Thu")
	setvar $EDDHPO 9
	setvar $PELHOH 9
	goto :76
end
if ($WEEKDAY = "Fri")
	setvar $EDDHPO 11
	setvar $PELHOH 12
	goto :76
end
if ($WEEKDAY = "Sat")
	setvar $EDDHPO 11
	setvar $PELHOH 18
	goto :76
end
if ($WEEKDAY = "Sun")
	setvar $EDDHPO 10
	setvar $PELHOH 12
	goto :76
end
setvar $switchboard~message "*GetDay failed, $weekday captured is:"&$WEEKDAY&"*halting..."
gosub :bot~echo
halt

:76

:74
return

:SETVARS
setprecision 15
setvar $ODHPTH $average_price_per_hold[$PRODUCT]
setvar $price_ratio_per_hold $price_ratio_per_hold[$PRODUCT]
setvar $base_var $EDDHPO
if ($BUYSELL = "SELLING")
	setvar $PLUSMINUS "-1"
	setvar $EHYLOD 1
	goto :84
end
if ($BUYSELL = "BUYING")
	setvar $PLUSMINUS 1
	setvar $EHYLOD "-1"
end

:84
getsectorparameter $SECTOR $PRODUCT & "L" $LOWPRODUCTIVITY
getsectorparameter $SECTOR $PRODUCT & "H" $HIGHPRODUCTIVITY
if ($verbose_debug_mode = TRUE)
	setvar $switchboard~message "*LowProductivity (Saved) = "&$LOWPRODUCTIVITY
	gosub :bot~echo
	setvar $switchboard~message "*HighProductivity (Saved) = "&$HIGHPRODUCTIVITY
	gosub :bot~echo
end
isnumber $isnumber $LOWPRODUCTIVITY
if ($isnumber <> true)
	setvar $LOWPRODUCTIVITY 0
end
isnumber $isnumber $HIGHPRODUCTIVITY
if ($isnumber <> true)
	setvar $HIGHPRODUCTIVITY 0
end
if ($PERCENT = 100)
	setvar $HHREPP ($PORTQTY / 10)
	round $HHREPP 0
	setvar $MAXPRODUCTIVITY $HHREPP
	setvar $LOWPRODUCTIVITY $HHREPP
	if ($productivity <= 0)
		setvar $productivity $LOWPRODUCTIVITY
	end
	setvar $HIGHPRODUCTIVITY $HHREPP
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Percent=100, Productivity="&$PRODUCTIVITY
		gosub :bot~echo
	end
	goto :93
end
if ($PERCENT = 0)
	if ($LOWPRODUCTIVITY = "") or ($HIGHPRODUCTIVITY = "")
		setvar $switchboard~message "*Unable to determine MCIC when Percentage is zero, complete haggle by hand.*"
		gosub :bot~echo
		settextlinetrigger STARTCREDITS :STARTCREDITS "credits"
		settextlinetrigger GOODTRADE :GOODTRADE "For your good trading"
		settextlinetrigger GREATTRADE :GOODTRADE "For your great trading"
		settexttrigger DONE :WAITTOPORT "Command [TL"
		if ($bot~planettrade)
			settextlinetrigger PLANETTRADE :PLANETTRADE "How many units"
		end
		settextlinetrigger SHIPTRADE :SHIPTRADE "How many holds"
		pause
	end
	setvar $HHREPP $LOWPRODUCTIVITY
	setvar $MAXPRODUCTIVITY $HIGHPRODUCTIVITY
	goto :93
end
setvar $HHREPP (($PORTQTY * 10) / ($PERCENT + ".9999999999"))
round $HHREPP 0
setvar $MAXPRODUCTIVITY ((($PORTQTY / $PERCENT) * 10) -".4999999999")
round $MAXPRODUCTIVITY 0
if ($MAXPRODUCTIVITY > 3276) and ($game~mbbs = 1)
	setvar $MAXPRODUCTIVITY 3276
	goto :100
end
if ($MAXPRODUCTIVITY > 6553) and ($game~mbbs = 0)
	setvar $MAXPRODUCTIVITY 6553
end

:100
if ($LOWPRODUCTIVITY < $HHREPP)
	setvar $LOWPRODUCTIVITY $HHREPP
end
if ($HIGHPRODUCTIVITY = 0) or ($MAXPRODUCTIVITY < $HIGHPRODUCTIVITY)
	setvar $HIGHPRODUCTIVITY $MAXPRODUCTIVITY
end

:93
setsectorparameter $SECTOR $PRODUCT & "L" $LOWPRODUCTIVITY
setsectorparameter $SECTOR $PRODUCT & "H" $HIGHPRODUCTIVITY
setvar $ERYTLO ""
getsectorparameter $SECTOR $PRODUCT & "-" $low_mcic_guess
getsectorparameter $SECTOR $PRODUCT & "+" $high_mcic_guess
isnumber $YN1 $low_mcic_guess
isnumber $YN2 $high_mcic_guess
if ($YN1) and ($YN2)
	if (($low_mcic_guess * $EHYLOD) < $low_mcic_guess[$PRODUCT]) or (($low_mcic_guess * $EHYLOD) > $high_mcic_guess[$PRODUCT]) or (($high_mcic_guess * $EHYLOD) < $low_mcic_guess[$PRODUCT]) or (($high_mcic_guess * $EHYLOD) > $high_mcic_guess[$PRODUCT])
		if ($verbose_debug_mode = TRUE)
			setvar $switchboard~message "*Invalid Parameter previously saved for Sector "&$SECTOR
			gosub :bot~echo
			setvar $switchboard~message "mcicMin was <"&$low_mcic_guess&">   mcicMax was <"&$high_mcic_guess&">    Resetting."
			gosub :bot~echo
		end
		setsectorparameter $SECTOR $PRODUCT & "-" ""
		setsectorparameter $SECTOR $PRODUCT & "+" ""
		setvar $low_mcic_guess ""
		setvar $high_mcic_guess ""
	end
end
if ($low_mcic_guess <> "") and ($high_mcic_guess <> "")
	if ($low_mcic_guess = $high_mcic_guess)
		if ($verbose_debug_mode = TRUE)
			setvar $switchboard~message "*Using saved MCIC of "&$low_mcic_guess
			gosub :bot~echo
		end
		goto :115
	end
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Using saved MCIC values: "&$low_mcic_guess&" - "&$high_mcic_guess
		gosub :bot~echo
	end

:115
	goto :113
end
setvar $high_mcic_guess ($EHYLOD * $high_mcic_guess[$PRODUCT])
round $high_mcic_guess 0
setvar $low_mcic_guess ($EHYLOD * $low_mcic_guess[$PRODUCT])
round $low_mcic_guess 0

:113
return

:START
setvar $FAILED 0
gettime $STARTTIME
isnumber $YN $player~experience
if ($YN = 0)
	setvar $switchboard~message "*At START, but $exp is not a number, pausing..."
	gosub :bot~echo
	pause
end
if ($player~experience > 999) or ($planet~planetSHIP = "PLANET")
	setvar $under_1000_experience_rate 0
	goto :123
end
setvar $under_1000_experience_rate ($PLUSMINUS * ((1000 -$player~experience) / 100))

:123
setprecision 15
setvar $OEYROT ((($ODHPTH + ($PLUSMINUS * $PELHOH)) -$under_1000_experience_rate) -((($high_mcic_guess[$PRODUCT] * $price_ratio_per_hold[$PRODUCT]) * $PORTQTY) / ($HHREPP * 10)))
setvar $LEDREO (($HIGHPRODUCTIVITY -$LOWPRODUCTIVITY) + 1)
round $LEDREO 0
if ($LEDREO > 10) and ($planet~planetSHIP = "SHIP")
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Productivity range = "&ANSI_12&$LEDREO&ANSI_10&", using LowPercent routine*"
		gosub :bot~echo
	end
	gosub :LOWPERCENT
	goto :125
end
if ($verbose_debug_mode = TRUE)
	setvar $switchboard~message "*Productivity range = "&ANSI_12&$LEDREO&ANSI_10&", using Conventional routine*"
	gosub :bot~echo
end
gosub :CONVENTIONAL

:125
setvar $variance 0
setvar $base_var 0
setvar $price_ratio_per_hold 0
setvar $ODHPTH 0
setarray $average_price_per_hold 0
setarray $price_ratio_per_hold 0
return

:GOODTRADE
killtrigger "GOODTRADE"
killtrigger "GREATTRADE"
getword CURRENTLINE $player~experience_increase 7
add $player~experience $player~experience_increase
round $player~experience 0
pause

:FINALOFFER
setvar $FINALOFFER 1

:COUNTEROFFER
killtrigger "BUYOFFER"
killtrigger "SELLOFFER"
killtrigger "FINALOFFER"
killtrigger "STARTCREDITS"
killtrigger "GOODTRADE"
killtrigger "GREATTRADE"
killtrigger "DONE"
killtrigger "PLANETTRADE"
killtrigger "SHIPTRADE"
getword CURRENTLINE $OFFER 5
settexttrigger PARSECOUNTEROFFER :PARSECOUNTEROFFER "]"
pause

:PARSECOUNTEROFFER
striptext $OFFER ","
add $BID 1
round $BID
setvar $BID[$BID] $OFFER
setvar $COUNT $LHTEYH
setvar $LHTEYH 0
setvar $LASTCOUNTER $LTPEHL
if ($planet~planetSHIP = "PLANET") and ($planet~planettrade_ratio <> 1)
	setvar $LASTCOUNTER ($RHYEDL / $planet~planettrade_ratio)
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Faking LastCounter as "&$LASTCOUNTER&" instead of "&$RHYEDL&"."
		gosub :bot~echo
	end
end
setvar $LTPEHL 0
setvar $I 1

:134
if ($I <= $COUNT)
	if ($verbose_debug_mode = TRUE)
	end
	setvar $TLLLHE ((($LASTCOUNTER -$LHTEYH[$I][5]) * ".3") + $LHTEYH[$I][5])
	setvar $TDPLTY (((($LHTEYH[$I][1] / 1000) + $LHTEYH[$I][3]) + 1) * $TLLLHE)
	if ($verbose_debug_mode = TRUE)
	end
	if ($planet~planetSHIP = "PLANET") and ($planet~planettrade_ratio <> 1)
		multiply $TDPLTY $planet~planettrade_ratio
	end
	round $TDPLTY 0
	if ($TDPLTY = $OFFER)
		add $LHTEYH 1
		round $LHTEYH 0
		if ($I <> $LHTEYH)
			setvar $LHTEYH[$LHTEYH][1] $LHTEYH[$I][1]
			if ($verbose_debug_mode = TRUE)
			end
			setvar $LHTEYH[$LHTEYH][2] $LHTEYH[$I][2]
			setvar $LHTEYH[$LHTEYH][3] $LHTEYH[$I][3]
			setvar $LHTEYH[$LHTEYH][4] $LHTEYH[$I][4]
		end
		setvar $LHTEYH[$LHTEYH][5] $TLLLHE
		setvar $LHTEYH[$LHTEYH][6] 0
	end
	add $I 1
	round $I 0
	goto :134
end
setvar $MCIC 0
setvar $UPPER_RANGE_MCIC 0
setvar $HODDHL 0
setvar $PYHOPR 0
setvar $I 1

:148
if ($I <= $LHTEYH)
	if (($LHTEYH[$I][1] * $EHYLOD) < ($MCIC * $EHYLOD)) or ($MCIC = 0)
		setvar $MCIC $LHTEYH[$I][1]
		if ($verbose_debug_mode = TRUE)
		end
	end
	if (($LHTEYH[$I][1] * $EHYLOD) > ($UPPER_RANGE_MCIC * $EHYLOD))
		setvar $UPPER_RANGE_MCIC $LHTEYH[$I][1]
	end
	if ($LHTEYH[$I][4] < $HODDHL) or ($HODDHL = 0)
		setvar $HODDHL $LHTEYH[$I][4]
	end
	if ($LHTEYH[$I][4] > $PYHOPR)
		setvar $PYHOPR $LHTEYH[$I][4]
	end
	add $I 1
	round $I 0
	goto :148
end
if ($verbose_debug_mode = TRUE)
end
setsectorparameter $SECTOR $PRODUCT & "-" $MCIC
setsectorparameter $SECTOR $PRODUCT & "+" $UPPER_RANGE_MCIC
setsectorparameter $SECTOR $PRODUCT & "L" $HODDHL
setsectorparameter $SECTOR $PRODUCT & "H" $PYHOPR

:BID
setvar $LHPLHL 0
setvar $PTORPE 0
setvar $OTHYTR 0
setvar $I 1

:162
if ($I <= $LHTEYH)
	if ($FINALOFFER = 1)
		loadvar $bot~bluehaggle
		if (($bot~bluehaggle = true) and ($planet~planetSHIP = "SHIP"))
			gosub :SUBBLUEHAGGLE
			goto :167
		end
		if ($BUYSELL = "BUYING")
			setvar $LTPEHL ($LHTEYH[$I][5] -".5")
			if ($LTPEHL < $LHPLHL) or ($LHPLHL = 0)
				setvar $LHPLHL $LTPEHL
			end
			goto :169
		end
		setvar $LTPEHL ($LHTEYH[$I][5] + ".5")
		if ($LTPEHL > $PTORPE)
			setvar $PTORPE $LTPEHL
		end

:169

:167
		goto :165
	end
	setvar $LTPEHL ((((($LHTEYH[$I][1] * ".004") / $BID) * (0 -1)) + 1) * $LHTEYH[$I][5])
	if ($BUYSELL = "SELLING") and ($BID = 1)
		setvar $HDPYDH (($LHTEYH[$I][5] / "1.5") + ".5")
		if ($LTPEHL < $HDPYDH)
			setvar $TEMP $LTPEHL
			round $TEMP 4
			round $HDPYDH 4
			if ($verbose_debug_mode = TRUE)
				setvar $switchboard~message "*Counter ("&$TEMP&") is below StupidOffer ("&$HDPYDH&"), adjusting."
				gosub :bot~echo
			end
			setvar $LTPEHL ($HDPYDH + ".5")
		end
	end
	if ($LTPEHL < $LHPLHL) or ($LHPLHL = 0)
		setvar $LHPLHL $LTPEHL
	end
	if ($LTPEHL > $PTORPE)
		setvar $PTORPE $LTPEHL
	end
	if ($BID = 1)
		setvar $LTPEHL ($LHTEYH[$I][5] * "1.5")
		if ($verbose_debug_mode = TRUE)
		end
		if ($LTPEHL < $OTHYTR) or ($OTHYTR = 0)
			setvar $OTHYTR $LTPEHL
		end
	end

:165
	add $I 1
	round $I 0
	goto :162
end
setvar $TEMP 0
setvar $HDPYDH 0
if ($BUYSELL = "BUYING")
	setvar $LTPEHL $LHPLHL
	if ($BID > 1) and ($LTPEHL > $LASTCOUNTER)
		setvar $LTPEHL $LASTCOUNTER
		goto :193
	end
	if ($BID = 1) and ($PERCENT = 100) and ($LTPEHL <> 0)
		subtract $LTPEHL 1
	end

:193
	goto :191
end
setvar $LTPEHL $PTORPE
if ($BID > 1) and ($LTPEHL < $LASTCOUNTER)
	setvar $LTPEHL $LASTCOUNTER
	goto :196
end
if ($BID = 1) and ($PERCENT = 100)
	add $LTPEHL 1
end

:196

:191
loadvar $bot~worstprice
if ($BID = 1) and ($bot~worstprice = 1)
	if ($BUYSELL = "SELLING")
		setvar $LTPEHL ($OTHYTR -1)
	end
end
if ($BID > 3) and ($FINALOFFER <> 1) or ($bot~haggleandhold = 1) and ($FINALOFFER = 1)
	setvar $LTPEHL $LASTCOUNTER
end
if ($LTPEHL = 0)
	setvar $switchboard~message ANSI_12&"*Counter is ZERO, input Counter manually, (or ENTER to accept their offer):"
	gosub :bot~echo
	#getconsoleinput $LTPEHL
	send "*"
	if ($LTPEHL = "")
		setvar $LTPEHL $OFFER
	end
	if ($planet~planetSHIP = "PLANET")
		divide $LTPEHL $planet~planettrade_ratio
	end
end
setvar $TOECHO ""
if ($FINALOFFER = 1) or ($planet~planetSHIP = "SHIP") and ($bot~worstprice = 1) and ($BUYSELL = "SELLING")
	setvar $TOECHO ANSI_12 & "<<<  " & ANSI_11 & $PRODUCT & " MCIC = " & ANSI_14 & $MCIC
	setvar $ANSILENGTH 28
	if ($MCIC <> $UPPER_RANGE_MCIC)
		setvar $TOECHO $TOECHO & ANSI_11 & " to " & ANSI_14 & $UPPER_RANGE_MCIC
		setvar $ANSILENGTH 42
	end
	setvar $TOECHO $TOECHO & ANSI_12 & "  >>>"
	replacetext $OUTTEXTSTRING "*" "[CR]"
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message $toecho
		gosub :bot~echo
	end
end
if ($LHTEYH = 1) and ($LHTEYH[1][6] = 1)
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message ANSI_12&"*   <<<  "&ANSI_14&"Exact .5 Anomaly Detected for this MCIC"&ANSI_12&"  >>>"
		gosub :bot~echo
	end
end
if ($FINALOFFER = 1)
	getlength $TOECHO $ECHOLENGTH
	subtract $ECHOLENGTH $ANSILENGTH
	getlength CURRENTLINE $LINELENGTH
	setvar $PADLENGTH ((80 -$LINELENGTH) -$ECHOLENGTH)
	round $PADLENGTH 0
	getDeafClients $botIsDeaf
	if ($botIsDeaf)
		setvar $switchboard~message "C"&#27&"[1A"&"  "&$toecho
		gosub :bot~echo
	else
		echo #27&"[s"&#27&"["&$PADLENGTH&"C"&#27&"[1A"&$TOECHO&#27&"[u"&ANSI_5
	end
end
if ($planet~planetSHIP = "PLANET") and ($planet~planettrade_ratio <> 1)
	gosub :SUBPTRADENOT100
	goto :223
end
if ($planet~planetSHIP = "PLANET") and ($FINALOFFER = 1)
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Deducting Final Counter by 1*"
		gosub :bot~echo
	end
	subtract $LTPEHL 1
	round $LTPEHL 0
	send $LTPEHL "*"
	goto :223
end
round $LTPEHL 0
send $LTPEHL "*"

:223
setvar $LTPEHL[$BID] $LTPEHL
settextlinetrigger BUYOFFER :COUNTEROFFER "We'll buy them for"
settextlinetrigger SELLOFFER :COUNTEROFFER "We'll sell them for"
settextlinetrigger FINALOFFER :FINALOFFER "Our final offer is"
settextlinetrigger STARTCREDITS :STARTCREDITS "credits"
settextlinetrigger GOODTRADE :GOODTRADE "For your good trading"
settextlinetrigger GREATTRADE :GOODTRADE "For your great trading"
settexttrigger DONE :WAITTOPORT "Command [TL"
if ($bot~planettrade)
	settextlinetrigger PLANETTRADE :PLANETTRADE "How many units"
end
settextlinetrigger SHIPTRADE :SHIPTRADE "How many holds"
pause

:CONVENTIONAL
if ($verbose_debug_mode = TRUE)
	setvar $switchboard~message  "*Calculated MinProductivity="&$HHREPP
	gosub :bot~echo
	setvar $switchboard~message  "*Calculated MaxProductivity="&$MAXPRODUCTIVITY
	gosub :bot~echo
end
setvar $LHTEYH 0
setarray $LHTEYH 0
setvar $HTOYEY 0
setvar $MCIC $low_mcic_guess
isnumber $YN1 $high_mcic_guess
isnumber $YN2 $EHYLOD
setvar $HEEEOE ($high_mcic_guess + $EHYLOD)
round $HEEEOE 0

:229
if ($MCIC <> $HEEEOE)
	if ($verbose_debug_mode = TRUE)
		setvar $CONVENTIONALSUBECHO ""
		setvar $switchboard~message "*MCIC="&$MCIC
		gosub :bot~echo
	end
	setvar $OOHEHY (($MCIC / 1000) + 1)
	setvar $OTYHLY (($MCIC * ($price_ratio_per_hold[$PRODUCT] * $PORTQTY)) / 10)
	setvar $PRODUCTIVITY $LOWPRODUCTIVITY

:233
	if ($PRODUCTIVITY <= $HIGHPRODUCTIVITY)
		if ($verbose_debug_mode = TRUE)
			setvar $switchboard~message " Productivity="&$PRODUCTIVITY
			gosub :bot~echo
		end
		setvar $HTTYPY ($OTYHLY / $PRODUCTIVITY)
		setvar $base_var $EDDHPO

:237
		if ($base_var <= $PELHOH)
			if ($verbose_debug_mode = TRUE)
				setvar $switchboard~message ANSI_10&"*BaseVar="&$base_var
				gosub :bot~echo
			end
			setvar $EODERY (($PLUSMINUS * $base_var) + $ODHPTH)
			setvar $calculated_price_per_hold (($EODERY -$under_1000_experience_rate) -$HTTYPY)
			setvar $PDHHLY 0

:241
			if ($calculated_price_per_hold < 4)
				add $calculated_price_per_hold 1
				add $PDHHLY 1
				goto :241
			end
			setvar $OLDPEH ($calculated_price_per_hold * $holds_to_trade)
			if ($verbose_debug_mode = TRUE)
				setvar $ECHOEXACTPRICE $OLDPEH
				round $ECHOEXACTPRICE 4
				setvar $switchboard~message " ExactPrice="&$ECHOEXACTPRICE
				gosub :bot~echo
			end
			setvar $OLHYOY ((($OOHEHY -"0.003") * $OLDPEH) -"0.5001")
			round $OLHYOY 0
			setvar $TDLEOH ((($OOHEHY + "0.003") * $OLDPEH) + "0.5001")
			round $TDLEOH 0
			if ($OFFER < $OLHYOY) or ($OFFER > $TDLEOH)
				if ($verbose_debug_mode = TRUE)
					setvar $switchboard~message  ANSI_15&" ("&$OLHYOY&" - "&$TDLEOH&")*"
					gosub :bot~echo
				end
				goto :246
			end
			if ($verbose_debug_mode = TRUE)
				setvar $switchboard~message ANSI_15&" ("&ANSI_12&$OLHYOY&ANSI_15&" - "&ANSI_12&$TDLEOH&ANSI_15&")*"
				gosub :bot~echo
				setvar $switchboard~message ANSI_11&"*-.003 -.002 -.001 -000- +.001 +.002 +.003*"&ANSI_10
				gosub :bot~echo
			end
			setvar $variance $ROLLHH

:251
			if ($variance <= $PLRYHH)
				if ($verbose_debug_mode = TRUE)
				end
				setvar $LHHOLR (($OOHEHY + $variance) * $OLDPEH)
				if ($planet~planetSHIP = "PLANET") and ($planet~planettrade_ratio <> 1)
					if ($verbose_debug_mode = TRUE)
						setvar $switchboard~message "*PTrade="&$planet~planettrade_ratio&", IOTest changed from "&$LHHOLR&" to "
					end
					multiply $LHHOLR $planet~planettrade_ratio
					if ($verbose_debug_mode = TRUE)
						setvar $switchboard~message $switchboard~message&$LHHOLR&"."
						gosub :bot~echo
					end
				end
				setvar $ROUNDANOMALY FALSE
				setvar $TYOELT $LHHOLR
				round $TYOELT 0
				setvar $DYEHHD ($LHHOLR -"0.5")
				round $DYEHHD 7
				setvar $LPDOOD ($LHHOLR + "0.5")
				round $LPDOOD 7
				if ($TYOELT = $DYEHHD)
					setvar $ROUNDANOMALY TRUE
					setvar $ISROUNDEDDOWN TRUE
					goto :262
				end
				if ($TYOELT = $LPDOOD)
					setvar $ROUNDANOMALY TRUE
					setvar $ISROUNDEDDOWN FALSE
				end

:262
				round $LHHOLR 0
				setvar $IOTPAD ""
				getlength $LHHOLR $IOTLENGTH

:264
				if ($IOTLENGTH < 5)
					setvar $IOTPAD $IOTPAD & " "
					add $IOTLENGTH 1
					goto :264
				end
				if ($LHHOLR = $OFFER)
					if ($verbose_debug_mode = TRUE)
						setvar $switchboard~message ANSI_12&$IOTPAD&$LHHOLR&" "
						gosub :bot~echo
					end
					gosub :CONVENTIONALSUB
					goto :267
				end
				if ($ROUNDANOMALY = TRUE)
					if ($ISROUNDEDDOWN = TRUE)
						if (($LHHOLR + 1) = $OFFER)
							if ($verbose_debug_mode = TRUE)
								setvar $switchboard~message ANSI_13&$IOTPAD&"v"&ANSI_12&$LHHOLR&" "
								gosub :bot~echo
							end
							gosub :CONVENTIONALSUB
							goto :275
						end
						if ($verbose_debug_mode = TRUE)
							setvar $switchboard~message ANSI_13&$IOTPAD&"v"&ANSI_10&$LHHOLR&" "
							gosub :bot~echo
						end

:275
						goto :273
					end
					if ($ISROUNDEDDOWN = FALSE)
						if (($LHHOLR -1) = $OFFER)
							if ($verbose_debug_mode = TRUE)
								setvar $switchboard~message ANSI_13&$IOTPAD&"^"&ANSI_12&$LHHOLR&" "
								gosub :bot~echo
							end
							gosub :CONVENTIONALSUB
							goto :282
						end
						if ($verbose_debug_mode = TRUE)
							setvar $switchboard~message ANSI_13&$IOTPAD&"^"&ANSI_10&$LHHOLR&" "
							gosub :bot~echo
						end

:282
					end

:273
				end
				if ($verbose_debug_mode = TRUE)
					if ($ROUNDANOMALY = FALSE)
						if (($LHHOLR -$OFFER) = 1) or (($OFFER -$LHHOLR) = 1)
							setvar $switchboard~message ANSI_13&$IOTPAD&$LHHOLR&" "
							gosub :bot~echo
							goto :292
						end
						setvar $switchboard~message ANSI_10&$IOTPAD&$LHHOLR&" "
						gosub :bot~echo

:292
					end
				end

:267
				add $variance "0.001"
				round $variance 3
				goto :251
			end
			if ($verbose_debug_mode = TRUE)
				setvar $switchboard~message "*"
				gosub :bot~echo
			end

:246
			add $base_var 1
			round $base_var 0
			goto :237
		end
		add $PRODUCTIVITY 1
		round $PRODUCTIVITY 0
		goto :233
	end
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message ANSI_15&$CONVENTIONALSUBECHO&ANSI_10
		gosub :bot~echo
	end
	add $MCIC $EHYLOD
	round $MCIC 0
	goto :229
end
gosub :SAVEDERIVERESULTS
if ($FAILED > 0)
	goto :CONVENTIONAL
end
return

:CONVENTIONALSUB
add $LHTEYH 1
round $LHTEYH 0
round $MCIC 0
round $base_var 1
round $variance 3
setvar $LHTEYH[$LHTEYH][1] $MCIC
if ($verbose_debug_mode = TRUE)
	setvar $CONVENTIONALSUBECHO $CONVENTIONALSUBECHO & "*$lHtEYh[" & $LHTEYH & "][1] : MCIC=" & $MCIC & " Prod=" & $PRODUCTIVITY & " BaseVar=" & $base_var & " Variance=" & $variance
end
setvar $LHTEYH[$LHTEYH][2] $base_var
setvar $LHTEYH[$LHTEYH][3] $variance
setvar $LHTEYH[$LHTEYH][4] $PRODUCTIVITY
setvar $LHTEYH[$LHTEYH][5] $OLDPEH
if ($ROUNDANOMALY = TRUE)
	setvar $LHTEYH[$LHTEYH][6] 1
end
setvar $RPOEEL $OLDPEH
round $RPOEEL 3
setvar $HHDYDO ($OOHEHY + $variance)
round $HHDYDO 3
if ($PDHHLY > $HTOYEY)
	setvar $HTOYEY $PDHHLY
end
if ($PRODUCTIVITY < $LOWPRODUCTIVITY) or ($LOWPRODUCTIVITY = 0)
	if ($verbose_debug_mode = TRUE)
		setvar $CONVENTIONALSUBECHO $CONVENTIONALSUBECHO & "*Adjusting LowProductivity, from " & $LOWPRODUCTIVITY & " to " & $PRODUCTIVITY & " (Conventional)"
	end
	setvar $LOWPRODUCTIVITY $PRODUCTIVITY
end
if ($PRODUCTIVITY > $HIGHPRODUCTIVITY)
	if ($verbose_debug_mode = TRUE)
		setvar $CONVENTIONALSUBECHO $CONVENTIONALSUBECHO & "*Adjusting HighProductivity, from " & $HIGHPRODUCTIVITY & " to " & $PRODUCTIVITY
	end
	setvar $HIGHPRODUCTIVITY $PRODUCTIVITY
end
return

:LOWPERCENT
setvar $MCIC $low_mcic_guess
gettime $STARTTIME
setvar $LHTEYH 0
setarray $LHTEYH 0

:313
if (($MCIC * $EHYLOD) <= ($high_mcic_guess * $EHYLOD))
	setvar $OEYROT ((($ODHPTH + ($PLUSMINUS * $PELHOH)) -$under_1000_experience_rate) -(($MCIC * ($price_ratio_per_hold[$PRODUCT] * $PORTQTY)) / ($LOWPRODUCTIVITY * 10)))
	round $OEYROT 3
	if ($OEYROT < 4)
		if ($verbose_debug_mode = TRUE)
			setvar $switchboard~message "*Risk of anomaly at MCIC "&$MCIC&", Min="&$OEYROT&", going to Conventional routine."
			gosub :bot~echo
		end
		gosub :CONVENTIONAL
		return
	end

:319
	if ($base_var <= $PELHOH)

:321
		if ($variance <= $PLRYHH)
			setvar $TOEEEE (($OFFER -".4999999999") / ((($MCIC / 1000) + 1) + $variance))
			setvar $RYDRTH (($OFFER + ".4999999999") / ((($MCIC / 1000) + 1) + $variance))
			setvar $OLDLLY ((($MCIC * $price_ratio_per_hold) * $PORTQTY) / (10 * ((($ODHPTH + ($base_var * $PLUSMINUS)) -$under_1000_experience_rate) -($RYDRTH / $holds_to_trade))))
			setvar $HLHTLR ((($MCIC * $price_ratio_per_hold) * $PORTQTY) / (10 * ((($ODHPTH + ($base_var * $PLUSMINUS)) -$under_1000_experience_rate) -($TOEEEE / $holds_to_trade))))
			if ($HLHTLR < $OLDLLY)
				setvar $TEMP $OLDLLY
				setvar $OLDLLY $HLHTLR
				setvar $HLHTLR $TEMP
			end
			setvar $B1 $OLDLLY
			setvar $B2 $HLHTLR
			add $B1 "0.4999999999"
			round $B1 0
			subtract $B2 "0.4999999999"
			round $B2 0
			if ($B1 <= $B2)
				setvar $A1 $LOWPRODUCTIVITY
				setvar $A2 $HIGHPRODUCTIVITY
				if ($A2 >= $B1) and ($A1 <= $B2)
					if ($A1 >= $B1)
						setvar $C1 $A1
						goto :330
					end
					setvar $C1 $B1

:330
					if ($A2 <= $B2)
						setvar $C2 $A2
						goto :332
					end
					setvar $C2 $B2

:332
					setvar $I $C1

:333
					if ($I <= $C2)
						add $LHTEYH 1
						round $LHTEYH 0
						setvar $LHTEYH[$LHTEYH][1] $MCIC
						setvar $LHTEYH[$LHTEYH][2] $base_var
						setvar $LHTEYH[$LHTEYH][3] $variance
						setvar $LHTEYH[$LHTEYH][4] $I
						setvar $LHTEYH[$LHTEYH][5] (((($ODHPTH + ($PLUSMINUS * $base_var)) -(($PORTQTY / ($I * 10)) * ($MCIC * $price_ratio_per_hold))) -$under_1000_experience_rate) * $holds_to_trade)
						add $I 1
						round $I 0
						goto :333
					end
				end
			end
			add $variance ".001"
			round $variance 3
			goto :321
		end
		setvar $variance $ROLLHH
		add $base_var 1
		round $base_var 0
		goto :319
	end
	setvar $base_var $EDDHPO
	add $MCIC $EHYLOD
	round $MCIC 0
	goto :313
end
gosub :SAVEDERIVERESULTS
if ($FAILED > 0)
	goto :LOWPERCENT
end
return

:SAVEDERIVERESULTS
if ($LHTEYH > 0)
	setvar $FAILED 0
	setvar $MCIC 0
	setvar $UPPER_RANGE_MCIC 0
	setvar $HODDHL 0
	setvar $PYHOPR 0
	setvar $I 1

:339
	if ($I <= $LHTEYH)
		if (($LHTEYH[$I][1] * $EHYLOD) < ($MCIC * $EHYLOD)) or ($MCIC = 0)
			setvar $MCIC $LHTEYH[$I][1]
			if ($verbose_debug_mode = TRUE)
				setvar $switchboard~message "*In :saveDeriveResults, setting $MCIC to "&$LHTEYH[$I][1]
				gosub :bot~echo
			end
		end
		if (($LHTEYH[$I][1] * $EHYLOD) > ($UPPER_RANGE_MCIC * $EHYLOD))
			setvar $UPPER_RANGE_MCIC $LHTEYH[$I][1]
		end
		if ($LHTEYH[$I][4] < $HODDHL) or ($HODDHL = 0)
			setvar $HODDHL $LHTEYH[$I][4]
		end
		if ($LHTEYH[$I][4] > $PYHOPR)
			setvar $PYHOPR $LHTEYH[$I][4]
		end
		add $I 1
		round $I 0
		goto :339
	end
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message "*Derived Min/Max MCIC = "&$MCIC&" & "&$UPPER_RANGE_MCIC
		gosub :bot~echo
		setvar $switchboard~message "*Derived Min/Max Productivity = "&$HODDHL&" & "&$PYHOPR
		gosub :bot~echo
	end
	setsectorparameter $SECTOR $PRODUCT & "-" $MCIC
	setsectorparameter $SECTOR $PRODUCT & "+" $UPPER_RANGE_MCIC
	setsectorparameter $SECTOR $PRODUCT & "L" $HODDHL
	setsectorparameter $SECTOR $PRODUCT & "H" $PYHOPR
	goto :338
end
if ($FAILED = 0)
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message ANSI_12&"*Derive Failed Once, Adjusting highProductivity.*"
		gosub :bot~echo
		gosub :LOGDERIVEFAILURE
		if ($paused_debug_mode = TRUE)
			setvar $switchboard~message "*Press SPACE to continue..."
			gosub :bot~echo
			settextouttrigger DEBUGPAUSE :DBP1 " "
			pause

:DBP1
		end
	end
	setvar $FAILED 1
	setvar $HIGHPRODUCTIVITY $MAXPRODUCTIVITY
	setsectorparameter $SECTOR $PRODUCT & "H" $MAXPRODUCTIVITY
	goto :338
end
if ($FAILED = 1)
	if ($verbose_debug_mode = TRUE)
		setvar $switchboard~message ANSI_12&"*Derive Failed Twice, Resetting Productivity and MCIC values.*"
		gosub :bot~echo
		if ($paused_debug_mode = TRUE)
			setvar $switchboard~message "*Press SPACE to continue..."
			gosub :bot~echo
			settextouttrigger DEBUGPAUSE :DBP2 " "
			pause

:DBP2
		end
	end
	setvar $FAILED 2
	setvar $high_mcic_guess ($EHYLOD * $high_mcic_guess[$PRODUCT])
	round $high_mcic_guess 0
	setvar $low_mcic_guess ($EHYLOD * $low_mcic_guess[$PRODUCT])
	round $low_mcic_guess 0
	setsectorparameter $SECTOR $PRODUCT & "-" $low_mcic_guess
	setsectorparameter $SECTOR $PRODUCT & "+" $high_mcic_guess
	setvar $LOWPRODUCTIVITY $HHREPP
	setsectorparameter $SECTOR $PRODUCT & "L" $HHREPP
	setvar $HIGHPRODUCTIVITY $MAXPRODUCTIVITY
	setsectorparameter $SECTOR $PRODUCT & "H" $MAXPRODUCTIVITY
	setvar $EDDHPO 0
	setvar $PELHOH 18
	goto :338
end
if ($FAILED = 2)
	setvar $switchboard~message ANSI_12&"*Derive Failed, Port parameters could not be determined.*"
	gosub :bot~echo
	if ($paused_debug_mode = TRUE)
		setvar $switchboard~message "*Press SPACE to continue..."
		gosub :bot~echo
		settextouttrigger DEBUGPAUSE :DBP3 " "
		pause

:DBP3
	end
	if ($planet~planetSHIP = "PLANET")
		setvar $switchboard~message "Ensure that MBBS and Planetary Trade values are correct.*"
		gosub :bot~echo
		goto :367
	end
	setvar $switchboard~message "Ensure that MBBS value is correct.*"
	gosub :bot~echo

:367
	gosub :KILLTEXTOUTS
	setvar $FAILED 0
end

:338
return

:LOGDERIVEFAILURE

:SUBBLUEHAGGLE
if ($BUYSELL = "BUYING")
	setvar $LTPEHL (($LHTEYH[$I][5] * ".9799999999") -".5")
	if ($LTPEHL < $LHPLHL) or ($LHPLHL = 0)
		setvar $LHPLHL $LTPEHL
	end
	goto :369
end
setvar $LTPEHL (($LHTEYH[$I][5] / ".9799999999") + ".5")
if ($LTPEHL > $PTORPE)
	setvar $PTORPE $LTPEHL
end

:369
return

:SUBPTRADENOT100
setvar $RHYEDL ($LTPEHL * $planet~planettrade_ratio)
if ($verbose_debug_mode = TRUE)
	setvar $switchboard~message "*PTradeCounter="&$LTPEHL&" X "&$planet~planettrade_ratio&" = "&$RHYEDL&"*"
	gosub :bot~echo
end
if ($FINALOFFER = 1)
	if ($BUYSELL = "BUYING")
		setvar $RHYEDL ($RHYEDL -".4999999999")
		goto :379
	end
	setvar $RHYEDL ($RHYEDL + ".4999999999")

:379
end
round $RHYEDL 0
setvar $switchboard~message "$RHYEDL:"&$RHYEDL&"*"
gosub :bot~echo
send $RHYEDL "*"
return

:TEXTOUT
killtrigger "TEXTOUT0"
killtrigger "TEXTOUT1"
killtrigger "TEXTOUT2"
killtrigger "TEXTOUT3"
killtrigger "TEXTOUT4"
killtrigger "TEXTOUT5"
killtrigger "TEXTOUT6"
killtrigger "TEXTOUT7"
killtrigger "TEXTOUT8"
killtrigger "TEXTOUT9"
killtrigger "TEXTOUTENTER"
getouttext $OUTTEXT
setvar $OUTTEXTSTRING $OUTTEXTSTRING & $OUTTEXT
settextouttrigger TEXTOUT0 :TEXTOUT 0
settextouttrigger TEXTOUT1 :TEXTOUT 1
settextouttrigger TEXTOUT2 :TEXTOUT 2
settextouttrigger TEXTOUT3 :TEXTOUT 3
settextouttrigger TEXTOUT4 :TEXTOUT 4
settextouttrigger TEXTOUT5 :TEXTOUT 5
settextouttrigger TEXTOUT6 :TEXTOUT 6
settextouttrigger TEXTOUT7 :TEXTOUT 7
settextouttrigger TEXTOUT8 :TEXTOUT 8
settextouttrigger TEXTOUT9 :TEXTOUT 9
settextouttrigger TEXTOUTENTER :TEXTOUT "*"
pause

:KILLTEXTOUTS
killtrigger "TEXTOUT0"
killtrigger "TEXTOUT1"
killtrigger "TEXTOUT2"
killtrigger "TEXTOUT3"
killtrigger "TEXTOUT4"
killtrigger "TEXTOUT5"
killtrigger "TEXTOUT6"
killtrigger "TEXTOUT7"
killtrigger "TEXTOUT8"
killtrigger "TEXTOUT9"
killtrigger "TEXTOUTENTER"
return

:READMCICFILE
setprecision 0
setvar $switchboard~message ANSI_10&"*Merging data from file into Database..."
gosub :bot~echo
setvar $ERRORS ""
setvar $MCICFILELINE 2
read $MCICFILENAME $$FILETEST 1
if ($FILETEST <> "Sector,Product,LowMCIC,HighMCIC,LowProductivity,HighProductivity")
	setvar $switchboard~message ANSI_12&"FAILED!*THIS FILE IS NOT A VALID EXPORT!**"
	gosub :bot~echo
	return
end
read $MCICFILENAME $MCICFILEDATA $MCICFILELINE

:382
if ($MCICFILEDATA <> "EOF")
	replacetext $MCICFILEDATA "," " "
	getword $MCICFILEDATA $TEMPSEC 1
	getword $MCICFILEDATA $TEMPPRODUCT 2
	getword $MCICFILEDATA $TEMPMCIC1 3
	getword $MCICFILEDATA $TEMPMCIC2 4
	getword $MCICFILEDATA $TEMPPROD1 5
	getword $MCICFILEDATA $TEMPPROD2 6
	isnumber $YN1 $TEMPSEC
	isnumber $YN2 $TEMPMCIC1
	isnumber $YN3 $TEMPMCIC2
	isnumber $YN4 $TEMPPROD1
	isnumber $YN5 $TEMPPROD2
	setvar $FAILED 0
	if ($YN1)
		if ($TEMPSEC >= 1) and ($TEMPSEC <= SECTORS)
			if ($TEMPPRODUCT = "FUEL") or ($TEMPPRODUCT = "ORGANICS") or ($TEMPPRODUCT = "EQUIPMENT") and ($YN2) and ($YN3) and ($YN4) and ($YN5)
				setvar $IMPORTITEM $TEMPMCIC1
				striptext $IMPORTITEM "-"
				getsectorparameter $TEMPSEC $TEMPPRODUCT & "-" $TEMP
				if ($IMPORTITEM > $TEMP)
					setsectorparameter $TEMPSEC $TEMPPRODUCT & "-" $TEMPMCIC1
				end
				setvar $IMPORTITEM $TEMPMCIC2
				striptext $IMPORTITEM "-"
				getsectorparameter $TEMPSEC $TEMPPRODUCT & "+" $TEMP
				if ($IMPORTITEM < $TEMP) or ($TEMP = 0)
					setsectorparameter $TEMPSEC $TEMPPRODUCT & "+" $TEMPMCIC2
				end
				setvar $IMPORTITEM $TEMPPROD1
				getsectorparameter $TEMPSEC $TEMPPRODUCT & "L" $TEMP
				if ($IMPORTITEM > $TEMP)
					setsectorparameter $TEMPSEC $TEMPPRODUCT & "L" $TEMPPROD1
				end
				setvar $IMPORTITEM $TEMPPROD2
				getsectorparameter $TEMPSEC $TEMPPRODUCT & "H" $TEMP
				if ($IMPORTITEM > $TEMP)
					setsectorparameter $TEMPSEC $TEMPPRODUCT & "H" $TEMPPROD2
				end
				goto :389
			end
			setvar $FAILED 1

:389
			goto :387
		end
		setvar $FAILED 1

:387
		goto :385
	end
	setvar $FAILED 1

:385
	if ($FAILED = 1)
		setvar $ERRORS $ERRORS & "*Sector:" & $TEMPSEC & ", Product=" & $TEMPPRODUCT
	end
	add $MCICFILELINE 1
	read $MCICFILENAME $MCICFILEDATA $MCICFILELINE
	goto :382
end
setvar $switchboard~message ANSI_10&"COMPLETE*"
gosub :bot~echo
if ($ERRORS <> "")
	setvar $switchboard~message ANSI_12&"*ERRORS ENCOUNTERED, UNMERGED DATA AS FOLLOWS:"&ANSI_11&$ERRORS&"*"
	gosub :bot~echo
end
return

:WRITEMCICFILE
setvar $switchboard~message ANSI_10&"*Exporting known MCIC data..."
gosub :bot~echo

write $MCICFILENAME "Test Passed"
delete $MCICFILENAME
write $MCICFILENAME "Sector,Product,LowMCIC,HighMCIC,LowProductivity,HighProductivity"
setprecision 0
setvar $I 1
setvar $PRODUCTS "FUEL ORGANICS EQUIPMENT"

:402
if ($I <= SECTORS)
	setvar $WORD 1

:404
	if ($WORD <= 3)
		getword $PRODUCTS $PRODUCT $WORD
		getsectorparameter $I $PRODUCT & "-" $A
		if ($A <> "")
			getsectorparameter $I $PRODUCT & "+" $B
			getsectorparameter $I $PRODUCT & "L" $C
			getsectorparameter $I $PRODUCT & "H" $D
			write $MCICFILENAME $I & "," & $PRODUCT & "," & $A & "," & $B & "," & $C & "," & $D
		end
		add $WORD 1
		goto :404
	end
	add $I 1
	goto :402
end
setprecision 15
setvar $switchboard~message ANSI_11&"COMPLETE**Data saved in the TWX Proxy folder as "&$MCICFILENAME&".**"
gosub :bot~echo
return


include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
