###########################################
:upgradePort
send "o" $upg_prod
setTextTrigger maxupg :maxupg "to quit)"
pause

:maxupg
getWord CURRENTLINE $upg_maxupg 9
striptext $upg_maxupg "("

if ($upg_maxupg < $upg_amnt)
	setVar $upg_amnt "-1"
else
	send $upg_amnt "*q"
end
return

#####################



###########################################

#=-=-=-=-=-  Class  =-=-==-==-=-=-=-=
:chkclass
if ($classchk = 0)
	setvar $class "Class 0"
elseif ($classchk = 1)
	setvar $class "BBS"
elseif ($classchk = 2)
	setvar $class "BSB"
elseif ($classchk = 3)
	setvar $class "SBB"
elseif ($classchk = 4)
	setvar $class "SSB"
elseif ($classchk = 5)
	setvar $class "SBS"
elseif ($classchk = 6)
	setvar $class "BSS"
elseif ($classchk = 7)
	setvar $class "SSS"
elseif ($classchk = 8)
	setvar $class "BBB"
elseif ($classchk = 9)
	setvar $class "StarDock"
else
	setvar $class "Unknown"
end
return
#/\/\ Variable Definitions /\/\
#$classchk	- Numerical class of port
#$class		- Alpha class of port
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\