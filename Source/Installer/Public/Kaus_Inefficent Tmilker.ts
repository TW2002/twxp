####Inefficent TMilker
###By: Kaus
##Version 1.0
Setvar $Terra 1 
Setvar $Home CURRENTSECTOR 
Echo "**SCRIPT ASSUMES YOU HAVE A VALID ZTM!!!"
Echo "*YOU MUST BE FEDSAFE/HAVE A FIG/PLANET IN YOUR SECTOR"
GetInput $PlanetNum "Which Planet?" 
GetInput $ColoAmt "Amount of colonists to grab per landing?"
GetInput $Cycles "Amount of Cycles (Times between Terra and your Base) you want this to run?"
Send "*" 
#---------Prompt Check---------------
Getword CURRENTLINE $PromptCheck 1 
 If ($Promptcheck <> "Command") 
Echo "**Must Start From Command Prompt!!!"
  Halt 
 End 
#--------CN9 Check-------------------
Send "Cn" 
setTextLineTrigger cnAni :CNAni "Animation display" 
  pause 
:CNAni 
GetWord CURRENTLINE $Display 5 
  If ($Display = "On") 
   Send "n2qq" 
  Else 
   Send "qq"
end
Send "Cn"
setTextLineTrigger cnKeys :cnKeys " Abort display"
  pause
:cnKeys
GetWord CURRENTLINE $Display1 7
  If ($Display1 = "ALL")
   Send "n9qq"
  Else
   Send "qq"
end
#---------Calc Distance/Set Macro----
Getdistance $route $Home $Terra 
Getdistance $route1 $Terra $Home
Multiply $route 3
Multiply $route1 3
Add $route2 ($route + $route1)
Send "jy"
Setvar $Macro1 "l " & $planetnum & "* t n t 1 " & $route2 & "* q m " & $Terra  & "* y y "
Setvar $Macro2 "m " & $home & "* y y l " & $Planetnum & "* s n l 1 * "
#---------Check Hold Number--------
Settextlinetrigger Holds :Holds "³Hlds" 
Send "*" 
Waitfor "Command [TL"
Send "/" 
pause 
:Holds 
Getword CURRENTLINE $Holds 7 
Striptext $Holds "³Ore" 
killtrigger Holds
Setvar $Holds1 $Holds
Subtract $holds1 10
#---------Main Code-----------------
:Go
If ($Cycles = 0)
 Halt
  end
Send $Macro1
#--------Start Land Sequence Loop----
:Go1
setDelayTrigger delay :Cont 1000
pause
:Cont
killtrigger delay
#--------Check Colos-----------------
Settextlinetrigger colo :colo "There are currently"
Send "l1*"
Pause 
:colo
killtrigger colo
#------Check For Spoof---------------
GetWord CURRENTLINE $Spoof2 1 
If ($Spoof2 = "F") Or ($Spoof2 = "P") 
Echo ANSI_12 "*Spoof Attempt"
send "q"
Goto :Go1 
End 
#-----Compare Colos Terra vs our number-
Getword CURRENTLINE $Tcolos 4 
If ($Tcolos > ($Holds - $route2))
  Send "t*"
end

If ($Tcolos > $Coloamt) or ($Tcolos = $Coloamt)
  Send "t " & $Coloamt "*"
 Else
Send "q"
end
#---------Check Holds------------------
Send "/"
Settextlinetrigger CH :CH "³Col"
pause
:CH
Getword CURRENTLINE $CH1 4
Striptext $CH1 "³Phot"
Killtrigger CH
If (($CH1 + $Route1) > $Holds1)
 Send $Macro2
  Subtract $Cycles 1
   Goto :Go
  Else
Goto :Go1
End








