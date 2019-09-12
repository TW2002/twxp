#######################
:land
setVar $qdamage 0
setVar $fdamage 0
setVar $pshields 0
setVar $pfigs 0
setVar $planetResult 0
send "l"
:landtrig
killtrigger toobig
killtrigger quasar
killtrigger fighters
setTextLineTrigger landed :onplanet "Planet #"
setTextTrigger noplanet :noplanet "There isn't a planet"
setTextTrigger registry :enterpnum "Registry# and Planet Name"
setTextTrigger toobig :toobig "since it couldn't possibly stand the stress of landing."
setTextLineTrigger quasar :quasar "The console reports damages of"
setTextLineTrigger fighters :fighters "Combat computer reports damages of"
setTextTrigger shields :shields "You have to destroy the Planetary Shields"
setTextTrigger figprompt :figprompt "You have to destroy the fighters"
setTextTrigger podded :podded "Life Support knocked out!"
setTextTrigger trader :traderblock "blocks your attempt to enter orbit."
setTextTrigger pause :ld_pause "[Pause]"
pause

:onplanet
killtrigger pause
killtrigger podded
killtrigger shields
killtrigger noplanet
killtrigger registry
killtrigger quasar
killtrigger fighters
killtrigger toobig
killtrigger figprompt
killtrigger trader
getWord CURRENTLINE $planetResult 2
stripText $planetResult "#"
setTextTrigger cit :citadel "Planet has a level"
setTextTrigger nocit :nocit "Planet command"
pause

:citadel
killtrigger nocit
send "c"
setVar $pprompt "Citadel"
return

:nocit
killtrigger cit
setVar $pprompt "Planet"
return

:ld_pause
send "*"
setTextTrigger pause :ld_pause "[Pause]"
pause

:enterpnum
killtrigger pause
killtrigger podded
killtrigger shields
killtrigger landed
killtrigger noplanet
killtrigger registry
killtrigger quasar
killtrigger fighters
killtrigger toobig
killtrigger figprompt
killtrigger trader
setTextLineTrigger num :num "   <"
setTextTrigger done :badPnum "Land on which planet"
pause

:num
killtrigger done
getText CURRENTLINE $tstnum "   <" ">"
stripText $tstnum " "
echo $tstnum
if ($pnum = $tstnum)
	send $pnum "*"
	goto :landtrig
else
	goto :enterpnum
end

:noplanet
killtrigger pause
killtrigger shields
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger landed
killtrigger figprompt
killtrigger podded
killtrigger trader
setVar $planetResult 0
return

:badPnum
killtrigger shields
killtrigger num
send "q*"
setVar $planetResult "-1"
return

:toobig
killtrigger pause
killtrigger shields
killtrigger noplanet
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger landed
killtrigger figprompt
killtrigger podded
killtrigger trader
send "q*"
setVar $planetResult "-3"
return

:quasar
send "*"
getWord CURRENTLINE $qdamage 6
setTextLineTrigger quasar :quasar "The console reports damages of"
pause

:fighters
send "*"
getWord CURRENTLINE $fdamage 6
setTextLineTrigger fighters :fighters "Combat computer reports damages of"
pause

:figprompt
killtrigger pause
killtrigger shields
killtrigger onplanet
killtrigger noplanet
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger figprompt
killtrigger landed
killtrigger podded
killtrigger trader
setTextLineTrigger numfigs :numfigs "Fighters: "
pause

:numfigs
getWord CURRENTLINE $pfigs 4
send "r"
setVar $planetResult "-2"
return

:shields
killtrigger pause
killtrigger shields
killtrigger onplanet
killtrigger noplanet
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger figprompt
killtrigger landed
killtrigger podded
killtrigger trader
setTextLineTrigger numshields :pshields " / Shields"
pause

:pshields
getWord CURRENTLINE $pshields 5
send "r"
setVar $planetResult "-2"
return

:podded
killtrigger pause
killtrigger shields
killtrigger onplanet
killtrigger noplanet
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger figprompt
killtrigger landed
killtrigger podded
killtrigger trader
setVar $planetResult "-4"
return

:traderblock
killtrigger pause
killtrigger shields
killtrigger onplanet
killtrigger noplanet
killtrigger registry
killtrigger toobig
killtrigger quasar
killtrigger fighters
killtrigger figprompt
killtrigger landed
killtrigger podded
killtrigger trader
getWord CURRENTLINE $blocker 1
setVar $planetResult "-5"
return

#$planetResult
#0 = No planets
#-1 = Wrong Pnum
#-2 = Defended by enemy
#-3 = Too Big
#-4 = Blew Up
#-5 = Trader Block
#$blocker	-	Person who is blocking your land
#$pshields	-	Amount of shields blocking planet
#$pfigs		-	Amount of figs guarding planet
#$fdamage	-	Amount of damage taken by attacking fighters
#$qdamage	-	Amount of damage taken by quasar cannon
#######################

##################################################################
:pwarp
send "p"
setTextTrigger entsec :pw_entsec "What sector do you want to warp thi"
setTextTrigger nopw :pw_nopw "This Citadel does not have a Planetary"
pause

:pw_entsec
killtrigger nopw
send $pwarpto "*"
setTextTrigger blind :pw_blind "You cannot "
setTextTrigger good :pw_good "All Systems Ready, shall we engage?"
setTextTrigger nofuel :pw_nofuel "You do not have enough"
pause

:pw_nopw
killtrigger entsec
setVar $pwarpto "-1"
return

:pw_blind
killtrigger good
killtrigger nofuel
setVar $pwarpto "-2"
return

:pw_nofuel
killtrigger blind
killtrigger good
setVar $pwarpto "-3"
return

:pw_good
killtrigger blind
killtrigger nofuel
send "y"
return