#GPMaker V.40 By Kaus
#Do what you want with it just give the original maker credit (I.E. Me Kaus)
#-----------------------Check Prompt------------------------------ 
reqRecording 
logging off 
 cutText CURRENTLINE $location 1 12 
 if ($location <> "Command [TL=") 
         echo ANSI_6 "**" "Your Not at the Command Prompt!!! Halting" "**" 
  halt 
 end 
#----------------------Anti Theft---------------------------------

#----------------------Anti Spoof---------------------------------
#------------Set Variables And Load Persistant Variables---------- 
 loadVar $GPMakerSaved 
 if ($GPMakerSaved) 
  loadVar $Type 
  loadVar $Stardock 
  loadVar $StardockRed 
  loadVar $Cabal 
  loadVar $RCabal 
  
 else 
  setVar $Type FALSE
  setVar $Stardock FALSE 
  setVar $StardockRed FALSE 
  setVar $Cabal FALSE 
  setVar $RCabal FALSE 
     
  saveVar $Type 
  saveVar $Stardock  
  saveVar $StardockRed  
  saveVar $Cabal 
  saveVar $RCabal 
   
  
  setVar $GPMakerSaved TRUE 
  saveVar $GPMakerSaved 
 end 
SetVar $PlanetIndex 1
SetVar $Dets 5
SetVar $Amount 50000
SetVar $currentSector CURRENTSECTOR
SetVar $Base CURRENTSECTOR
SetVar $SD STARDOCK
SetVar $HMany 1
#---------------------------Restrictions *Dummy Proof*---------------------------- 
if (SECTOR.FIGS.QUANTITY[$currentSector] = 0)
  echo "**" & ANSI_12 "There Must Be At Least One Fig To Twarp To" & "**"
  halt
 end
if (PORT.EXISTS[$currentSector] = 0)
  echo "**" & ANSI_12 "You Must Be Under a Port" & "**"
  halt
 end 
If (PORT.CLASS[$currentSector] = "1")
  Echo ANSI_12 "**Wrong Port Type must Be Under A SXX Port"
  Halt
End 
If (PORT.CLASS[$currentSector] = "2")
  Echo ANSI_12 "**Wrong Port Type must Be Under A SXX Port"
  Halt
End 
If (PORT.CLASS[$currentSector] = "6")
  Echo ANSI_12 "**Wrong Port Type must Be Under A SXX Port"
  Halt
End 
If (PORT.CLASS[$currentSector] = "8")
  Echo ANSI_12 "**Wrong Port Type must Be Under A SXX Port"
  Halt
End 
#---------------------------Initialize----------------------------
getCourse $Loop $Base $SD
getCourse $Loop2 $SD $Base
Add $Total ($Loop  + $Loop2)
Multiply $Total 3
SetVar $OreAmount $Total
SaveVar $OreAmount
Send "Cn"
Send "jy"
setTextLineTrigger cnAni :CNAni "Animation display"
  pause
:CNAni
GetWord CURRENTLINE $Display 5
  If ($Display = "On")
 Send "n2qq"
 WaitFor "Command [TL=" 
  Else
 Send "qq"
 WaitFor "Command [TL="
end
Send "Tt"
SetTextlineTrigger CorpChk :CorpChk "not on a Corp."
SetTextlineTrigger CorpChk1 :CorpChk1 "Corporate M.A.I.L."
  pause
