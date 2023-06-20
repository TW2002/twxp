#=-=-=-=-=-Express=-=-=-=-=-=
:express
send "m" $expressto "*"

setTextTrigger twarp :no_twarp "Do you want to engage the TransWarp drive?"
setTextTrigger express :express_warp "Engage the Autopilot?"
setTextTrigger in_adj :there "Sector  : " & $expressto
setTextTrigger voided_sec :voided "Do you really want to warp there?"
setTextTrigger insec :there "You are already in that sector!"
setTextTrigger ig :igd "An Interdictor Generator in this sector holds you fast!"
setTextTrigger ig2 :igd "<Re-Display>"
setTextTrigger noturns :exp_noturns "You don't have enough turns left."
pause

:voided
killtrigger ig2
killtrigger noturns
killtrigger ig
killtrigger twarp
killtrigger express
killtrigger hitfig
killtrigger hitmine
killtrigger clear
killtrigger done
killtrigger continue
killtrigger in_adj
killtrigger insec
getWord CURRENTLINE $void 7
send "n"
setVar $expressto "-2"
return

:exp_noturns
killtrigger ig2
killtrigger noturns
killtrigger ig
killtrigger twarp
killtrigger express
killtrigger hitfig
killtrigger hitmine
killtrigger clear
killtrigger done
killtrigger continue
killtrigger in_adj
killtrigger insec
setVar $expressto "-3"
return

:no_twarp
killtrigger noturns
killtrigger ig
killtrigger in_adj
killtrigger express
killtrigger voided_sec
killtrigger ig2
send "n"

:express_warp
killtrigger noturns
killtrigger ig
killtrigger twarp
killtrigger in_adj
killtrigger voided_sec
killtrigger ig2
send "e"

:there
killtrigger ig2
killtrigger noturns
killtrigger ig
killtrigger voided_sec
killtrigger twarp
killtrigger express
killtrigger insec

gosub :clear_sector
return

:clear_sector
setTextTrigger hitfig :hit_fig "Your fighters:"
setTextTrigger hitmine :hit_mine "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
setTextTrigger clear :ready_state "Autopilot disengaging."
setTextTrigger done :ready_state "Command [TL="
if ($singlestep = 1)
	setTextTrigger continue :ready_state "Stop in this sector"
else
	setTextTrigger continue :keep_rollin "Stop in this sector"
end
setTextTrigger ig :igd "An Interdictor Generator in this sector holds you fast!"
setTextTrigger pause :pause "[Pause]"
setTextTrigger noturns :exp_noturns "You don't have enough turns left."
pause

:pause
send "*"
setTextTrigger pause :pause "[Pause]"
pause

:keep_rollin
send "n"
setTextTrigger continue :keep_rollin "Stop in this sector"
pause

:hit_fig
send "a999989796954939291911*"
setTextTrigger hitfig :hit_fig "Your fighters:"
pause

:hit_mine
send "n"
setTextTrigger hitmine :hit_mine "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
pause

:ready_state
killtrigger ig2
killtrigger noturns
killtrigger ig
killtrigger twarp
killtrigger express
killtrigger hitfig
killtrigger hitmine
killtrigger clear
killtrigger done
killtrigger continue
killtrigger in_adj
killtrigger insec
killtrigger pause
return

:igd
killtrigger ig2
killtrigger noturns
killtrigger ig
killtrigger twarp
killtrigger express
killtrigger hitfig
killtrigger hitmine
killtrigger clear
killtrigger done
killtrigger continue
killtrigger in_adj
killtrigger insec
killtrigger pause
setVar $expressto "-1"
return

#/\/\ Variable Definitions /\/\
#$expressto		> 0 - Sector to warp to
#$expressto		-1  - Caught in IG
#$expressto		-2  - Sector Avoided
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-
#-=-=-=-=-=-=-=-=TWarp=--=-=-=-=-=-=-=-=-=-
:twarp
send "m" $twarpto "*"
setTextTrigger twarp :tw_twarp "Do you want to engage the TransWarp drive?"
setTextTrigger notwarp :tw_notwarp "The shortest path ("
setTextTrigger adjacent :tw_there "Sector  : " & $twarpto
setTextTrigger ig :tw_igd "An Interdictor Generator in this sector holds you fast!"
setTextTrigger nomove :tw_there "You are already in that sector!"
setTextTrigger noturns :tw_noturns "You don't have enough turns left."
setTextTrigger voided :tw_notwarp "No route within"
pause

:tw_twarp
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger notwarp
killtrigger adjacent
killtrigger ig
send "y"
setTextTrigger gogo :tw_safe "All Systems Ready, shall we engage?"
setTextTrigger outafuel :tw_outafuel "You do not have enough Fuel Ore to make the jump."
setTextTrigger nogo :tw_blind "Do you want to make this jump blind?"
pause

