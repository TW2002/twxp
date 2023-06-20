setVar $prev "-1"
delete GAMENAME & "_PSPECS.txt"
cutText CURRENTLINE $location 1 10
if ($location <> "Trade Wars")
	clientMessage "This Script must be run from the TWGS Admin TEDIT."
	halt
end
send "2"

:planetspecs
setTextLineTrigger nline :nline "ID : "
setTextLIneTrigger cline :cline "<@> Reset"
setTextLineTrigger fprod :fprod "<C> Colonists producing fuel ore"
setTextLineTrigger oprod :oprod "<D> Colonists producing organics"
setTextLineTrigger eprod :eprod "<E> Colonists producing equipment"
setTextLineTrigger fcap :fcap "<F> Storage capacity for fuel ore"
setTextLineTrigger ocap :ocap "<H> Storage capacity for organics"
setTextLineTrigger ecap :ecap "<I> Storage capacity for equipment"
setTextLineTrigger figcap :figcap "<J> Storage capacity for fighters"
setTextLineTrigger shicap :shicap "<K> Storage capacity for shields"
pause

:nline
getText CURRENTLINE $id "ID : " "<A>"
stripText $id " "
getText CURRENTLINE $ptitle "<A> Title" "<+>"
getWordPos $ptitle $pos "   "
cutText $ptitle $ptitle 1 $pos
pause

:cline
getText CURRENTLINE $class "<B> Class " "Subclass"
stripText $class " "
getText CURRENTLINE $subclass "Subclass " "<!>"
stripText $subclass " "
if ($subclass <> "None")
	setVar $class $class & "-" & $subclass
end
pause

:fprod
cutText CURRENTLINE $fuelcolos 38 15
stripText $fuelcolos " "
pause

:oprod
cutText CURRENTLINE $orgcolos 38 15
stripText $orgcolos " "
pause

:eprod
cutText CURRENTLINE $equipcolos 38 15
stripText $equipcolos " "
pause

:fcap
cutText CURRENTLINE $fuelcap 38 15
stripText $fuelcap " "
pause

:ocap
cutText CURRENTLINE $orgcap 38 15
stripText $orgcap " "
pause

:ecap
cutText CURRENTLINE $equipcap 38 15
stripText $equipcap " "
pause

:figcap
cutText CURRENTLINE $figcap 38 15
stripText $figcap " "
pause

:shicap
cutText CURRENTLINE $shicap 38 15
stripText $shicap " "
send "2"
setTextLineTrigger oreprod :oreprod "<C> Colonists to produce one fuel unit"
setTextLineTrigger orgprod :orgprod "<D> Colonists to produce one organic unit"
setTextLineTrigger equipprod :equipprod "<E> Colonists to produce one equipment unit"
setTextLineTrigger figprod :figprod "<F> Colonists to produce one fighter unit"
pause

:oreprod
cutText CURRENTLINE $oreprod 47 15
stripText $oreprod " "
pause

:orgprod
cutText CURRENTLINE $orgsprod 47 15
stripText $orgsprod " "
pause

:equipprod
cutText CURRENTLINE $equipprod 47 15
stripText $equipprod " "
pause

:figprod
cutText CURRENTLINE $figprod 47 15
stripText $figprod " "
send "3"

setTextLineTrigger cfuel :cfuel "Fuel ore"
setTextLineTrigger corgs :corgs "Organics"
setTextLineTrigger cequip :cequip "Equipment"
setTextLineTrigger cdays :cdays "Days"
setTextLineTrigger ccolos :ccolos "Colonists"

:cfuel
getText CURRENTLINE $l1 "<C> " "<I>"
getText CURRENTLINE $l2 "<I> " "<N>"
getText CURRENTLINE $l3 "<N> " "<T>"
getText CURRENTLINE $l4 "<T> " "<Y>"
getText CURRENTLINE $l5 "<Y> " "<7>"
getWordPos CURRENTLINE $pos "<7>"
add $pos 4
cutText CURRENTLINE $l6 $pos 6
setVar $cfuel "  " & $l1 & "  " & $l2 & "  " & $l3 & "  " & $l4 & "  " & $l5 & "  " & $l6
pause

