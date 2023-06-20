#=---------------- Prompt Check ------------------------------
getWordPos CURRENTLINE $pos "Command [TL="
if ($pos <> 1)
   Echo "**   " & ANSI_12 & "Must Start At Command Prompt**"
   halt
end

#=---------------- CN1 Check ---------------------------------
getWordPos CURRENTANSILINE $pos #27
   if ($pos = 0)
      send " c n 1 q q "
      waitfor "Command [TL="
      end

#=---------------- CN9 Check ---------------------------------
send "?d"
setTextTrigger ALLKEYS_OFF :ALLKEYS_OFF "=-=-=-=-=-=-=-="
setTextTrigger ALLKEY_ON :ALLKEY_ON "Warps to Sector(s) : "
pause

:ALLKEYS_OFF
killTrigger ALLKEYS_OFF
setVar $ALLKEYS_OFF TRUE
pause

:ALLKEY_ON
killAllTriggers
if ($ALLKEYS_OFF = FALSE)
   send " c n 9 q q "
   waitfor "<Computer deactivated>"
end

setArray $Lines 10 1
setVar $i 1

#=----------------- Get Planet Catalog --------------------------
send " CJ?QQ "
waitfor "Which planet type are you interested in"
setTextLineTrigger Done	:Done "<Q> To Leave"

:ScanningLine
setTextLineTrigger LineTrig :LineTrig
pause

:LineTrig
killTrigger LineTrig
setVar $temp CURRENTLINE
if ($temp <> "")
   setVar $temp CURRENTANSILINE
   replaceText $temp "  [0m" "^^"
   setVar $temp $temp & "@@"
   getText $temp $Lines[$i][1] "^^"  "@@"
   getText $temp $Lines[$i] "<[32m" "[35m>"
   stripText $Lines[$i][1] #10
   stripText $Lines[$i][1] #13
   add $i 1
end

goto :ScanningLine

:Done
killAllTriggers

#=------------------- Display Catalog Menu -----------------------------
Echo #27 & "[2J"
Echo "***"
Echo ANSI_15 & "  Select A Planet-Type To Create**"
setVar $ii 1
while ($ii < $i)
   Echo "  " & ANSI_5 & "<" & ANSI_6 & $Lines[$ii] & ANSI_5 & ">" & #9 & $Lines[$ii][1] & "*"
   add $ii 1
end
Echo "*"
getConsoleInput $selection SINGLEKEY
upperCase $selection
setVar $ii 1
while ($ii < $i)
   if ($Lines[$ii] = $selection)

#=------------- Valid Menu Selection Made --------------------------------
   :LetsGoAgain
    send "u y"
    setTextLineTrigger NoOverLoad :NoOverload "What do you want to name this planet?"
    setTextLineTrigger Yikes :Yikes "I'm sorry, but not enough free matter exists."
    setTExtLineTrigger NeedGenTs :NeedGenTs "You don't have any Genesis Torpedoes to launch!"
    setTextTrigger OverLoad :Overload "Do you wish to abort?"
    pause

   :NeedGenTs
    killAllTriggers
    send " Q "
    Echo "**" & ANSI_14 & "Cannot Pop A Planet" & ANSI_15 & " - Out Of Genesis Torpedoes.**"
    halt

   :Yikes
    killAllTriggers
    Echo "**" & ANSI_14 & "Bad News" & ANSI_15 & " - Game Maximum Planets Reached.**"
    halt

   :Overload
    killTrigger Overload
    send "n"
    pause

   :NoOverload
    killAllTriggers
    getWordPos CURRENTANSILINE $pos $Lines[$ii][1]
    if ($pos = 0)
       getRnd $PTag 100000 999999
       setVar $PlanetLabel "LONESTAR'S PROJECT GENESIS=" & $PTag
       send $PlanetLabel & "*"
    else
       send "Presto!*"
       setVar $PlanetLabel ""
    end

#=------------------------ Planet's Been Popped --------------------------------------
   setTextTrigger MakingItCorp :MakingItCorp "Should this be a (C)orporate planet or (P)ersonal planet? "
   setTextTrigger LetsGo		:LetsGo "Command [TL="
   pause

   :MakingItCorp
    killTrigger MakingItCorp
    send "C"
    pause

   :LetsGo
    killAllTriggers
    if ($PlanetLabel <> "")
       send "L"
       setTextLineTrigger Plisted :Plisted "-----------------------------------------------"
       setTextTrigger Landed :Landed "Planet command (?="
       pause

   :Plisted
    killTrigger PListed
    waitfor "> " & $PlanetLabel
    getText CURRENTLINE $landing "<" ">"
    striptext $landing " "
    send $landing & "*"
    pause

   :Landed
    killAllTriggers
    send "  Z  D  Y  "
    setTextLineTrigger NoDets	:NoDets "You do not have any Atomic Detonators!"
    setTextTrigger KaBoom		:KaBoom "Command [TL="
    pause

   :NoDets
    killTrigger NoDets
    send " Q  Q "
    Echo "**" & ANSI_14 & "Out Of Atomic Dets**"
    halt

   :KaBoom
    killAllTriggers
    goto :LetsGoAgain
 end
#=--------------------------- Desired Planet Created ----------------------
halt
end
add $ii 1
end
Echo "**" & ANSI_14 & "Nothing To Do!**"
halt