:tw_safe
send "y  "
:tw_there
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger notwarp
killtrigger adjacent
killtrigger ig
killtrigger twarp
killtrigger gogo
killtrigger outafuel
killtrigger nogo
gosub :clear_sector
return

:tw_notwarp
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger notwarp
killtrigger adjacent
killtrigger ig
killtrigger twarp
send "n"
setVar $twarpto "-1"
return

:tw_ig
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger notwarp
killtrigger adjacent
killtrigger ig
killtrigger twarp
setVar $twarpto "-2"
return

:tw_outafuel
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger gogo
killtrigger outafuel
killtrigger nogo
setVar $twarpto "-3"
return

:tw_blind
killtrigger voided
killtrigger noturns
killtrigger nomove
killtrigger gogo
killtrigger outafuel
killtrigger nogo
send "n"
setVar $twarpto "-4"
return

###############Xport
:xport
send "x  "
setTextTrigger choose :xp_choose "Choose which ship to"
setTextTrigger noships :xp_noships "You do not own any other ships!"
pause


:xp_choose
killtrigger noships
send $xportto "*  q"
setTextTrigger noturns :xp_noturns "You don't have any turns left!"
setTextTrigger noship :xp_noship "That is not an available ship."
setTextTrigger xport :xp_xport "Security code accepted,"
setTextTrigger noceo :xp_noceo "Your retinal scan does not match"
setTextTrigger range :xp_range "only has a transport range of"
setTextTrigger comm :xp_commish "You are not commissioned by the"
setTextTrigger exp :xp_experience "You need "
setTextTrigger noships :xp_noship "You do not own any other ships!"
pause

:xp_noturns
killtrigger noturns
killtrigger noship
killtrigger noships
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-1"
return

:xp_noship
killtrigger noships
killtrigger choose
killtrigger noship
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-2"
return

:xp_noceo
killtrigger noships
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-3"
return

:xp_noships
killtrigger noships
killtrigger choose
killtrigger noship
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-7"
return

:xp_range
killtrigger noships
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-4"
return

:xp_commish
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
killtrigger noships
setVar $xportto "-5"
return

:xp_experience
killtrigger noships
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
setVar $xportto "-6"
return

:xp_xport
killtrigger noships
killtrigger noturns
killtrigger noship
killtrigger xport
killtrigger noceo
killtrigger range
killtrigger comm
killtrigger exp
return


########################################################
:ptorp
setTextTrigger fired :pt_fired "Photon Wave Duration"
setTextTrigger notadj :pt_notadj "That is not an adjacent sector"
setTextTrigger ptordis :pt_disable "Photon Missiles are disabled."
setTextTrigger nofire :pt_nofire "<Computer deactivated>"
setTextTrigger fed :pt_fed "The Feds do not permit"
setTextTrigger notorps :pt_notorps "You do not have any Photon Missiles!"
send "cpy  " $photonto "*q"
pause

:pt_fired
killtrigger notadj
killtrigger ptordis
killtrigger nofire
killtrigger fed
killtrigger notorps
return

:pt_notadj
killtrigger fired
killtrigger ptordis
killtrigger nofire
killtrigger fed
killtrigger notorps
setVar $photonto "-1"
send "q"
return

:pt_disable
killtrigger fired
killtrigger nofire
killtrigger fed
killtrigger notadj
killtrigger notorps
setVar $photonto "-2"
return

:pt_nofire
killtrigger fired
killtrigger fed
killtrigger notadj
killtrigger ptordis
killtrigger notorps
setVar $photonto "-3"
return

:pt_fed
killtrigger fired
killtrigger nofire
killtrigger notadj
killtrigger ptordis
killtrigger notorps
setVar $photonto "-4"
return

:pt_notorps
killtrigger fired
killtrigger nofire
killtrigger notadj
killtrigger ptordis
killtrigger fed
setVar $photonto "-5"
return



#####################################
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

:setVoids
send "d"
waitfor "<Re-Display>"
setTextTrigger cursec :void_cursec "] (?=Help)? :"
pause

:void_cursec 
getText CURRENTLINE $cursec "]:[" "] (?=Help)? :"
setVar $setVoids 1
send "c"
while ($setVoids <= SECTOR.WARPCOUNT[$cursec])
	send "v" SECTOR.WARPS[$cursec][$setVoids] "*"
	add $setVoids 1
end
send "q"
return

:clearVoids
send "d"
waitfor "<Re-Display>"
setTextTrigger cursec :clearvoid_cursec "] (?=Help)? :"
pause

:clearvoid_cursec 
getText CURRENTLINE $cursec "]:[" "] (?=Help)? :"
setVar $setVoids 1
send "c"
while ($setVoids <= SECTOR.WARPCOUNT[$cursec])
	echo " " $setVoids " "
	send "v0*yn" SECTOR.WARPS[$cursec][$setVoids] "*"
	add $setVoids 1
end
send "q"
return