:CorpChk
SetVar $CorpPlanet "*"
send "q"
Goto :Cj
:CorpChk1
SetVar $CorpPlanet "*c"
send "*q"
Goto :Cj
:Cj
Send "cj?" 
GoSub :PlanetTypes 
send " q q " 
send "I"
Gosub :AlignCheck
Gosub :AntiFlee
Gosub :ClearScreen 
#-------------------------------Menu------------------------------ 
addMenu "" "MainMenu" ANSI_15 & "Gold Planet Maker Version .50" "." "" "Main Menu" FALSE 
addMenu "MainMenu" "Execute" ANSI_11 & "Execute" "X" :Menu_Exec "" TRUE 
addMenu "MainMenu" "Type" ANSI_11 & "What Type?" "1" ":Type" "" FALSE 
addMenu "MainMenu" "Dets" ANSI_11 & "How Many Dets/Torps to Get?" "4"  ":Dets" "" FALSE
addMenu "MainMenu" "Name" ANSI_11 & "What To Name It?" "2" :Name "" FALSE 
addMenu "MainMenu" "HowMany" ANSI_11 & "How Many To Make?" "3" :HMany "" FALSE
addmenu "MainMenu" "Credits" ANSI_11 & "Minimum Credit Level?" "5" ":Credits" "" FALSE 
###addmenu "MainMenu" "SD" ANSI_11 & "Warp To SD To Refill?" "" ":SD" "" FALSE 
###addmenu "MainMenu" "Cabal" ANSI_11 & "Work Backwards?" "" ":Cabal" "" FALSE 
###addmenu "MainMenu" "RedMenu" ANSI_12 & "Red Options" "" "" "" FALSE 
#RedMenu 
addMenu "" "RedMenu" ANSI_12 & "Red Options" "." "" "Mode Options" FALSE 
addMenu "RedMenu" "Warn" ANSI_6 & "Must Have A Complete ZTM To Use!" "!" :Warn "" FALSE 
addMenu "RedMenu" "RedSD" ANSI_12 & "Refill Off Sd?" "1" :RedSD "" FALSE 
addmenu "RedMenu" "RCabal" ANSI_12 & "Work Backwards?" "2" ":RCabal" "" FALSE 
addMenu "RedMenu" "Return" ANSI_11 & "Return" "R" :Return "" FALSE 
#-----------------------------Menu Options--------------------------- 
setmenuoptions "MainMenu" FALSE FALSE TRUE 
setmenuoptions "RedMenu" FLASE FALSE TRUE 
#------------------------------Menu Help------------------------------ 
setmenuhelp "Execute" "Start the script" 
setmenuhelp "Type" "Choose your planet type" 
setmenuhelp "Credits" "Lowest amount of credits to have left" 
##setmenuhelp "SD" "Warp to Stardock to refill genesis torpedos and atomic detonators" 
setmenuhelp "RedSD" "Warp to closest fig near Stardock and Lawnmow to Stardock" 
setmenuhelp "RedMenu" "Options for a red player" 
setmenuhelp "Return" "Return to the previous Menu" 
####setmenuhelp "Cabal" "Use The Backwards Formula as Shown On Tw-Cabal.com.. Requires a Empty sector" 
setmenuhelp "RCabal" "Use The Backwards Formula as Shown On Tw-Cabal.com.. Requires a Empty sector" 
#------------------------------Menu Values---------------------------- 
##setMenuValue "SD" ANSI_14 & "No"   
setMenuValue "RedSD"  ANSI_14 & "No"   
setMenuValue "Dets" ANSI_14 & "5"
setMenuValue "Credits" ANSI_14 & "50000"   
setMenuValue "HowMany" ANSI_14 & "1"
##setMenuValue "Cabal" ANSI_14 & "NO"   
##setMenuValue "RCabal" ANSI_14 & "NO"  
setMenuValue "Type" $planets[1]
Gosub :ClearScreen 
openmenu "MainMenu" 
#-----------------------------MEnu Values2---------------------------
:Type 
Gosub :ClearScreen 
if ($PlanetIndex = $PlanetCount)
  SetVar $PlanetIndex 1
 else
  add $PlanetIndex 1
end 
Gosub :SetMenu 
openMenu "MainMenu"

:HMany
 GetInput $HMany "How Many Planets To Make?"
    SetmenuValue "HowMany" $HMany
    isNumber $HMany2 $Hmany
  If ($HMany2 = 0)
  echo ANSI_12 "**Please Input A Number!*"
  Goto :Hmany
end    
Gosub :ClearScreen
openMenu "MainMenu"

