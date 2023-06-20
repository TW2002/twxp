# More scripts and info at http://www.navhaz.com

echo ANSI_12 & "**Dnyarri's FedEcho active."
send " *  "

:set_fed_trigger
     killtrigger fedtest
     setTextLineTrigger fedtest :fedtest "F"
pause

:fedtest
     getWord CURRENTLINE $firstword 1
     if ($firstword <> "F")
          goto :set_fed_trigger
     end
     cutText CURRENTLINE $echo_string 10 999
     replaceText $echo_string #42 ""
     replaceText $echo_string "^" ""
     send "`" & $echo_string & "*"
goto :set_fed_trigger
