openMenu TWX_TOGGLEDEAF false
openMenu TWX_LOCALECHO false
closeMenu
setVar $START_FIG_HIT "Deployed Fighters Report Sector "
setVar $END_FIG_HIT   ":"
setVar $ALIEN_ANSI    #27 & "[1;36m" & #27 & "["
setVar $START_FIG_HIT_OWNER ":"
setVar $END_FIG_HIT_OWNER "'s"

setTextLineTrigger fighter :fighter $START_FIG_HIT
setTextLineTrigger waiting :filter
settexttrigger reecho :reEcho
setTextOutTrigger enter :enter #13
pause

:filter
       if ($fighterBlank = FALSE)
               echo #27&"[255D"&#27&"[K"&CURRENTANSILINE&#27&"[0;1;37;40m"
       end
       setVar $fighterBlank FALSE
       setTextLineTrigger waiting :filter
       pause
:enter
	echo #27&"[0m*"
	send #13
	setTextOutTrigger enter :enter #13
	pause
:reEcho
       echo #27&"[255D"&#27&"[255B"&#27&"[K"&CURRENTANSILINE
       settexttrigger reecho :reEcho
       pause

:fighter
       getText CURRENTANSILINE $alien_check $START_FIG_HIT_OWNER $END_FIG_HIT_OWNER
       getWordPos CURRENTLINE $pos $START_FIG_HIT_OWNER
       getWordPos $alien_check $apos $ALIEN_ANSI
       if (($apos > 0) OR ($pos = 0))
               setVar $fighterBlank TRUE
       else
               echo CURRENTANSILINE
       end
       setTextLineTrigger fighter :fighter $START_FIG_HIT
       pause
