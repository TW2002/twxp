systemscript
gosub :nearfig_inc~fig_List
setVar $clv_inc~dataman 1
setVar $activation_key "-"
setVar $nearChck "No"
setVar $nearfig_inc~figfile GAMENAME & "_FIGLIST.txt"

:top
setTextOutTrigger keyIn :keyIn
setTextLineTrigger figList :figList "Deployed  Fighter  Scan"
setTextTrigger ranks :rankings "Trade Wars 2002 Trader Rankings :"
setTextLineTrigger limpet :limpet "Limpet mine in"
setTextLineTrigger fighter :fighter "entered sector."
pause

:keyIn
killtrigger figList
killtrigger ranks
killtrigger limpet
killtrigger fighter
getOutText $key
lowerCase $key
if ($key = "^")
	processOut "^"
	:cimKey
	setTextOutTrigger inCIM :inCIM
	pause

	:inCIM
	getOutText $cimKey
	lowerCase $cimKey
	if ($cimKey = "r")
		send "?"
		gosub :cimhunt_inc~runcim
		if ($cimhunt_inc~used_port_count > 0)
			waitFor ":"
			getTime $portReport "mm/dd/yy hh:nn:ss am/pm"
			echo ANSI_3 "**CIM" ANSI_14 " " $cimhunt_inc~used_port_count " port change(s), press (" ANSI_10 $activation_key ANSI_14 ") to view report.*"
			echo "*" CURRENTANSILINE
		end
		goto :cimKey
	elseif ($cimKey = "s")
		setTextLineTrigger setCIMVoid :setCIMVoid "Sector:"
		pause

		:setCIMVoid
		getWord CURRENTLINE $void 2
		if ($void > 0)
			setVar $voided[$void] 1
		end
		goto :cimKey
	elseif ($cimKey = "c")
		setTextLineTrigger clearCIMVoid :clearCIMVoid "Sector:"
		pause

		:clearCIMVoid
		getWord CURRENTLINE $void 2
		if ($void > 0)
			setVar $voided[$void] 0
		end
		goto :cimKey
	elseif ($cimKey = $activation_key)
		gosub :menu
	else
		processOut $cimKey
	end
elseif ($key = $activation_key)
	gosub :menu
else
	processOut $key
end
goto :top

:menu
setVar $menu 0
if ($cimhunt_inc~used_port_count > 0)
	add $menu 1
	setVar $options[$menu] "View port changes. " & $portReport
end
if ($clv_inc~cnt > 0)
	add $menu 1
	setVar $options[$menu] "View player/ship changes. " & $clvReport
end
if ($newreport > 0) OR ($nonreport > 0)
	add $menu 1
	setVar $options[$menu] "View permanent port report changes " & $prmReport
end

:drawmenu
:errmenu
setVar $signature_inc~scriptName "SupGDataman"
setVar $signature_inc~version "1.a"
setVar $signature_inc~date "04/19/04"
gosub :signature_inc~signature
echo ANSI_15 "SupGDataman Settings for " GAMENAME "*"
echo ANSI_14 "U." ANSI_15 " Update known port list"
if ($nearChck = "No")
	echo ANSI_14 "*N." ANSI_15 " Enable close fig find"
else
	echo ANSI_14 "*N." ANSI_15 " Disable close fig find"
end

if ($menu > 0)
	setVar $mencnt 0
	:mencnt
	if ($mencnt < $menu)
		add $mencnt 1
		echo ANSI_14 "*" $mencnt "." ANSI_15 " " $options[$mencnt] ""
		goto :mencnt
	end
end
echo ANSI_14 "*Q." ANSI_15 " Quit" 
echo "*"
getConsoleInput $choice singlekey
lowercase $choice
isNumber $numtst $choice
if ($numtst = 0)
	if ($choice = "u")
		gosub :updatePortReport
	elseif ($choice = "n")
		if ($nearChck = "No")
			setVar $nearChck "Yes"
		else
			setVar $nearChck "No"
		end
	elseif ($choice = "q")
		return
	end
	return
else
	if ($choice > 0) AND ($choice <= $menu)
		getWord $options[$choice] $option 2
		if ($option = "port")
			gosub :printPortChanges
		elseif ($option = "player/ship")
			gosub :printCLVChanges
		elseif ($option = "permanent")
			gosub :printPRMChanges
		end
	end
	return
end


:printPortChanges
setVar $print_loop 0
echo ANSI_10 "**Port Changes (" $cimhunt_inc~used_port_count ")*" ANSI_14 "------------"
:print_results
if ($print_loop	< $cimhunt_inc~used_port_count)
	add $print_loop 1
	echo ANSI_15 "*" $cimhunt_inc~change_port[$print_loop]
	write $cimhunt_inc~log_file $cimhunt_inc~change_port[$print_loop]
	goto :print_results
else
	echo "*done.**"
	echo CURRENTANSILINE
end
return

:printCLVChanges
:clvprint
setVar $prnter 0
echo ANSI_10 "**Player/ship Changes (" $clv_cnt ")*"  ANSI_13 "-------------------"
:clvprnter
if ($prnter < $clv_inc~cnt)
	add $prnter 1
	echo ANSI_15 "* CLV: " $clv_inc~change[$prnter]
	goto :clvprnter
end
echo "*done**"
echo "*" CURRENTANSILINE
return

:figList
killtrigger keyIn
killtrigger ranks
killtrigger limpet
killtrigger fighter
gosub :nearfig_inc~refreshing
goto :top