:corgs
getText CURRENTLINE $l1 "<D> " "<J>"
getText CURRENTLINE $l2 "<J> " "<O>"
getText CURRENTLINE $l3 "<O> " "<U>"
getText CURRENTLINE $l4 "<U> " "<Z>"
getText CURRENTLINE $l5 "<Z> " "<8>"
getWordPos CURRENTLINE $pos "<8>"
add $pos 4
cutText CURRENTLINE $l6 $pos 6
setVar $corg "  " & $l1 & "  " & $l2 & "  " & $l3 & "  " & $l4 & "  " & $l5 & "  " & $l6
pause

:cequip
getText CURRENTLINE $l1 "<E> " "<K>"
getText CURRENTLINE $l2 "<K> " "<P>"
getText CURRENTLINE $l3 "<P> " "<V>"
getText CURRENTLINE $l4 "<V> " "<0>"
getText CURRENTLINE $l5 "<0> " "<9>"
getWordPos CURRENTLINE $pos "<9>"
add $pos 4
cutText CURRENTLINE $l6 $pos 6
setVar $cequip "  " & $l1 & "  " & $l2 & "  " & $l3 & "  " & $l4 & "  " & $l5 & "  " & $l6
pause

:cdays
getText CURRENTLINE $l1 "<F> " "<L>"
getText CURRENTLINE $l2 "<L> " "<R>"
getText CURRENTLINE $l3 "<R> " "<W>"
getText CURRENTLINE $l4 "<W> " "<5>"
getText CURRENTLINE $l5 "<5> " "<;>"
getWordPos CURRENTLINE $pos "<;>"
add $pos 4
cutText CURRENTLINE $l6 $pos 6
setVar $cdays "  " & $l1 & "  " & $l2 & "  " & $l3 & "  " & $l4 & "  " & $l5 & "  " & $l6
pause

:ccolos
getText CURRENTLINE $l1 "<H> " "<M>"
getText CURRENTLINE $l2 "<M> " "<S>"
getText CURRENTLINE $l3 "<S> " "<X>"
getText CURRENTLINE $l4 "<X> " "<6>"
getText CURRENTLINE $l5 "<6> " "<[>"
getWordPos CURRENTLINE $pos "<[>"
add $pos 4
cutText CURRENTLINE $l6 $pos 6
setVar $ccolos "  " & $l1 & "  " & $l2 & "  " & $l3 & "  " & $l4 & "  " & $l5 & "  " & $l6




write GAMENAME & "_PSPECS.txt" "Planet : " & $ptitle & " " & $class
write GAMENAME & "_PSPECS.txt" "Max Fuel        : " & $fuelcap
write GAMENAME & "_PSPECS.txt" "Max Orgs	: " & $orgcap
write GAMENAME & "_PSPECS.txt" "Max Equip	: " & $equipcap
write GAMENAME & "_PSPECS.txt" "Max Colos Fuel	: " & $fuelcolos & " To Make 1 : " & $oreprod
write GAMENAME & "_PSPECS.txt" "Max Colos Orgs  : " & $orgcolos & " To Make 1 : " & $orgsprod
write GAMENAME & "_PSPECS.txt" "Max Colos Equip : " & $equipcolos & " To Make 1 : " & $equipprod
write GAMENAME & "_PSPECS.txt" "Fighter Capacity: " & $figcap & " To Make 1 : " & $figprod
write GAMENAME & "_PSPECS.txt" "Shield Capacity : " & $shicap
write GAMENAME & "_PSPECS.txt" " "
write GAMENAME & "_PSPECS.txt" "Citadel Values:"
write GAMENAME & "_PSPECS.txt" "---------------------------------------------------------------------------"
write GAMENAME & "_PSPECS.txt" "            Unarmed   Armed   Quasar  TransWarp Shields Interdict"
write GAMENAME & "_PSPECS.txt" " Fuel       " & $cfuel
write GAMENAME & "_PSPECS.txt" " Orgs       " & $corg
write GAMENAME & "_PSPECS.txt" " Equip      " & $cequip
write GAMENAME & "_PSPECS.txt" " Days       " & $cdays
write GAMENAME & "_PSPECS.txt" " Colos      " & $ccolos
write GAMENAME & "_PSPECS.txt" " "
if ($id = $prev)
	halt
else
	setVar $prev $id
	send "1"
	waitfor "Colonists producing fuel ore"
	waitFor "<Enter your selection>"
	send ">"
	goto :planetspecs
end