:Dets
 GetInput $Dets  "How Many Torp/Dets To Buy?"
    SetmenuValue "Dets" $Dets 
    isNumber $DetTest $Dets 
 if ($DetTest = 0)
 echo ANSI_12 "**Please Input A Number!*"
  Goto :Dets
end
Gosub :ClearScreen
openMenu "MainMenu"
 
:Credits 
 GetInput $Amount  "Minimum Credit Amount?" 
    SetmenuValue "Credits" $Amount
    isNumber $CredTest $Amount
 if ($CredTest = 0)
 echo ANSI_12 "**Please Input A Number!*"
 Goto :Credits
end 
Gosub :ClearScreen
openMenu "MainMenu" 
 
:Name
 GetInput $PlanetName "What To Name The Planet?"
 SetMenuValue "Name" $PlanetName
If ($PlanetName = "")
 echo ANSI_12 "**Please Pick A Name!*"
 goto :Name
end 
Gosub :ClearScreen
openmenu "MainMenu" 
 
:Cabal 
Gosub :ClearScreen 
if ($Cabal) 
  setVar $Cabal False 
 else 
  setVar $Cabal TRUE 
 end 
Gosub :SetMenu 
openmenu "MainMenu" 
 
:RCabal 
Gosub :Clearscreen 
if ($RCabal) 
  setVar $RCabal False 
 else 
  setVar $RCabal TRUE 
 end 
Gosub :SetMenu 
openmenu "RedMenu" 
 
:SD 
Gosub :ClearScreen 
if ($Stardock) 
  setVar $Stardock FALSE 
 else 
  setVar $Stardock TRUE 
 end 
Gosub :SetMenu 
openmenu "MainMenu" 
 
:RedSD 
Gosub :ClearScreen 
if ($StardockRed) 
    setVar $StardockRed FALSE 
  else 
    setVar $StardockRed TRUE 
  end 
Gosub :SetMenu 
Gosub :ClearScreen 
openmenu "RedMenu" 
 
:Warn 
Halt 
 
:Return 
Gosub :ClearScreen 
openmenu "MainMenu" 
#----------------------*Bulk Code*------------------------------
:Menu_Exec 
KillAllTriggers
Send "/"
Settextlinetrigger CurCredits :CCredits "Creds"
Pause
:CCredits
Getword CURRENTLINE $CCredits 4
Striptext $CCredits "³Figs"
Striptext $CCredits ","
If ($CCredits < $Amount)
Echo ANSI_12 "**Minimum Credit Limit Hit!**"
Halt
 Else
end
SetVar $DetsCount $Dets
If (PORT.CLASS[$currentSector] = "3")
  Send "P T" & $OreAmount & "**"
  Goto :Warp
End  
If (PORT.CLASS[$currentSector] = "4")
  Send "P T" & $OreAmount & "**"
  Send "0*"
  Goto :Warp
End 
If (PORT.CLASS[$currentSector] = "5")
  Send "P T" & $OreAmount & "**"
  Send "0*"
  Send "0*"
  Goto :Warp
End  
If (PORT.CLASS[$currentSector] = "7")
  Send "P T" & $OreAmount & "**"
  Send "0*"
  Send "0*"
  Goto :Warp
End 
:Warp
Send "M" & $SD & "*"
Waitfor "Do you want to engage" 
Send "Y"
Settextlinetrigger Yes1 :Cont "Locating beam"
Settextlinetrigger No :No "No locating beam found"
 Pause
:No
Echo ANSI_12 "**No Fig Found To Warp To Halting"
Halt
:Cont
GetWord CURRENTLINE $Locked 5
StripText $Locked "."
If ($Locked = "Locked")
 Send "Y* "
  Else
 Halt
end
WaitFor "Command [TL" 
Send "p s h t "
Send $Dets & "*"
Send "a"
Send $Dets & "* q q"
WaitFor "Command [TL"
Send "M" & $Base & "*"
Waitfor "Do you want to engage" 
Send "Y"
Settextlinetrigger Yes1 :Cont1 "Locating beam"
Settextlinetrigger No1 :No1 "No locating beam found"
 Pause