:rankings
killtrigger keyIn
killtrigger figList
killtrigger limpet
killtrigger fighter
gosub :clv_inc~sentclv
if ($clv_inc~cnt > 0)
	waitFor "Computer command"
	echo ANSI_3  "**CLV " ANSI_14 $clv_inc~cnt " player/ship changes, press (" ANSI_10  $activation_key ANSI_14  ") to view report.*"
	getTime $clvReport "mm/dd/yy hh:nn:ss am/pm"
	echo "*" CURRENTANSILINE
end
goto :top

:updatePortReport
setVar $prmfile GAMENAME & "_PRMCIM.txt"
setVar $rctfile GAMENAME & "_CIM.txt"
fileExists $prmexst $prmfile
fileExists $rctexst $rctfile

if ($prmexst = 0)
	if ($rctexst = 0)
		echo ANSI_15 "*Unable to update, run a port report.*"
	else
		setVar $reader 1
		:readwriter
		read $rctfile $line $reader
		if ($line <> "EOF")
			write $prmfile $line
			add $reader 1
			goto :readwriter
		end
		echo "*done*"
	end
	echo "*" CURRENTANSILINE
else
	if ($rctexst = 0)
		echo ANSI_15 "*Unable to update, run a port report.*"
		echo "*" CURRENTANSILINE
	else
		setVar $readerPrm 1
		setVar $readerCim 1
		setVar $newreport 0
		setVar $nonreport 0
		setVar $totalPorts 0
		:compareprm
		read $prmfile $prmline $readerPrm
		if ($prmline <> "EOF")
			getWord $prmline $prmsect 1
		else
			setVar $prmsect (SECTORS + 1)
		end
		
		:comparecim
		read $rctfile $rctline $readerCim
		if ($rctline <> "EOF")
			getWord $rctline $rctsect 1
		else
			setVar $rctsect (SECTORS + 1)
		end
		
		if ($prmsect = (SECTORS + 1)) AND ($rctsect = (SECTORS + 1))
			if ($newreport > 0) OR ($nonreport > 0)
				echo ANSI_3 "**PRM" ANSI_14 " Permanent port report changes, press (" ANSI_10  $activation_key ANSI_14  ") to view report.*"
				getTime $prmReport "mm/dd/yy hh:nn:ss AM/PM"
			end
			echo ANSI_15 "*" $totalPorts " total ports recorded*"
			delete $prmfile
			rename GAMENAME & "_CIMTEMP.txt" $prmfile
			echo "*done*"
			echo "*" CURRENTANSILINE
			return
		end
		getTime $time "mm/dd/yy_hh:nn:ss_am/pm"
		if ($rctsect > $prmsect)
			add $nonreport 1
			setVar $port_inc~classchk PORT.CLASS[$prmsect]
			gosub :port_inc~chkclass
			getWord $prmline $lastUpdate 8
			setVar $not_Reporting[$nonreport] $prmsect & "(" & $port_inc~class & ")" & "       " & $lastUpdate
			add $readerPrm 1
			write GAMENAME & "_CIMTEMP.txt" $prmline
			add $totalPorts 1
			goto :compareprm
		elseif ($rctsect < $prmsect)
			add $newreport 1
			setVar $new_Reporting[$newreport] $rctsect
			add $readerCim 1
			write GAMENAME & "_CIMTEMP.txt" $rctline & " " & $time
			add $totalPorts 1
			goto :comparecim
		else
			add $readerCim 1
			add $readerPrm 1
			write GAMENAME & "_CIMTEMP.txt" $rctline & " " & $time
			add $totalPorts 1
			goto :compareprm
		end
	end
	
end
return

:printPRMChanges
if ($newreport > 0)
	setVar $cnt 0
	echo ANSI_10 "**New Ports (" $newreport ")*"  ANSI_13 "---------"
	:newprt
	while ($cnt < $newreport)
		add $cnt 1
		echo ANSI_15 "* New Port : " $new_Reporting[$cnt]
	end
end
if ($nonreport > 0)
	setVar $cnt 0
	echo ANSI_10 "**Ports not reporting (" ANSI_12 $nonreport ANSI_10 "/" ANSI_15 $totalPorts ANSI_10 ")      Last Updated*"  ANSI_13 "-------------------          -------------------------"
	:newprt
	while ($cnt < $nonreport)
		add $cnt 1
		echo ANSI_15 "* Dead Port : " $not_Reporting[$cnt]
	end
end
echo "*done*"
echo CURRENTANSILINE
return

:fighter
killtrigger keyIn
killtrigger figList
killtrigger limpet
killtrigger ranks
getWord CURRENTLINE $first 1
if ($first <> "Deployed")
	goto :top
end
getText CURRENTLINE $hitsect "Sector " ": "
setVar $nearfig_inc~figList[$hitsect] 0
if ($nearChck = "Yes")
	gosub :printNF
end
goto :top

:limpet
killtrigger keyIn
killtrigger figList
killtrigger fighter
killtrigger ranks
getWord CURRENTLINE $first 1
if ($first <> "Limpet")
	goto :top
end
getText CURRENTLINE $hitsect "in " " activated"
if ($nearChck = "Yes")
	gosub :printNF
end
goto :top


:printNF
setVar $nearfig_inc~origsec $hitsect
setVar $nearfig_inc~command 0
gosub :nearfig_inc~closefig
if ($nearfig_inc~result > 0)
	getDistance $dist $hitsect $nearfig_inc~result
	setVar $near "cf: " & $nearfig_inc~result & "-" & $dist
else
	setVar $near "cf: NED"
end
getLength $near $len
setVar $startPoint (79 - $len)
getLength CURRENTLINE $curlen
echo "[s"
echo "[" $curlen "D"
echo "[" $startPoint "C" ANSI_15 $near
echo "[u"
return

include "supginclude\cimhunt_inc"
include "supginclude\nearfig_inc"
include "supginclude\clv_inc"
include "supginclude\signature_inc"
include "supginclude\port_inc"