:No1
Echo ANSI_12 "**No Fig Found To Warp To Halting"
Halt 
:Cont1
GetWord CURRENTLINE $Locked1 5
StripText $Locked1 "."
If ($Locked1 = "Locked")
  Send "Y* "
End
WaitFor "Command [TL"
 
:PlanetCycle
KillAllTriggers
Send "uy"
Settextlinetrigger Match :Match "name this planet? ("
Settextlinetrigger Overload :OverL "hazardous to place more than"
Pause
:OverL
Send "y"
Echo ANSI_12 "**To Many Planets In Sector Halting"
Halt
:Match
Getword CURRENTLINE $Match 11
StripText $Match "("
StripText $Match ")"
If ($Match = $planets[$PlanetIndex])
 Goto :Nameing
Else
 Send "GP_Maker V.50" & $CorpPlanet
 Goto :Jump
End
 
:Nameing
Subtract $Hmany 1
If ($PlanetName = 0)  
 Send $Match & " Planet" & $CorpPlanet
Else
 Send $PlanetName & $CorpPlanet
End
If ($Hmany = 0)
 Echo ANSI_12 "**Number Of Planets Reached"
 halt
Else
 Goto :Menu_Exec 
End
:Jump
send "L"
SetTextLineTrigger Destro :Destroy "> GP_M"
Pause
 
:Destroy
GetWord CURRENTLINE $Destroy 2
StripText $Destroy ">"
Send $Destroy & "*"
Send "z d y "
Subtract $Detscount 1
If ($Detscount = 0)
 Goto :Menu_Exec
Else
 Goto :PlanetCycle 
end
Halt
#-----------------------*SubMenus*------------------------------ 
#-------------------Find planet Types--------------------------- 
:PlanetTypes 
killallTriggers 
setTextLineTrigger getSec :getSec "> Class" 
setTextTrigger allDone :allDone "<Q> To Leave" 
pause 
 
:getSec 
add $planetcount 1 
getWord CURRENTLINE $planets[$planetcount] 4 
goto :PlanetTypes 
 
:allDone 
return 
#-----------------------Clear Screen----------------------------- 
:ClearScreen 
 echo #27 & "[2J" 
return 
#-----------------------Align Check------------------------------
:AlignCheck
Settextlinetrigger Align1 :Align " Alignment"
 Pause
 
:Align
GetWord Currentline $Aln 7
StripText $Aln "Alignment"
StripText $Aln "="
StripText $Aln ","
If ($Aln > 999)
  return
else
  Echo ANSI_12 "**You Must Have 1000 Positive Alignment To Use This Script"
  halt 
end
#-----------------------Anti Flee----------------------------------
:AntiFlee
Send "\"
Settextlinetrigger Anti :Anti "Online Auto Flee"
 Pause
 
:Anti
Getword Currentline $Ant 5
 If ($Ant = disabled)
  Else
 Send "\"
end
 Return
##################################################################
#-----------------------Menu Options-----------------------------# 
:SetMenu 
#----------------------Planet Toggle-----------------------------
setMenuValue "Type" $planets[$PlanetIndex]
return  
#----------------------Stardock Toggle--------------------------- 
if ($Stardock) 
  setMenuValue "SD" ANSI_14 & "Yes"   
 else 
  setMenuValue "SD" ANSI_14 & "No"   
 end 
#------------------Red Stardock Toggle---------------------------- 
if ($StardockRed) 
    setMenuValue "RedSD"  ANSI_14 & "Yes"   
  else 
    setMenuValue "RedSD"  ANSI_14 & "No"  
  end 
#-------------------Cabal Toggle----------------------------------- 
if ($Cabal) 
    setMenuValue "Cabal" ANSI_14 & "Yes"   
   else 
    setMenuValue "Cabal" ANSI_14 & "No"   
   end 
#-------------------Red Cabal Toggle------------------------------- 
if ($RCabal) 
    setMenuValue "RCabal" ANSI_14 & "Yes"   
   else 
    setMenuValue "RCabal" ANSI_14 & "No"   
   end 

